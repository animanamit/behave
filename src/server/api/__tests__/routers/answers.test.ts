import { describe, it, expect, vi, beforeEach } from "vitest";
import { answersRouter } from "@/server/api/routers/answers";

// Mock dependencies
vi.mock("@/db/prisma", () => ({
  db: {
    starAnswer: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    file: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@aws-sdk/client-s3", () => ({
  GetObjectCommand: vi.fn(),
}));

vi.mock("@/lib/s3-client", () => ({
  s3Client: {
    send: vi.fn(),
  },
}));

vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

import { db } from "@/db/prisma";
import { s3Client } from "@/lib/s3-client";
import { generateObject } from "ai";

describe("answersRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockContext = (userId: string) => ({
    userId,
    session: { user: { id: userId } },
  });

  describe("getUserAnswers", () => {
    it("should return answers for the current user", async () => {
      const userId = "user-123";
      const mockAnswers = [
        {
          id: "1",
          userId,
          competency: "Leadership",
          question: "Tell me about a time you led a team",
          situation: "At my previous job...",
          task: "I needed to...",
          action: "I took...",
          result: "The outcome was...",
          fullAnswer: "Complete answer...",
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.starAnswer.findMany).mockResolvedValueOnce(mockAnswers);

      const caller = answersRouter.createCaller(createMockContext(userId));
      const result = await caller.getUserAnswers({ userId });

      expect(result).toEqual(mockAnswers);
      expect(db.starAnswer.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
    });

    it("should return empty array when accessing other user's answers", async () => {
      const userId = "user-123";
      const otherUserId = "user-456";

      const caller = answersRouter.createCaller(createMockContext(userId));
      const result = await caller.getUserAnswers({ userId: otherUserId });

      expect(result).toEqual([]);
    });

    it("should return empty array when user has no answers", async () => {
      const userId = "user-123";

      vi.mocked(db.starAnswer.findMany).mockResolvedValueOnce([]);

      const caller = answersRouter.createCaller(createMockContext(userId));
      const result = await caller.getUserAnswers({ userId });

      expect(result).toEqual([]);
    });
  });

  describe("createAnswer", () => {
    it("should create a new answer for a valid question and file", async () => {
      const userId = "user-123";
      const fileId = "file-1";
      const input = {
        question: "Tell me about a time you handled conflict",
        fileId,
        competency: "Conflict Resolution",
      };

      const mockFile = {
        id: fileId,
        userId,
        s3Key: "resume.pdf",
        fileName: "Resume",
        fileSize: 1024,
        contentType: "application/pdf",
        uploadedAt: new Date(),
      };

      const mockGeneratedAnswer = {
        competency: "Conflict Resolution",
        question: input.question,
        situation: "I was working with a teammate...",
        task: "We disagreed on the approach...",
        action: "I suggested a meeting to discuss...",
        result: "We found a compromise...",
        fullAnswer: "Complete STAR answer...",
      };

      const mockCreatedAnswer = {
        id: "answer-1",
        userId,
        ...mockGeneratedAnswer,
        createdAt: new Date(),
      };

      // Mock file retrieval
      vi.mocked(db.file.findUnique).mockResolvedValueOnce(mockFile);

      // Mock S3 response
      const mockReadableStream = {
        on: vi.fn((event, handler) => {
          if (event === "data") {
            handler(Buffer.from("Resume content here"));
          } else if (event === "end") {
            handler();
          }
        }),
      };

      vi.mocked(s3Client.send).mockResolvedValueOnce({
        Body: mockReadableStream,
      } as any);

      // Mock AI generation
      vi.mocked(generateObject).mockResolvedValueOnce({
        object: mockGeneratedAnswer,
      } as any);

      // Mock database save
      vi.mocked(db.starAnswer.create).mockResolvedValueOnce(mockCreatedAnswer);

      const caller = answersRouter.createCaller(createMockContext(userId));
      const result = await caller.createAnswer(input);

      expect(result).toEqual(mockCreatedAnswer);
      expect(db.starAnswer.create).toHaveBeenCalled();
    });

    it("should throw error when file not found", async () => {
      const userId = "user-123";
      const fileId = "nonexistent";
      const input = {
        question: "Tell me about a time you handled conflict",
        fileId,
        competency: "Conflict Resolution",
      };

      vi.mocked(db.file.findUnique).mockResolvedValueOnce(null);

      const caller = answersRouter.createCaller(createMockContext(userId));

      await expect(caller.createAnswer(input)).rejects.toThrow(
        "File not found"
      );
    });

    it("should throw error when user doesn't have access to file", async () => {
      const userId = "user-123";
      const fileId = "file-1";
      const input = {
        question: "Tell me about a time you handled conflict",
        fileId,
        competency: "Conflict Resolution",
      };

      const mockFile = {
        id: fileId,
        userId: "other-user",
        s3Key: "resume.pdf",
        fileName: "Resume",
        fileSize: 1024,
        contentType: "application/pdf",
        uploadedAt: new Date(),
      };

      vi.mocked(db.file.findUnique).mockResolvedValueOnce(mockFile);

      const caller = answersRouter.createCaller(createMockContext(userId));

      await expect(caller.createAnswer(input)).rejects.toThrow(
        "access denied"
      );
    });

    it("should truncate very long documents", async () => {
      const userId = "user-123";
      const fileId = "file-1";
      const input = {
        question: "Tell me about a time you handled conflict",
        fileId,
        competency: "Conflict Resolution",
      };

      const mockFile = {
        id: fileId,
        userId,
        s3Key: "resume.pdf",
        fileName: "Resume",
        fileSize: 1024,
        contentType: "application/pdf",
        uploadedAt: new Date(),
      };

      // Create a document longer than 15000 characters
      const longContent = "a".repeat(20000);
      const mockReadableStream = {
        on: vi.fn((event, handler) => {
          if (event === "data") {
            handler(Buffer.from(longContent));
          } else if (event === "end") {
            handler();
          }
        }),
      };

      vi.mocked(db.file.findUnique).mockResolvedValueOnce(mockFile);
      vi.mocked(s3Client.send).mockResolvedValueOnce({
        Body: mockReadableStream,
      } as any);

      const mockGeneratedAnswer = {
        competency: "Conflict Resolution",
        question: input.question,
        situation: "Situation...",
        task: "Task...",
        action: "Action...",
        result: "Result...",
        fullAnswer: "Full answer...",
      };

      vi.mocked(generateObject).mockResolvedValueOnce({
        object: mockGeneratedAnswer,
      } as any);

      const mockCreatedAnswer = {
        id: "answer-1",
        userId,
        ...mockGeneratedAnswer,
        createdAt: new Date(),
      };

      vi.mocked(db.starAnswer.create).mockResolvedValueOnce(mockCreatedAnswer);

      const caller = answersRouter.createCaller(createMockContext(userId));
      await caller.createAnswer(input);

      // Verify that generateObject was called with truncated content
      const callArgs = vi.mocked(generateObject).mock.calls[0];
      expect(callArgs[0].prompt).toContain("(document truncated due to length)");
    });

    it("should throw error when document is empty", async () => {
      const userId = "user-123";
      const fileId = "file-1";
      const input = {
        question: "Tell me about a time you handled conflict",
        fileId,
        competency: "Conflict Resolution",
      };

      const mockFile = {
        id: fileId,
        userId,
        s3Key: "resume.pdf",
        fileName: "Resume",
        fileSize: 0,
        contentType: "application/pdf",
        uploadedAt: new Date(),
      };

      const mockReadableStream = {
        on: vi.fn((event, handler) => {
          if (event === "end") {
            handler();
          }
        }),
      };

      vi.mocked(db.file.findUnique).mockResolvedValueOnce(mockFile);
      vi.mocked(s3Client.send).mockResolvedValueOnce({
        Body: mockReadableStream,
      } as any);

      const caller = answersRouter.createCaller(createMockContext(userId));

      await expect(caller.createAnswer(input)).rejects.toThrow("Document is empty");
    });
  });
});
