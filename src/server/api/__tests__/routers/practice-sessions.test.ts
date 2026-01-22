import { describe, it, expect, vi, beforeEach } from "vitest";
import { practiceSessionsRouter } from "@/server/api/routers/practice-sessions";
import { TRPCError } from "@trpc/server";

// Mock dependencies
vi.mock("@/db/prisma", () => ({
  db: {
    practiceSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/inngest/inngest", () => ({
  inngest: {
    send: vi.fn(),
  },
}));

vi.mock("@/lib/s3-client", () => ({
  deleteMultipleFromS3: vi.fn(),
}));

vi.mock("@/lib/retry", () => ({
  withRetry: vi.fn((fn) => fn()),
}));

import { db } from "@/db/prisma";
import { inngest } from "@/lib/inngest/inngest";
import { deleteMultipleFromS3 } from "@/lib/s3-client";

describe("practiceSessionsRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AWS_S3_BUCKET = "test-bucket";
  });

  const createMockContext = (userId: string) => ({
    userId,
    session: { user: { id: userId } },
  });

  describe("savePracticeSession", () => {
    it("should create a practice session and trigger transcription", async () => {
      const userId = "user-123";
      const input = {
        userId,
        answerId: "answer-1",
        videoS3Key: "videos/session-1.mp4",
      };

      const mockSession = {
        id: "session-1",
        userId,
        answerId: "answer-1",
        videoUrl: "https://test-bucket.s3.amazonaws.com/videos/session-1.mp4",
        analysisStatus: "pending",
        audioUrl: null,
        transcript: null,
        duration: null,
        recordedAt: new Date(),
        thumbnailUrl: null,
      };

      vi.mocked(db.practiceSession.create).mockResolvedValueOnce(mockSession as any);
      vi.mocked(inngest.send).mockResolvedValueOnce({} as any);

      const caller = practiceSessionsRouter.createCaller(createMockContext(userId));
      const result = await caller.savePracticeSession(input);

      expect(result.sessionId).toBe("session-1");
      expect(result.videoS3Key).toBe(input.videoS3Key);
      expect(inngest.send).toHaveBeenCalledWith({
        name: "video/transcribe",
        data: { sessionId: "session-1" },
      });
    });

    it("should throw error when user tries to save session for another user", async () => {
      const userId = "user-123";
      const input = {
        userId: "user-456",
        answerId: "answer-1",
        videoS3Key: "videos/session-1.mp4",
      };

      const caller = practiceSessionsRouter.createCaller(createMockContext(userId));

      await expect(caller.savePracticeSession(input)).rejects.toThrow(
        "Unauthorized"
      );
    });
  });

  describe("getPracticeSession", () => {
    it("should return practice session with feedback", async () => {
      const userId = "user-123";
      const sessionId = "session-1";

      const mockSession = {
        id: sessionId,
        userId,
        answerId: "answer-1",
        videoUrl: "https://test-bucket.s3.amazonaws.com/videos/session-1.mp4",
        analysisStatus: "completed",
        audioUrl: null,
        transcript: "I said...",
        duration: 45,
        recordedAt: new Date(),
        thumbnailUrl: null,
        answer: {
          id: "answer-1",
          userId,
          competency: "Leadership",
          question: "Tell me about a time you led a team",
          situation: "Situation...",
          task: "Task...",
          action: "Action...",
          result: "Result...",
          fullAnswer: "Full answer...",
          createdAt: new Date(),
        },
        sessionFeedback: [
          {
            id: "feedback-1",
            sessionId,
            contentFidelityScore: 85,
            pacing: "Good",
            confidence: "High",
            suggestions: "Speak more slowly",
            wordsMatched: 150,
            totalWords: 180,
            keyPointsMissed: [],
            wentOffScript: false,
            offScriptImprovement: null,
            createdAt: new Date(),
          },
        ],
      };

      vi.mocked(db.practiceSession.findUnique).mockResolvedValueOnce(
        mockSession as any
      );

      const caller = practiceSessionsRouter.createCaller(createMockContext(userId));
      const result = await caller.getPracticeSession({ sessionId });

      expect(result.id).toBe(sessionId);
      expect(result.feedback).toBeDefined();
      expect(result.feedback?.contentFidelityScore).toBe(85);
    });

    it("should throw error when session not found", async () => {
      const userId = "user-123";
      const sessionId = "nonexistent";

      vi.mocked(db.practiceSession.findUnique).mockResolvedValueOnce(null);

      const caller = practiceSessionsRouter.createCaller(createMockContext(userId));

      await expect(caller.getPracticeSession({ sessionId })).rejects.toThrow(
        "Session not found"
      );
    });

    it("should throw error when accessing other user's session", async () => {
      const userId = "user-123";
      const sessionId = "session-1";

      const mockSession = {
        id: sessionId,
        userId: "user-456",
        answerId: "answer-1",
        videoUrl: "https://test-bucket.s3.amazonaws.com/videos/session-1.mp4",
        analysisStatus: "completed",
        audioUrl: null,
        transcript: null,
        duration: null,
        recordedAt: new Date(),
        thumbnailUrl: null,
        answer: {},
        sessionFeedback: [],
      };

      vi.mocked(db.practiceSession.findUnique).mockResolvedValueOnce(
        mockSession as any
      );

      const caller = practiceSessionsRouter.createCaller(createMockContext(userId));

      await expect(caller.getPracticeSession({ sessionId })).rejects.toThrow(
        "Unauthorized"
      );
    });
  });

  describe("getUserPracticeSessions", () => {
    it("should return paginated practice sessions", async () => {
      const userId = "user-123";

      const mockSessions = [
        {
          id: "session-1",
          userId,
          answerId: "answer-1",
          videoUrl: "https://test-bucket.s3.amazonaws.com/videos/session-1.mp4",
          analysisStatus: "completed",
          audioUrl: null,
          transcript: null,
          duration: 45,
          recordedAt: new Date(),
          thumbnailUrl: null,
          answer: {},
          sessionFeedback: [],
        },
      ];

      vi.mocked(db.practiceSession.findMany).mockResolvedValueOnce(
        mockSessions as any
      );

      const caller = practiceSessionsRouter.createCaller(createMockContext(userId));
      const result = await caller.getUserPracticeSessions({
        userId,
        page: 1,
        pageSize: 20,
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("session-1");
      expect(db.practiceSession.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { answer: true, sessionFeedback: true },
        orderBy: { recordedAt: "desc" },
        skip: 0,
        take: 20,
      });
    });

    it("should return empty array when accessing other user's sessions", async () => {
      const userId = "user-123";
      const otherUserId = "user-456";

      const caller = practiceSessionsRouter.createCaller(createMockContext(userId));
      const result = await caller.getUserPracticeSessions({ userId: otherUserId });

      expect(result).toEqual([]);
    });

    it("should handle pagination correctly", async () => {
      const userId = "user-123";

      vi.mocked(db.practiceSession.findMany).mockResolvedValueOnce([]);

      const caller = practiceSessionsRouter.createCaller(createMockContext(userId));
      await caller.getUserPracticeSessions({
        userId,
        page: 2,
        pageSize: 10,
      });

      expect(db.practiceSession.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { answer: true, sessionFeedback: true },
        orderBy: { recordedAt: "desc" },
        skip: 10, // (2 - 1) * 10
        take: 10,
      });
    });
  });

  describe("deletePracticeSession", () => {
    it("should delete practice sessions and associated files", async () => {
      const userId = "user-123";
      const sessionIds = ["session-1", "session-2"];

      const mockSessions = [
        {
          id: "session-1",
          userId,
          videoUrl: "https://test-bucket.s3.amazonaws.com/videos/session-1.mp4",
          audioUrl: "https://test-bucket.s3.amazonaws.com/audio/session-1.mp3",
          thumbnailUrl: null,
        },
        {
          id: "session-2",
          userId,
          videoUrl: "https://test-bucket.s3.amazonaws.com/videos/session-2.mp4",
          audioUrl: null,
          thumbnailUrl: "https://test-bucket.s3.amazonaws.com/thumb/session-2.jpg",
        },
      ];

      vi.mocked(db.practiceSession.findMany).mockResolvedValueOnce(
        mockSessions as any
      );
      vi.mocked(deleteMultipleFromS3).mockResolvedValueOnce(undefined);
      vi.mocked(db.practiceSession.deleteMany).mockResolvedValueOnce({
        count: 2,
      } as any);

      const caller = practiceSessionsRouter.createCaller(createMockContext(userId));
      const result = await caller.deletePracticeSession({ sessionIds });

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(2);
      expect(deleteMultipleFromS3).toHaveBeenCalled();
    });

    it("should throw FORBIDDEN if not all sessions belong to user", async () => {
      const userId = "user-123";
      const sessionIds = ["session-1", "session-2"];

      const mockSessions = [
        {
          id: "session-1",
          userId,
          videoUrl: "https://test-bucket.s3.amazonaws.com/videos/session-1.mp4",
          audioUrl: null,
          thumbnailUrl: null,
        },
      ];

      vi.mocked(db.practiceSession.findMany).mockResolvedValueOnce(
        mockSessions as any
      );

      const caller = practiceSessionsRouter.createCaller(createMockContext(userId));

      await expect(caller.deletePracticeSession({ sessionIds })).rejects.toThrow(
        TRPCError
      );
    });

    it("should handle S3 deletion errors", async () => {
      const userId = "user-123";
      const sessionIds = ["session-1"];

      const mockSessions = [
        {
          id: "session-1",
          userId,
          videoUrl: "https://test-bucket.s3.amazonaws.com/videos/session-1.mp4",
          audioUrl: null,
          thumbnailUrl: null,
        },
      ];

      vi.mocked(db.practiceSession.findMany).mockResolvedValueOnce(
        mockSessions as any
      );
      vi.mocked(deleteMultipleFromS3).mockRejectedValueOnce(
        new Error("S3 error")
      );

      const caller = practiceSessionsRouter.createCaller(createMockContext(userId));

      await expect(caller.deletePracticeSession({ sessionIds })).rejects.toThrow(
        TRPCError
      );
    });
  });
});
