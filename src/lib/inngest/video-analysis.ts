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
  const match = url.match(/amazonaws\.com\/(.+)$/);
  return match ? match[1] : "";
};

export const transcribeVideo = inngest.createFunction(
  { id: "transcribe-video" },
  { event: "video/uploaded" },
  async ({ step, event }) => {
    const { sessionId } = event.data;

    const session = await step.run("fetch-session", async () => {
      const s = await db.practiceSession.findUnique({
        where: { id: sessionId },
      });
      if (!s) throw new Error("Session not found");
      return s;
    });

    await step.run("update-status-transcribing", async () => {
      await db.practiceSession.update({
        where: { id: sessionId },
        data: { analysisStatus: "transcribing" },
      });
    });

    const videoBuffer = await step.run("download-video", async () => {
      const s3Key = extractS3Key(session.videoUrl);
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: s3Key,
      });
      const response = await s3Client.send(command);
      return await streamToBuffer(response.Body);
    });

    const transcript = await step.run("transcribe-audio", async () => {
      const file = new File([videoBuffer], "recording.webm", {
        type: "video/webm",
      });

      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: "whisper-1",
      });

      return transcription.text;
    });

    const duration = Math.ceil(videoBuffer.length / 1024 / 100);

    await step.run("save-transcript", async () => {
      await db.practiceSession.update({
        where: { id: sessionId },
        data: {
          transcript,
          duration,
          analysisStatus: "analyzing",
        },
      });
    });

    await step.run("trigger-analysis", async () => {
      await inngest.send({
        name: "video/transcribed",
        data: { sessionId },
      });
    });

    return { success: true };
  }
);

export const analyzeRecording = inngest.createFunction(
  { id: "analyze-recording" },
  { event: "video/transcribed" },
  async ({ step }) => {
    const { sessionId } = step.event.data;

    const data = await step.run("fetch-data", async () => {
      const session = await db.practiceSession.findUnique({
        where: { id: sessionId },
        include: { answer: true },
      });
      if (!session || !session.transcript) {
        throw new Error("Session or transcript not found");
      }
      return session;
    });

    const wordCounts = await step.run("count-words", async () => {
      const scriptWords = data.answer.fullAnswer.split(/\s+/).length;
      const transcriptWords = data.transcript.split(/\s+/).length;
      return { scriptWords, transcriptWords };
    });

    const analysis = await step.run("ai-analysis", async () => {
      const { object } = await generateObject({
        model: "google/gemini-2.0-flash",
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
${data.transcript}

IDEAL SCRIPT:
${data.answer.fullAnswer}

COMPETENCY:
${data.answer.competency}

Instructions:
1. Score content fidelity (0-100) based on how well they covered the script
2. Assess pacing: "${wordCounts.transcriptWords} words" over ~${data.duration || 2} minutes
3. Rate confidence: "Low" (hesitant, fillers), "Medium", "High" (clear, assertive)
4. Did they go off-script? (compare if they added content not in script)
5. If off-script, did it help or hurt their answer?
6. Provide 1-2 specific suggestions for improvement

Keep feedback concise and actionable.`,
      });

      return object;
    });

    const wordsMatched = await step.run("count-matched-words", async () => {
      const scriptWords = data.answer.fullAnswer.toLowerCase().split(/\s+/);
      const transcriptWords = data.transcript.toLowerCase().split(/\s+/);
      const transcriptSet = new Set(transcriptWords);
      const matched = scriptWords.filter((w) => transcriptSet.has(w)).length;
      return matched;
    });

    await step.run("create-feedback", async () => {
      await db.sessionFeedback.create({
        data: {
          sessionId: sessionId,
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
      await db.practiceSession.update({
        where: { id: sessionId },
        data: { analysisStatus: "completed" },
      });
    });

    return { success: true };
  }
);
