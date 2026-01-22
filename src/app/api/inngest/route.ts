/**
 * Inngest Handler - All background job functions defined here
 * 
 * This is the single source of truth for:
 * - transcribeVideo: Transcribe video recordings with Whisper
 * - analyzeRecording: Analyze transcripts with Gemini
 * 
 * These functions are triggered by events and run asynchronously
 * without time limits, handling long-running tasks like transcription.
 */

import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/inngest";
import { db } from "@/db/prisma";
import { generateObject } from "ai";
import { z } from "zod";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, deleteMultipleFromS3 } from "@/lib/s3-client";
import OpenAI from "openai";
import { TIMEOUTS, OPENAI_ERRORS, VIDEO } from "@/lib/constants";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const streamToBuffer = async (stream: any) => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

const extractS3Key = (url: string): string => {
  const match = url.match(/s3\.amazonaws\.com\/(.+)$/);
  return match ? match[1] : "";
};

export const transcribeVideo = inngest.createFunction(
  {
    id: "transcribe-video",
    name: "Transcribe Video",
    timeouts: { finish: TIMEOUTS.INNGEST_TRANSCRIPTION_FINISH },
    retries: 2,
  },
  { event: "video/transcribe" },
  async ({ event, step }) => {
    const { sessionId } = event.data;

    try {
      // Atomically update status to "transcribing" only if current status is "pending"
      // This prevents race conditions if multiple events are triggered
      await step.run("update-status-transcribing", async () => {
        const updated = await db.practiceSession.updateMany({
          where: { 
            id: sessionId,
            analysisStatus: "pending", // Only update if still pending
          },
          data: { analysisStatus: "transcribing" },
        });
        
        if (updated.count === 0) {
          throw new Error("Session not in pending state or not found");
        }
      });

      const videoUrl = await step.run("get-video-url", async () => {
        const session = await db.practiceSession.findUnique({
          where: { id: sessionId },
        });
        if (!session) {
          throw new Error("Session not found");
        }
        return session.videoUrl;
      });

      await step.run("transcribe-audio", async () => {
        try {
           const s3Key = extractS3Key(videoUrl);
           const command = new GetObjectCommand({
             Bucket: process.env.AWS_S3_BUCKET!,
             Key: s3Key,
           });
           const response = await s3Client.send(command);
           if (!response.Body) {
             throw new Error("No body in S3 response");
           }
           const buffer = await streamToBuffer(response.Body);

          const file = new File([buffer as any], "recording.webm", {
            type: "video/webm",
          });

          // Add timeout for Whisper API
           const controller = new AbortController();
           const transcriptionTimeout = setTimeout(() => controller.abort(), TIMEOUTS.TRANSCRIPTION_API_MS);

          let transcription;
          try {
            transcription = await openai.audio.transcriptions.create(
              { file, model: "whisper-1" },
              { signal: controller.signal }
            );
          } catch (err: any) {
            if (err.name === 'AbortError') {
              throw new Error('Transcription timed out - video may be too long');
            }
            throw err;
          } finally {
            clearTimeout(transcriptionTimeout);
          }

          const transcriptText = transcription.text || "";
          
          // Estimate duration from transcript word count (avg 150 words per minute = 2.5 words/second)
          // More reliable than file size which varies by compression
          const wordCount = transcriptText.split(/\s+/).filter(w => w.length > 0).length;
          const duration = Math.max(Math.ceil(wordCount / 2.5), 30); // Minimum 30 seconds

          await db.practiceSession.update({
            where: { id: sessionId },
            data: {
              transcript: transcriptText,
              duration,
              analysisStatus: "analyzing",
            },
          });
        } catch (error: any) {
          // Don't fake transcripts - mark as failed so user can retry
          // Faking data silently causes inaccurate feedback
          await db.practiceSession.update({
            where: { id: sessionId },
            data: {
              analysisStatus: "failed",
            },
          });
          throw error;
        }
      });

      await step.run("trigger-analysis", async () => {
        await inngest.send({
          name: "video/transcribed",
          data: { sessionId },
        });
      });

      return { success: true };
      } catch (error) {
      throw error;
      }
  }
);

