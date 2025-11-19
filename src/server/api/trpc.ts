import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

export const createContext = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return {
    session,
  };
};

type Context = Awaited<ReturnType<typeof createContext>>;

// superjson allows proper serialization of Date objects and other non-JSON types
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      session: ctx.session,
      userId: ctx.session.user.id,
    },
  });
});
