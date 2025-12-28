import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "@/db/prisma";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  UserFilesSchema,
  SaveFileSchema,
  PresignedURLRequestSchema,
} from "@/lib/zod-schemas";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3-client";
import { inngest } from "@/lib/inngest/inngest";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

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
        const data = await db.file.findMany({
          where: {
            userId: input.userId,
          },
        });

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
          message:
            "S3 bucket is not configured. Please check your environment variables.",
        });
      }

      try {
        const sanitizedFileName = input.fileName.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );
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
          message:
            "Failed to generate a presigned S3 upload URL. Please try again.",
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
        await db.file.create({
          data: {
            userId: input.userId,
            s3Key: input.s3Key,
            fileName: input.fileName,
            fileSize: input.fileSize,
            contentType: input.contentType,
          },
        });

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Failed to save file metadata to database. Please try again.",
        });
      }
    }),

  deleteFile: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch file first to get the S3 key
      const file = await db.file.findUnique({
        where: { id: input.id },
      });

      if (!file) {
        throw new TRPCError({ code: "NOT_FOUND", message: "File not found" });
      }

      if (file.userId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized" });
      }

      // 2. Delete from DB immediately (Fast UI response)
      await db.file.delete({
        where: { id: input.id },
      });

      // 3. Trigger background job to clean up S3
      await inngest.send({
        name: "file/delete",
        data: {
          s3Key: file.s3Key,
        },
      });

      return { success: true };
    }),
});
