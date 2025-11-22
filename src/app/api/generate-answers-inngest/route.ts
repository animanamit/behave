// src/app/api/generate-answers-inngest/route.ts
import { inngest } from "@/lib/inngest/inngest";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * TRIGGER ENDPOINT (Inngest Version)
 * 
 * This is MUCH simpler than the streaming version!
 * It just sends an "event" to Inngest and returns immediately.
 * The actual generation happens in the background.
 */
export async function POST(req: Request) {
  try {
    // 1. Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request body (optional - for custom resume text)
    const { resumeText } = await req.json().catch(() => ({}));

    // 3. Send event to Inngest
    // This is like sending a message: "Hey Inngest, please generate answers for this user"
    const eventId = await inngest.send({
      name: "answers/generate", // This matches the event name in functions.ts
      data: {
        userId: session.user.id,
        resumeText: resumeText || undefined, // Optional custom resume
      },
    });

    console.log(`[API] Triggered Inngest job: ${eventId}`);

    // 4. Return immediately (job is queued, not started yet)
    return Response.json({
      success: true,
      message: "Generation started in background",
      eventId: eventId.ids[0], // Inngest returns an array, we want the first ID
    });
  } catch (error) {
    console.error("[API] Error triggering Inngest job:", error);
    return Response.json(
      { error: "Failed to start generation" },
      { status: 500 }
    );
  }
}

