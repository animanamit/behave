import { AppRouter } from "@/server/api/root";
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

export function getTRPCClientConfig() {
  return {
    // superjson transformer deserializes Date objects and other non-JSON types on the client
    transformer: superjson,
    links: [
      httpBatchLink({
        url: "/api/trpc",
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: "include",
          });
        },
      }),
    ],
  };
}
