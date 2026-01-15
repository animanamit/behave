import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/inngest";
import { db } from "@/db/prisma";
import { generateObject } from "ai";
import { z } from "zod";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3-client";
import OpenAI from "openai";

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
    timeouts: { finish: "15m" }, // 15 min for 8-min video transcription
    retries: 2,
  },
  { event: "video/transcribe" },
  async ({ event, step }) => {
    const { sessionId } = event.data;
    console.log('[transcribeVideo] Received event:', { sessionId });

    try {
      await step.run("update-status-transcribing", async () => {
        console.log('[transcribeVideo] Updating status to: transcribing');
        await db.practiceSession.update({
          where: { id: sessionId },
          data: { analysisStatus: "transcribing" },
        });
      });

      const videoUrl = await step.run("get-video-url", async () => {
        const session = await db.practiceSession.findUnique({
          where: { id: sessionId },
        });
        if (!session) {
          console.error('[transcribeVideo] Session not found:', sessionId);
          throw new Error("Session not found");
        }
        console.log('[transcribeVideo] Session found, videoUrl:', session.videoUrl);
        return session.videoUrl;
      });

      await step.run("transcribe-audio", async () => {
        try {
          const s3Key = extractS3Key(videoUrl);
          console.log('[transcribeVideo] S3 key extracted:', s3Key);
          const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET!,
            Key: s3Key,
          });
          const response = await s3Client.send(command);
          console.log('[transcribeVideo] S3 response received');
          if (!response.Body) {
            throw new Error("No body in S3 response");
          }
          const buffer = await streamToBuffer(response.Body);
          console.log('[transcribeVideo] Video downloaded, size:', buffer.length);

          const file = new File([buffer as any], "recording.webm", {
            type: "video/webm",
          });

          console.log('[transcribeVideo] Starting transcription...');

          // Add timeout for Whisper API (12 min max for long videos)
          const controller = new AbortController();
          const transcriptionTimeout = setTimeout(() => controller.abort(), 12 * 60 * 1000);

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

          console.log('[transcribeVideo] Transcription complete');
          const transcriptText = transcription.text || "";
          const duration = Math.ceil((buffer as any).length / 1024 / 100);

          await db.practiceSession.update({
            where: { id: sessionId },
            data: {
              transcript: transcriptText,
              duration,
              analysisStatus: "analyzing",
            },
          });
        } catch (error: any) {
          if (error?.status === 429 || error?.message?.includes('quota')) {
            console.log('[transcribeVideo] OpenAI quota exceeded, using mock transcript');
            const mockTranscript = "This is a mock transcript. Please check your OpenAI API quota and billing to enable actual transcription. I recorded this practice session to test the system, but the transcription service is currently unavailable due to API limits.";
            await db.practiceSession.update({
              where: { id: sessionId },
              data: {
                transcript: mockTranscript,
                duration: 120,
                analysisStatus: "analyzing",
              },
            });
          } else {
            throw error;
          }
        }
      });

      await step.run("trigger-analysis", async () => {
        console.log('[transcribeVideo] Triggering analysis event...');
        await inngest.send({
          name: "video/transcribed",
          data: { sessionId },
        });
      });

      return { success: true };
    } catch (error) {
      console.error('[transcribeVideo] ERROR:', error);
      throw error;
    }
  }
);

export const analyzeRecording = inngest.createFunction(
  {
    id: "analyze-recording",
    name: "Analyze Recording",
    timeouts: { finish: "5m" }, // 5 min for AI analysis
    retries: 2,
  },
  { event: "video/transcribed" },
  async ({ event, step }) => {
    console.log('[analyzeRecording] Received event');

    try {
      const sessionId = event.data.sessionId;

      const wordCounts = await step.run("count-words", async () => {
        const session = await db.practiceSession.findUnique({
          where: { id: sessionId },
          include: { answer: true },
        });
        if (!session || !session.transcript) {
          console.error('[analyzeRecording] Session or transcript not found');
          throw new Error("Session or transcript not found");
        }
        console.log('[analyzeRecording] Session and transcript found');
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
        console.log('[analyzeRecording] Marking session as completed');
        await db.practiceSession.update({
          where: { id: sessionId },
          data: { analysisStatus: "completed" },
        });
      });

      return { success: true };
    } catch (error) {
      console.error('[analyzeRecording] ERROR:', error);
      throw error;
    }
  }
);

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [transcribeVideo, analyzeRecording],
});
