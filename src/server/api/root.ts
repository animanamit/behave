import { createTRPCRouter } from "./trpc";
import { filesRouter } from "./routers/files";
import { answersRouter } from "./routers/answers";

export const appRouter = createTRPCRouter({
  files: filesRouter,
  answers: answersRouter,
});

export type AppRouter = typeof appRouter;
