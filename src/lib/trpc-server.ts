import { cache } from "react";
import { appRouter } from "@/server/api/root";
import { createCallerFactory, createContext } from "@/server/api/trpc";

/**
 * TRPC Server Caller for Server Components.
 *
 * This allows you to call TRPC procedures directly from Server Components
 * without going through HTTP. Much faster than client-side fetching!
 *
 * Usage in a Server Component:
 * ```tsx
 * import { getServerCaller } from "@/lib/trpc-server";
 *
 * async function MyServerComponent() {
 *   const trpc = await getServerCaller();
 *   const files = await trpc.files.getUserFiles({ userId: "..." });
 *   return <div>{files.map(...)}</div>;
 * }
 * ```
 *
 * The caller is cached per-request via React.cache(), so multiple
 * components calling getServerCaller() share the same context.
 *
 * See revisions.md for detailed explanation.
 */

const createCaller = createCallerFactory(appRouter);

/**
 * Get a TRPC caller for use in Server Components.
 * Cached per-request for efficiency.
 */
export const getServerCaller = cache(async () => {
  const ctx = await createContext();
  return createCaller(ctx);
});
