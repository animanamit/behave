import { inngest } from "./inngest";
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
  { id: "transcribe-video" },
  { event: "video/uploaded" },
  async ({ step, event }) => {
    const { sessionId } = event.data;
    console.log('[transcribe-video] Received event:', { sessionId });

    try {
      const sessionResult = await step.run("fetch-session", async () => {
        console.log('[transcribe-video] Fetching session from DB...');
        const session = await db.practiceSession.findUnique({
          where: { id: sessionId },
        });
        if (!session) {
          console.error('[transcribe-video] Session not found:', sessionId);
          throw new Error("Session not found");
        }
        console.log('[transcribe-video] Session found, videoUrl:', session.videoUrl);
        return session;
      });

      await step.run("update-status-transcribing", async () => {
        console.log('[transcribe-video] Updating status to: transcribing');
        await db.practiceSession.update({
          where: { id: sessionId },
          data: { analysisStatus: "transcribing" },
        });
      });

      console.log('[transcribe-video] Starting video download...');
      const buffer = await step.run("download-video", async () => {
        const s3Key = extractS3Key(sessionResult.videoUrl);
        console.log('[transcribe-video] S3 key extracted:', s3Key);
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET!,
          Key: s3Key,
        });
        const response = await s3Client.send(command);
        if (!response.Body) {
          throw new Error("No body in S3 response");
        }
        return await streamToBuffer(response.Body);
      });

      const file = new File([buffer], "recording.webm", {
        type: "video/webm",
      });

      console.log('[transcribe-video] Starting transcription...');
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: "whisper-1",
      });

      console.log('[transcribe-video] Transcription complete, text length:', transcription.text?.length);
      const transcriptText = transcription.text || "";

      const duration = Math.ceil(buffer.length / 1024 / 100);

      await step.run("save-transcript", async () => {
        console.log('[transcribe-video] Saving transcript to DB...');
        await db.practiceSession.update({
          where: { id: sessionId },
          data: {
            transcript: transcriptText,
            duration,
            analysisStatus: "analyzing",
          },
        });
      });

      await step.run("trigger-analysis", async () => {
        console.log('[transcribe-video] Triggering analysis event...');
        await inngest.send({
          name: "video/transcribed",
          data: { sessionId },
        });
      });

      return { success: true };
    } catch (error) {
      console.error('[transcribe-video] ERROR:', error);
      throw error;
    }
  }
);

export const analyzeRecording = inngest.createFunction(
  { id: "analyze-recording" },
  { event: "video/transcribed" },
  async ({ step }) => {
    console.log('[analyze-recording] Received event');

    try {
      const resultData = await step.run("fetch-data", async () => {
        const session = await db.practiceSession.findUnique({
          where: { id: step.event.data.sessionId },
          include: { answer: true },
        });
        if (!session || !session.transcript) {
          console.error('[analyze-recording] Session or transcript not found');
          throw new Error("Session or transcript not found");
        }
        console.log('[analyze-recording] Session and transcript found');
        return session;
      });

      const wordCounts = await step.run("count-words", async () => {
        const scriptWords = resultData.answer.fullAnswer.split(/\s+/).length;
        const transcriptWords = resultData.transcript.split(/\s+/).length;
        console.log('[analyze-recording] Word counts - Script:', scriptWords, 'Transcript:', transcriptWords);
        return { scriptWords, transcriptWords };
      });

      const analysis = await step.run("ai-analysis", async () => {
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
${resultData.transcript}

IDEAL SCRIPT:
${resultData.answer.fullAnswer}

COMPETENCY:
${resultData.answer.competency}

Instructions:
1. Score content fidelity (0-100) based on how well they covered the script
2. Assess pacing: "${wordCounts.transcriptWords} words" over ~${resultData.duration || 2} minutes
3. Rate confidence: "Low" (hesitant, fillers), "Medium", "High" (clear, assertive)
4. Did they go off-script? (compare if they added content not in script)
5. If off-script, did it help or hurt their answer?
6. Provide 1-2 specific suggestions for improvement

Keep feedback concise and actionable.`,
        });

        console.log('[analyze-recording] AI analysis complete');
        return object;
      });

      const wordsMatched = await step.run("count-matched-words", async () => {
        const scriptWords = resultData.answer.fullAnswer.toLowerCase().split(/\s+/);
        const transcriptWords = resultData.transcript.toLowerCase().split(/\s+/);
        const transcriptSet = new Set(transcriptWords);
        const matched = scriptWords.filter((w) => transcriptSet.has(w)).length;
        console.log('[analyze-recording] Words matched:', matched, 'of', scriptWords);
        return matched;
      });

      await step.run("create-feedback", async () => {
        console.log('[analyze-recording] Creating feedback in DB...');
        await db.sessionFeedback.create({
          data: {
            sessionId: step.event.data.sessionId,
            contentFidelityScore: analysis.contentFidelityScore,
            pacing: analysis.pacing,
            confidence: analysis.confidence,
            suggestions: analysis.suggestions,
            wordsMatched: wordsMatched,
            totalWords: wordCounts.scriptWords,
            wentOffScript: analysis.wentOffScript,
            offScriptImprovement: analysis.offScriptImprovement,
          },
        });
      });

      await step.run("mark-completed", async () => {
        console.log('[analyze-recording] Marking session as completed');
        await db.practiceSession.update({
          where: { id: step.event.data.sessionId },
          data: { analysisStatus: "completed" },
        });
      });

      return { success: true };
    } catch (error) {
      console.error('[analyze-recording] ERROR:', error);
      throw error;
    }
  }
);
