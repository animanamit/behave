import { createTRPCRouter } from "./trpc";
import { filesRouter } from "./routers/files";
import { answersRouter } from "./routers/answers";
import { practiceSessionsRouter } from "./routers/practice-sessions";

export const appRouter = createTRPCRouter({
  files: filesRouter,
  answers: answersRouter,
  practiceSessions: practiceSessionsRouter,
});

export type AppRouter = typeof appRouter;
