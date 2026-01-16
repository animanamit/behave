import { cache } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Cached authentication helpers for Server Components.
 *
 * React.cache() deduplicates calls within a single request.
 * If you call getCurrentUser() 5 times during one page render,
 * only 1 actual auth check happens.
 *
 * See revisions.md for a detailed explanation.
 */

/**
 * Get the current user from the session.
 * Returns null if not authenticated.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user ?? null;
});

/**
 * Get the full session object (user + session metadata).
 * Returns null if not authenticated.
 */
export const getCurrentSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});

/**
 * Check if the current request is authenticated.
 * Useful for middleware or guards.
 */
export const isAuthenticated = cache(async () => {
  const user = await getCurrentUser();
  return user !== null;
});
