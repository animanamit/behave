import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "@/db/prisma";
import { z } from "zod";
import { inngest } from "@/lib/inngest/inngest";
import { TRPCError } from "@trpc/server";
import { deleteMultipleFromS3 } from "@/lib/s3-client";
import { withRetry } from "@/lib/retry";
import {
  SavePracticeSessionSchema,
  PracticeSessionWithFeedbackSchema,
} from "@/lib/zod-schemas";
import { getPresignedUrl } from "@/lib/s3-client";

export const practiceSessionsRouter = createTRPCRouter({
  savePracticeSession: protectedProcedure
    .input(SavePracticeSessionSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.userId !== ctx.userId) {
        throw new Error("Unauthorized");
      }

      const session = await db.practiceSession.create({
        data: {
          userId: input.userId,
          answerId: input.answerId,
          videoUrl: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${input.videoS3Key}`,
          analysisStatus: "pending",
        },
      });

      await inngest.send({
        name: "video/transcribe",
        data: { sessionId: session.id },
      });

      return { sessionId: session.id, videoS3Key: input.videoS3Key };
    }),

  getPracticeSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await db.practiceSession.findUnique({
        where: { id: input.sessionId },
        include: {
          answer: true,
          sessionFeedback: true,
        },
      });

      if (!session) {
        throw new Error("Session not found");
      }

      if (session.userId !== ctx.userId) {
        throw new Error("Unauthorized");
      }

      return PracticeSessionWithFeedbackSchema.parse({
        ...session,
        feedback: session.sessionFeedback[0] || null,
      });
    }),

  getUserPracticeSessions: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        page: z.number().int().positive().default(1).optional(),
        pageSize: z.number().int().positive().max(100).default(20).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (input.userId !== ctx.userId) {
        return [];
      }

      // For backward compatibility, if pagination params not provided, return all (with limit)
      const page = input.page ?? 1;
      const pageSize = input.pageSize ?? 20;
      const skip = (page - 1) * pageSize;

      const sessions = await db.practiceSession.findMany({
        where: { userId: input.userId },
        include: { answer: true, sessionFeedback: true },
        orderBy: { recordedAt: "desc" },
        skip,
        take: pageSize,
      });

      return sessions.map((session) => {
        const feedback = session.sessionFeedback[0];
        return {
          id: session.id,
          userId: session.userId,
          videoUrl: session.videoUrl,
          audioUrl: session.audioUrl,
          transcript: session.transcript,
          duration: session.duration,
          recordedAt: session.recordedAt,
          analysisStatus: session.analysisStatus as "pending" | "transcribing" | "analyzing" | "completed" | "failed",
          answer: session.answer,
          feedback: feedback ? {
            id: feedback.id,
            sessionId: feedback.sessionId,
            createdAt: feedback.createdAt,
            contentFidelityScore: feedback.contentFidelityScore,
            pacing: feedback.pacing,
            confidence: feedback.confidence,
            suggestions: feedback.suggestions,
            wordsMatched: feedback.wordsMatched,
            totalWords: feedback.totalWords,
            keyPointsMissed: feedback.keyPointsMissed,
            wentOffScript: feedback.wentOffScript,
            offScriptImprovement: feedback.offScriptImprovement,
          } : null,
        };
      });
    }),

  deletePracticeSessions: protectedProcedure
    .input(z.object({ sessionIds: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      const sessions = await db.practiceSession.findMany({
        where: {
          id: { in: input.sessionIds },
          userId: ctx.userId,
        },
      });

      if (sessions.length !== input.sessionIds.length) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete some sessions",
        });
      }

      try {
        // Helper function to safely extract S3 key from URL
        const extractS3Key = (url: string | null | undefined): string | null => {
          if (!url) return null;
          try {
            // S3 URLs are: https://bucket.s3.amazonaws.com/key or https://s3.region.amazonaws.com/bucket/key
            // We need to extract the key part
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            
            // Remove leading slash
            if (pathname.startsWith("/")) {
              return pathname.substring(1);
            }
            return pathname;
          } catch (err) {
            // Fall back to string parsing if URL constructor fails
            const match = url.match(/amazonaws\.com\/(.+)$/);
            return match ? match[1] : null;
          }
        };

        const s3Keys = sessions
          .flatMap((session) => [
            extractS3Key(session.videoUrl),
            extractS3Key(session.audioUrl),
            extractS3Key(session.thumbnailUrl),
          ])
          .filter(Boolean) as string[];

        // Delete from S3 first
        try {
          if (s3Keys.length > 0) {
            await deleteMultipleFromS3(s3Keys);
          }
        } catch (s3Error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to delete video files from storage: ${
              s3Error instanceof Error ? s3Error.message : "Unknown S3 error"
            }`,
          });
        }

        // Then delete database records
        try {
          await withRetry(
            () => db.practiceSession.deleteMany({
              where: { id: { in: input.sessionIds } },
            }),
            3,
            1000
          );
        } catch (dbError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to delete session records from database: ${
              dbError instanceof Error ? dbError.message : "Unknown database error"
            }`,
          });
        }

        return { success: true, deletedCount: sessions.length };
      } catch (error) {
        // If it's already a TRPCError, re-throw it
        if (error instanceof TRPCError) {
          throw error;
        }
        // Otherwise wrap it
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete sessions: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });
      }
    }),
});
