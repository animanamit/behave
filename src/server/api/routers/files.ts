import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "@/db/prisma";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  UserFilesSchema,
  SaveFileSchema,
} from "@/lib/zod-schemas";
import { getPresignedUrl, deleteFromS3, deleteMultipleFromS3 } from "@/lib/s3-client";
import { withRetry } from "@/lib/retry";

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

        return UserFilesSchema.parse(data);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch files from database",
        });
      }
    }),

  getPresignedUrl: protectedProcedure
    .input(
      z.object({
        s3Key: z.string().min(1),
        fileName: z.string().optional(),
        contentType: z.string().optional(),
        userId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const url = await getPresignedUrl(input.s3Key);
      return { url: url, uploadURL: url, s3Key: input.s3Key };
    }),

  saveFile: protectedProcedure
    .input(
      z.object({
        s3Key: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        contentType: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.userId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized" });
      }

      try {
        const file = await db.file.create({
          data: {
            userId: input.userId,
            s3Key: input.s3Key,
            fileName: input.fileName,
            fileSize: input.fileSize,
            contentType: input.contentType,
          },
        });

        return file;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save file",
        });
      }
    }),

  deleteFile: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const file = await db.file.findUnique({
        where: { id: input.id },
      });

      if (!file) {
        throw new TRPCError({ code: "NOT_FOUND", message: "File not found" });
      }

      if (file.userId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized" });
      }

      try {
        await deleteFromS3(file.s3Key);

        await withRetry(
          () => db.file.delete({ where: { id: input.id } }),
          3,
          1000
        );

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete file",
        });
      }
    }),

  deleteFiles: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const files = await db.file.findMany({
        where: {
          id: { in: input.ids },
          userId: ctx.userId,
        },
      });

      if (files.length !== input.ids.length) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete some files",
        });
      }

      try {
        const s3Keys = files.map(file => file.s3Key);
        await deleteMultipleFromS3(s3Keys);

        await withRetry(
          () => db.file.deleteMany({
            where: { id: { in: input.ids } },
          }),
          3,
          1000
        );

        return { success: true, deletedCount: files.length };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete files",
        });
      }
    }),
});
