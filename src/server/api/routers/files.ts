import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "@/db/drizzle";
import { files } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { UserFilesSchema, SaveFileSchema, PresignedURLRequestSchema } from "@/lib/zod-schemas";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3-client";

export const filesRouter = createTRPCRouter({
  getUserFiles: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (input.userId !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to access files for this user",
        });
      }

      try {
        const data = await db
          .select()
          .from(files)
          .where(eq(files.userId, input.userId));

        // Parse the data with UserFilesSchema to coerce uploadedAt from string to Date
        // so the  client receives properly Date objects instead of strings
        // z.coerce.date() in the schema automatically converts ISO date strings to Date objects
        return UserFilesSchema.parse(data);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch files from database",
        });
      }
    }),

  getPresignedUrl: protectedProcedure
    .input(PresignedURLRequestSchema)
    .mutation(async ({ ctx, input }) => {
      if (!process.env.AWS_S3_BUCKET) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "S3 bucket is not configured. Please check your environment variables.",
        });
      }

      try {
        const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const key = `${Date.now()}-${sanitizedFileName}`;

        const command = new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET!,
          Key: key,
          ContentType: input.contentType,
        });

        const uploadURL = await getSignedUrl(s3Client, command, {
          expiresIn: 3600,
        });

        return { uploadURL, s3Key: key };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate a presigned S3 upload URL. Please try again.",
        });
      }
    }),

  saveFile: protectedProcedure
    .input(SaveFileSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user can only save files for themselves
      if (input.userId !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to save files for this user",
        });
      }

      try {
        await db.insert(files).values({
          userId: input.userId,
          s3Key: input.s3Key,
          fileName: input.fileName,
          fileSize: input.fileSize,
          contentType: input.contentType,
        });

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save file metadata to database. Please try again.",
        });
      }
    }),
});
