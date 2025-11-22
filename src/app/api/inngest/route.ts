// src/app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/inngest";
import { generateAnswers } from "@/lib/inngest/functions";

/**
 * INNGEST WEBHOOK ENDPOINT
 * 
 * This is where Inngest Cloud "calls back" to your app to trigger functions.
 * When you deploy, Inngest scans this file to discover your functions.
 * 
 * IMPORTANT: This MUST be at /api/inngest for Inngest to find it.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateAnswers], // Register your function here!
});

