import { describe, it, expect, vi, beforeEach } from "vitest";
import { filesRouter } from "@/server/api/routers/files";
import { TRPCError } from "@trpc/server";

// Mock Prisma
vi.mock("@/db/prisma", () => ({
  db: {
    file: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

// Mock S3
vi.mock("@/lib/s3-client", () => ({
  getPresignedUrl: vi.fn(),
  deleteFromS3: vi.fn(),
  deleteMultipleFromS3: vi.fn(),
}));

// Mock retry utility
vi.mock("@/lib/retry", () => ({
  withRetry: vi.fn((fn) => fn()),
}));

import { db } from "@/db/prisma";
import { deleteFromS3, deleteMultipleFromS3 } from "@/lib/s3-client";

describe("filesRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockContext = (userId: string) => ({
    userId,
    session: { user: { id: userId } },
  });

  describe("getUserFiles", () => {
    it("should return files for authorized user", async () => {
      const userId = "user-123";
      const mockFiles = [
        {
          id: "file-1",
          userId,
          s3Key: "resume.pdf",
          fileName: "Resume",
          fileSize: 1024,
          contentType: "application/pdf",
          uploadedAt: new Date(),
        },
      ];

      vi.mocked(db.file.findMany).mockResolvedValueOnce(mockFiles);

      const caller = filesRouter.createCaller(createMockContext(userId));
      const result = await caller.getUserFiles({ userId });

      expect(result).toEqual(mockFiles);
      expect(db.file.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it("should throw FORBIDDEN error when accessing other user's files", async () => {
      const userId = "user-123";
      const otherUserId = "user-456";

      const caller = filesRouter.createCaller(createMockContext(userId));

      await expect(
        caller.getUserFiles({ userId: otherUserId })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw error when database fails", async () => {
      const userId = "user-123";
      vi.mocked(db.file.findMany).mockRejectedValueOnce(
        new Error("Database error")
      );

      const caller = filesRouter.createCaller(createMockContext(userId));

      await expect(caller.getUserFiles({ userId })).rejects.toThrow();
    });
  });

  describe("saveFile", () => {
    it("should save file metadata to database", async () => {
      const userId = "user-123";
      const fileData = {
        s3Key: "resume.pdf",
        fileName: "Resume",
        fileSize: 1024,
        contentType: "application/pdf",
        userId,
      };

      const mockFile = {
        id: "file-1",
        ...fileData,
        uploadedAt: new Date(),
      };

      vi.mocked(db.file.create).mockResolvedValueOnce(mockFile);

      const caller = filesRouter.createCaller(createMockContext(userId));
      const result = await caller.saveFile(fileData);

      expect(result).toEqual(mockFile);
      expect(db.file.create).toHaveBeenCalledWith({
        data: fileData,
      });
    });

    it("should throw FORBIDDEN when user tries to save file for another user", async () => {
      const userId = "user-123";
      const fileData = {
        s3Key: "resume.pdf",
        fileName: "Resume",
        fileSize: 1024,
        contentType: "application/pdf",
        userId: "user-456",
      };

      const caller = filesRouter.createCaller(createMockContext(userId));

      await expect(caller.saveFile(fileData)).rejects.toThrow(TRPCError);
    });

    it("should throw error when database save fails", async () => {
      const userId = "user-123";
      const fileData = {
        s3Key: "resume.pdf",
        fileName: "Resume",
        fileSize: 1024,
        contentType: "application/pdf",
        userId,
      };

      vi.mocked(db.file.create).mockRejectedValueOnce(
        new Error("Database error")
      );

      const caller = filesRouter.createCaller(createMockContext(userId));

      await expect(caller.saveFile(fileData)).rejects.toThrow();
    });
  });

  describe("deleteFile", () => {
    it("should delete file from S3 and database", async () => {
      const userId = "user-123";
      const fileId = "file-1";

      const mockFile = {
        id: fileId,
        userId,
        s3Key: "resume.pdf",
        fileName: "Resume",
        fileSize: 1024,
        contentType: "application/pdf",
        uploadedAt: new Date(),
      };

      vi.mocked(db.file.findUnique).mockResolvedValueOnce(mockFile);
      vi.mocked(deleteFromS3).mockResolvedValueOnce(undefined);
      vi.mocked(db.file.delete).mockResolvedValueOnce(mockFile);

      const caller = filesRouter.createCaller(createMockContext(userId));
      const result = await caller.deleteFile({ id: fileId });

      expect(result.success).toBe(true);
      expect(deleteFromS3).toHaveBeenCalledWith(mockFile.s3Key);
    });

    it("should throw NOT_FOUND when file doesn't exist", async () => {
      const userId = "user-123";
      const fileId = "nonexistent";

      vi.mocked(db.file.findUnique).mockResolvedValueOnce(null);

      const caller = filesRouter.createCaller(createMockContext(userId));

      await expect(caller.deleteFile({ id: fileId })).rejects.toThrow(
        TRPCError
      );
    });

    it("should throw FORBIDDEN when deleting other user's file", async () => {
      const userId = "user-123";
      const fileId = "file-1";

      const mockFile = {
        id: fileId,
        userId: "user-456",
        s3Key: "resume.pdf",
        fileName: "Resume",
        fileSize: 1024,
        contentType: "application/pdf",
        uploadedAt: new Date(),
      };

      vi.mocked(db.file.findUnique).mockResolvedValueOnce(mockFile);

      const caller = filesRouter.createCaller(createMockContext(userId));

      await expect(caller.deleteFile({ id: fileId })).rejects.toThrow(
        TRPCError
      );
    });
  });

  describe("deleteFiles", () => {
    it("should delete multiple files", async () => {
      const userId = "user-123";
      const fileIds = ["file-1", "file-2"];

      const mockFiles = [
        {
          id: "file-1",
          userId,
          s3Key: "resume.pdf",
          fileName: "Resume",
          fileSize: 1024,
          contentType: "application/pdf",
          uploadedAt: new Date(),
        },
        {
          id: "file-2",
          userId,
          s3Key: "cv.pdf",
          fileName: "CV",
          fileSize: 2048,
          contentType: "application/pdf",
          uploadedAt: new Date(),
        },
      ];

      vi.mocked(db.file.findMany).mockResolvedValueOnce(mockFiles);
      vi.mocked(deleteMultipleFromS3).mockResolvedValueOnce(undefined);
      vi.mocked(db.file.deleteMany).mockResolvedValueOnce({
        count: 2,
      } as any);

      const caller = filesRouter.createCaller(createMockContext(userId));
      const result = await caller.deleteFiles({ ids: fileIds });

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(2);
      expect(deleteMultipleFromS3).toHaveBeenCalledWith([
        "resume.pdf",
        "cv.pdf",
      ]);
    });

    it("should throw FORBIDDEN if not all files belong to user", async () => {
      const userId = "user-123";
      const fileIds = ["file-1", "file-2"];

      const mockFiles = [
        {
          id: "file-1",
          userId,
          s3Key: "resume.pdf",
          fileName: "Resume",
          fileSize: 1024,
          contentType: "application/pdf",
          uploadedAt: new Date(),
        },
      ];

      vi.mocked(db.file.findMany).mockResolvedValueOnce(mockFiles);

      const caller = filesRouter.createCaller(createMockContext(userId));

      await expect(caller.deleteFiles({ ids: fileIds })).rejects.toThrow(
        TRPCError
      );
    });
  });
});
