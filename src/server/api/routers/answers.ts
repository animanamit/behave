import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "@/db/prisma";
import { z } from "zod";
import { STARAnswer, STARAnswerSchema, CreateSingleQuestionSchema } from "@/lib/zod-schemas";
import { generateObject } from "ai";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3-client";
import { VALIDATION } from "@/lib/constants";

// Helper to read S3 stream to string
const streamToString = (stream: any) =>
  new Promise<string>((resolve, reject) => {
    const chunks: any[] = [];
    stream.on("data", (chunk: any) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });

export const answersRouter = createTRPCRouter({
  getUserAnswers: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Only return answers for the requested user (who must be the logged in user)
      if (input.userId !== ctx.userId) {
        // In practice, protectedProcedure already verifies the session,
        // but this double-check ensures users can't scrape others' data
        return [];
      }

      const answers = await db.starAnswer.findMany({
        where: {
          userId: input.userId,
        },
        orderBy: {
          createdAt: "asc", // Oldest first (like ID 1, 2, 3...)
        },
      });

      return answers as STARAnswer[];
    }),

  createAnswer: protectedProcedure
    .input(CreateSingleQuestionSchema)
    .mutation(async ({ ctx, input }) => {
      const { question, fileId, competency } = input;
      const userId = ctx.userId;

      // 1. Fetch file metadata from DB to get s3Key
      const file = await db.file.findUnique({
        where: { id: fileId },
      });

      if (!file || file.userId !== userId) {
        throw new Error("File not found or access denied");
      }

      // 2. Fetch document content from S3
      let documentText = "";
      try {
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET!,
          Key: file.s3Key,
        });
        const response = await s3Client.send(command);
        // @ts-ignore - Body is a stream in Node.js
        documentText = await streamToString(response.Body);
      } catch (err) {
        throw new Error("Failed to read document file");
      }

      // 2.5. Validate document size
      if (documentText.length === 0) {
        throw new Error("Document is empty");
      }

      // Truncate very long documents to avoid token limits
      const maxDocLength = 15000; // ~3000 tokens at ~5 chars per token
      if (documentText.length > maxDocLength) {
        documentText = documentText.substring(0, maxDocLength) + "\n... (document truncated due to length)";
      }

      // 3. Call AI to generate STAR answer
      const { object } = await generateObject({
        model: "google/gemini-2.0-flash",
        schema: STARAnswerSchema.omit({ id: true }),
        prompt: `Generate a STAR interview answer for this question based on the candidate's background.

CANDIDATE'S BACKGROUND:
${documentText}

QUESTION:
${question}

COMPETENCY: ${competency || "Infer the most appropriate competency from the question"}

Instructions:
1. Use specific details from the candidate's background to craft a realistic, personalized answer
2. Situation: 2-3 sentences setting the scene (based on their actual experience)
3. Task: 1-2 sentences on their specific responsibility
4. Action: 3-4 sentences on specific steps they took (use first person "I")
5. Result: 2-3 sentences on measurable outcomes and impact
6. fullAnswer: Complete narrative combining all sections naturally (200-300 words)

Make the answer sound natural and conversational, as if the candidate is telling their own story.`,
        temperature: 0.7,
      });

      // 4. Save to database
      const answer = await db.starAnswer.create({
        data: {
          userId,
          competency: object.competency,
          question: object.question,
          situation: object.situation,
          task: object.task,
          action: object.action,
          result: object.result,
          fullAnswer: object.fullAnswer || "",
        },
      });

      // 5. Return the created answer
      return answer as STARAnswer;
    }),
});
