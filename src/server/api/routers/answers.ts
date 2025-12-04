import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "@/db/prisma";
import { z } from "zod";
import { STARAnswer } from "@/lib/zod-schemas";

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
});
