import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "@/db/drizzle";
import { files } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { UserFilesSchema } from "@/lib/zod-schemas";

export const filesRouter = createTRPCRouter({
  getUserFiles: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (input.userId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
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
          message: "Failed to fetch files",
        });
      }
    }),
});
