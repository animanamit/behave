import { db } from "@/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/inngest";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, reset } = body as { sessionId: string; reset?: boolean };

    console.log("[reanalyze] Received request for session:", sessionId, "reset:", reset);

    // Fetch session to check its current state
    const session = await db.practiceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    // If reset requested, reset status to pending
    if (reset) {
      console.log("[reanalyze] Resetting session to pending");
      await db.practiceSession.update({
        where: { id: sessionId },
        data: { analysisStatus: "pending" },
      });

      return NextResponse.json({
        success: true,
        message: "Session reset",
      });
    }

    console.log("[reanalyze] Session status:", session.analysisStatus, "has transcript:", !!session.transcript);

    // If pending or no transcript, start with transcription
    if (session.analysisStatus === "pending" || !session.transcript) {
      await db.practiceSession.update({
        where: { id: sessionId },
        data: { analysisStatus: "pending" },
      });

      await inngest.send({
        name: "video/transcribe",
        data: { sessionId },
      });

      console.log("[reanalyze] Sent video/transcribe event to Inngest");

      return NextResponse.json({
        success: true,
        message: "Analysis started",
        step: "transcription",
      });
    }

    // If already transcribed, go straight to analysis
    if (session.transcript) {
      await db.practiceSession.update({
        where: { id: sessionId },
        data: { analysisStatus: "analyzing" },
      });

      await inngest.send({
        name: "video/transcribed",
        data: { sessionId },
      });

      console.log("[reanalyze] Sent video/transcribed event to Inngest");

      return NextResponse.json({
        success: true,
        message: "Analysis started",
        step: "analysis",
      });
    }

    // If currently processing, let it continue
    return NextResponse.json({
      success: true,
      message: "Analysis already in progress",
    });
  } catch (error) {
    console.error("[reanalyze] ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Failed to trigger analysis" },
      { status: 500 }
    );
  }
}
