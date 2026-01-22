import { createTRPCRouter } from "./trpc";
import { filesRouter } from "./routers/files";
import { answersRouter } from "./routers/answers";
import { practiceSessionsRouter } from "./routers/practice-sessions";
import { logEnvironmentValidation } from "@/lib/env-validation";

// Validate environment variables at server startup
if (typeof window === "undefined") {
  // Only run on server
  logEnvironmentValidation();
}

export const appRouter = createTRPCRouter({
  files: filesRouter,
  answers: answersRouter,
  practiceSessions: practiceSessionsRouter,
});

export type AppRouter = typeof appRouter;
