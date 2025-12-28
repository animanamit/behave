import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "@/db/prisma";
import { z } from "zod";
import { inngest } from "@/lib/inngest/inngest";
import { getPresignedUrl } from "@/lib/s3-client";
import {
  SavePracticeSessionSchema,
  PracticeSessionWithFeedbackSchema,
} from "@/lib/zod-schemas";

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
      console.log('[savePracticeSession] Session created:', session.id, 'videoUrl:', session.videoUrl, 'videoS3Key:', input.videoS3Key);

      const sendResult = await inngest.send({
        name: "video/transcribe",
        data: { sessionId: session.id },
      });
      console.log('[savePracticeSession] Inngest send result:', sendResult);

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
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.userId !== ctx.userId) {
        return [];
      }

      const sessions = await db.practiceSession.findMany({
        where: { userId: input.userId },
        include: { answer: true, sessionFeedback: true },
        orderBy: { recordedAt: "desc" },
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
});
