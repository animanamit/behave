// src/app/api/clear-answers/route.ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/prisma";

/**
 * CLEAR ANSWERS ENDPOINT
 * 
 * Clears stored answers for the authenticated user from the database.
 */
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete all answers for this user
    await db.starAnswer.deleteMany({
      where: {
        userId: session.user.id,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to clear answers:", error);
    return Response.json(
      { error: "Failed to clear answers" },
      { status: 500 }
    );
  }
}