export const analyzeRecording = inngest.createFunction(
  {
    id: "analyze-recording",
    name: "Analyze Recording",
    timeouts: { finish: TIMEOUTS.INNGEST_ANALYSIS_FINISH },
    retries: 2,
  },
  { event: "video/transcribed" },
  async ({ event, step }) => {
    try {
      const sessionId = event.data.sessionId;

      const wordCounts = await step.run("count-words", async () => {
        const session = await db.practiceSession.findUnique({
          where: { id: sessionId },
          include: { answer: true },
        });
        if (!session || !session.transcript) {
          throw new Error("Session or transcript not found");
        }
        const scriptWords = session.answer.fullAnswer.split(/\s+/).length;
        const transcriptWords = (session.transcript || "").split(/\s+/).length;
        return { scriptWords, transcriptWords, duration: session.duration };
      });

      // Fetch session data once and reuse across steps
      const sessionData = await step.run("fetch-session-data", async () => {
        const session = await db.practiceSession.findUnique({
          where: { id: sessionId },
          include: { answer: true },
        });

        if (!session) {
          throw new Error("Session not found");
        }

        return {
          transcript: session.transcript,
          fullAnswer: session.answer.fullAnswer,
          competency: session.answer.competency,
        };
      });

      // Run AI analysis
      const aiResult = await step.run("ai-analysis", async () => {
        const { object } = await generateObject({
          model: "google/gemini-2.0-flash-exp",
          schema: z.object({
            contentFidelityScore: z.number().min(0).max(100),
            pacing: z.enum(["Too fast", "Just right", "Too slow"]),
            confidence: z.enum(["Low", "Medium", "High"]),
            wentOffScript: z.boolean(),
            offScriptImprovement: z.enum([
              "Made it better",
              "Made it worse",
              "No change",
            ]),
            suggestions: z.string(),
          }),
          prompt: `Compare this interview recording transcript to ideal STAR script and provide feedback.

TRANSCRIPT:
${sessionData.transcript}

IDEAL SCRIPT:
${sessionData.fullAnswer}

COMPETENCY:
${sessionData.competency}

Instructions:
1. Score content fidelity (0-100) based on how well they covered the script
2. Assess pacing: "${wordCounts.transcriptWords} words" over ~${wordCounts.duration || 2} minutes
3. Rate confidence: "Low" (hesitant, fillers), "Medium", "High" (clear, assertive)
4. Did they go off-script? (compare if they added content not in script)
5. If off-script, did it help or hurt their answer?
6. Provide 1-2 specific suggestions for improvement

Keep feedback concise and actionable.`,
        });

        console.log('[analyzeRecording] AI analysis complete');
        return object;
      });

      // Count matched words (flattened from nested step)
      const wordsMatched = await step.run("count-matched-words", async () => {
        const scriptWords = sessionData.fullAnswer.toLowerCase().split(/\s+/);
        const transcriptWords = (sessionData.transcript || "").toLowerCase().split(/\s+/);
        const transcriptSet = new Set(transcriptWords);
        const matched = scriptWords.filter((w: string) => transcriptSet.has(w)).length;
        console.log('[analyzeRecording] Words matched:', matched, 'of', scriptWords.length);
        return matched;
      });

      // Create feedback (flattened from nested step)
      await step.run("create-feedback", async () => {
        console.log('[analyzeRecording] Creating feedback in DB...');
        await db.sessionFeedback.create({
          data: {
            sessionId: sessionId,
            contentFidelityScore: aiResult.contentFidelityScore,
            pacing: aiResult.pacing,
            confidence: aiResult.confidence,
            suggestions: aiResult.suggestions,
            wordsMatched: wordsMatched,
            totalWords: wordCounts.scriptWords,
            wentOffScript: aiResult.wentOffScript,
            offScriptImprovement: aiResult.offScriptImprovement,
          },
        });
      });

      await step.run("mark-completed", async () => {
        // Atomically update status to "completed" only if still "analyzing"
        const updated = await db.practiceSession.updateMany({
          where: {
            id: sessionId,
            analysisStatus: "analyzing", // Only update if still analyzing
          },
          data: { analysisStatus: "completed" },
        });

        if (updated.count === 0) {
          throw new Error("Session not in analyzing state or not found");
        }
      });

      return { success: true };
      } catch (error) {
      // Mark session as failed instead of leaving it stuck "analyzing"
      // User can retry the analysis
      try {
       await db.practiceSession.updateMany({
         where: {
           id: event.data.sessionId,
           analysisStatus: { in: ["analyzing", "transcribed"] }, // Update if in either state
         },
         data: { analysisStatus: "failed" },
       });
      } catch (updateError) {
       // Log but don't throw - we already have the original error
      }
      throw error;
      }
      }
      );

/**
 * Cleanup Job: Remove old failed sessions and their S3 files
 * 
 * Triggered daily to clean up:
 * - Sessions marked as "failed" older than 30 days
 * - Associated video/audio/thumbnail files from S3
 * - Database records
 * 
 * Helps prevent accumulation of orphaned failed sessions.
 */
export const cleanupFailedSessions = inngest.createFunction(
  {
    id: "cleanup-failed-sessions",
    name: "Cleanup Failed Sessions",
  },
  { cron: "0 2 * * *" }, // Run once per day at 2 AM UTC
  async ({ step }) => {
    try {
      // Find sessions marked as failed older than 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const failedSessions = await step.run("find-old-failed-sessions", async () => {
        return await db.practiceSession.findMany({
          where: {
            analysisStatus: "failed",
            recordedAt: { lt: thirtyDaysAgo },
          },
        });
      });

      if (failedSessions.length === 0) {
        return { success: true, deletedCount: 0 };
      }

      // Extract S3 keys from failed sessions
      const extractS3Key = (url: string | null | undefined): string | null => {
        if (!url) return null;
        try {
          const urlObj = new URL(url);
          const pathname = urlObj.pathname;
          return pathname.startsWith("/") ? pathname.substring(1) : pathname;
        } catch (err) {
          const match = url.match(/amazonaws\.com\/(.+)$/);
          return match ? match[1] : null;
        }
      };

      const s3Keys = failedSessions
        .flatMap((session: any) => [
          extractS3Key(session.videoUrl),
          extractS3Key(session.audioUrl),
          extractS3Key(session.thumbnailUrl),
        ])
        .filter(Boolean) as string[];

      // Delete S3 files
      if (s3Keys.length > 0) {
        await step.run("delete-s3-files", async () => {
          await deleteMultipleFromS3(s3Keys);
        });
      }

      // Delete database records
      const sessionIds = failedSessions.map((s: any) => s.id);
      await step.run("delete-database-records", async () => {
        await db.practiceSession.deleteMany({
          where: { id: { in: sessionIds } },
        });
      });

      return {
        success: true,
        deletedCount: failedSessions.length,
        filesDeleted: s3Keys.length,
      };
    } catch (error) {
      throw error;
    }
  }
);

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [transcribeVideo, analyzeRecording, cleanupFailedSessions],
});
