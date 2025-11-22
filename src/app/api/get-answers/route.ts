// src/app/api/get-answers/route.ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { starAnswers } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * POLLING ENDPOINT: Get Answers
 *
 * This endpoint is used by the POLLING frontend implementation.
 * The frontend calls this every 2 seconds to check for new answers.
 *
 * HOW POLLING WORKS:
 * 1. Frontend uses React Query with refetchInterval: 2000
 * 2. Every 2 seconds, React Query calls this endpoint
 * 3. This endpoint reads from the DATABASE (persistent storage)
 * 4. Returns current answers (or empty array if none yet)
 * 5. Frontend updates UI with new data
 *
 * TRADE-OFFS:
 * - Simple to implement (just a GET request)
 * - Works with any HTTP client (no special APIs needed)
 * - Slight delay (0-2 seconds) before updates appear
 * - Higher server load (many requests per minute)
 * - Not truly "real-time" but feels close enough
 *
 * WHEN TO USE:
 * - When you want simplicity over perfect real-time updates
 * - When updates happen in discrete chunks (like our batches)
 * - When you don't need sub-second latency
 */
export async function GET(req: Request) {
  try {
    // -------------------------------------------------------------------------
    // STEP 1: Authentication
    // -------------------------------------------------------------------------
    // Verify the user is logged in and get their ID
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // -------------------------------------------------------------------------
    // STEP 2: Read from Database
    // -------------------------------------------------------------------------
    // Get answers from PostgreSQL database
    // We order by createdAt to ensure they appear in generation order
    const answers = await db
      .select()
      .from(starAnswers)
      .where(eq(starAnswers.userId, session.user.id))
      .orderBy(starAnswers.createdAt);

    // -------------------------------------------------------------------------
    // STEP 3: Format Response
    // -------------------------------------------------------------------------
    // Map DB results to the format expected by the frontend
    // Specifically, we generate sequential IDs (1, 2, 3...) from the array index
    // because the frontend expects numbers, but DB has UUIDs.
    const formattedAnswers = answers.map((a, i) => ({
      id: i + 1,
      competency: a.competency,
      question: a.question,
      situation: a.situation,
      task: a.task,
      action: a.action,
      result: a.result,
      fullAnswer: a.fullAnswer,
    }));

    return Response.json({
      answers: formattedAnswers,
      count: formattedAnswers.length,
    });
  } catch (error) {
    console.error("[API] Error fetching answers:", error);
    return Response.json(
      { error: "Failed to fetch answers" },
      { status: 500 }
    );
  }
}
