"use client";

import { HomeLayout } from "@/components/layouts/home-layout";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/layout";
import { Heading } from "@/components/ui/typography";
import { AnswersList } from "@/components/answers/answers-list";
import { STARAnswer } from "@/lib/zod-schemas";
import { Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

const TARGET_TOTAL = 25;

/**
 * ANSWERS PAGE (Inngest + SSE)
 *
 * This version uses:
 * 1. Inngest for background job processing (no timeout limits)
 * 2. Server-Sent Events (SSE) for real-time push updates
 *
 * HOW SSE WORKS ON THE FRONTEND:
 * - EventSource API opens a persistent HTTP connection
 * - Server keeps connection open and sends events as they happen
 * - Frontend receives events INSTANTLY (no polling delay)
 * - Browser automatically reconnects if connection drops
 *
 * KEY DIFFERENCES FROM POLLING:
 * - Uses EventSource API instead of React Query polling
 * - Updates appear INSTANTLY (0ms latency vs 0-2s delay)
 * - Lower server load (1 persistent connection vs many requests)
 * - More complex code (connection lifecycle management)
 *
 * KEY DIFFERENCES FROM STREAMING:
 * - No useObject hook (we use EventSource instead)
 * - No recursive batching (Inngest handles it)
 * - User can close laptop (job continues in background)
 * - Answers appear in chunks (5 at a time) vs letter-by-letter
 * - True push updates (server pushes to client) vs pull (client requests)
 */
const AnswersInngestSSEPage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<STARAnswer[]>([]);
  
  // Ref to store EventSource instance for cleanup
  const eventSourceRef = useRef<EventSource | null>(null);

  // -------------------------------------------------------------------------
  // SSE CONNECTION MANAGEMENT
  // -------------------------------------------------------------------------
  // This effect manages the EventSource connection lifecycle:
  // - Opens connection when generation starts
  // - Listens for events (initial, update, heartbeat)
  // - Cleans up when component unmounts or generation stops
  useEffect(() => {
    // Only connect if we're generating or have existing answers
    // This prevents unnecessary connections when page first loads
    if (!isGenerating && answers.length === 0) {
      return;
    }

    // -----------------------------------------------------------------------
    // STEP 1: Create EventSource Connection
    // -----------------------------------------------------------------------
    // EventSource opens a persistent HTTP connection to the SSE endpoint
    // The connection stays open until explicitly closed
    const eventSource = new EventSource("/api/answers-stream");
    eventSourceRef.current = eventSource;

    // -----------------------------------------------------------------------
    // STEP 2: Listen for "initial" Event
    // -----------------------------------------------------------------------
    // Fired immediately when connection opens
    // Contains current state (existing answers if any)
    eventSource.addEventListener("initial", (e) => {
      const data = JSON.parse(e.data);
      setAnswers(data.answers || []);
    });

    // -----------------------------------------------------------------------
    // STEP 3: Listen for "update" Event (THE IMPORTANT ONE)
    // -----------------------------------------------------------------------
    // Fired whenever Inngest saves new answers
    // This is the real-time push notification
    eventSource.addEventListener("update", (e) => {
      const data = JSON.parse(e.data);
      
      // Update state immediately (triggers UI re-render)
      setAnswers(data.answers || []);

      // Update toast with current progress
      if (isGenerating && data.count > 0) {
        toast.loading(
          `Generating answers... (${data.count}/${TARGET_TOTAL})`,
          { id: "generation-status" }
        );
      }

      // Check if generation is complete
      if (data.count >= TARGET_TOTAL && isGenerating) {
        setIsGenerating(false);
        toast.success("All 25 answers generated successfully!", {
          id: "generation-status",
        });
      }
    });

    // -----------------------------------------------------------------------
    // STEP 4: Listen for "heartbeat" Event
    // -----------------------------------------------------------------------
    // Fired every 30 seconds to keep connection alive
    // We don't need to do anything, but it prevents connection timeout
    eventSource.addEventListener("heartbeat", () => {
      // Connection is alive, no action needed
    });

    // -----------------------------------------------------------------------
    // STEP 5: Handle Connection Errors
    // -----------------------------------------------------------------------
    // EventSource automatically reconnects on errors
    // We just log for debugging
    eventSource.onerror = (error) => {
      console.error("[SSE] Connection error:", error);
      // EventSource will automatically attempt to reconnect
      // No manual reconnection needed!
    };

    // -----------------------------------------------------------------------
    // STEP 6: Cleanup on Unmount
    // -----------------------------------------------------------------------
    // When component unmounts or effect re-runs, close the connection
    // This prevents memory leaks and unnecessary connections
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [isGenerating]); // Re-run effect when isGenerating changes

  // -------------------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------------------
  const startGeneration = async () => {
    // Prevent multiple clicks if already generating
    if (isGenerating) return;

    // Explicitly dismiss any previous toast to avoid stacking
    toast.dismiss("generation-status");

    setIsGenerating(true);
    setEventId(null);
    setAnswers([]);

    // Clear old answers first (start fresh)
    await fetch("/api/clear-answers", { method: "POST" });

    // Show initial toast with consistent ID
    toast.loading("Starting background generation...", {
      id: "generation-status",
    });

    try {
      // Trigger the Inngest job
      // This returns immediately (job runs in background)
      const res = await fetch("/api/generate-answers-inngest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error("Failed to start generation");

      const data = await res.json();
      setEventId(data.eventId);

      // Update toast
      toast.loading(
        `Generation started! Waiting for real-time updates... (0/${TARGET_TOTAL})`,
        { id: "generation-status" }
      );

      // SSE connection (created in useEffect) will automatically receive updates
      // No polling needed - updates are pushed instantly!
    } catch (error) {
      console.error("Failed to start generation:", error);
      setIsGenerating(false);
      toast.error("Failed to start generation. Please try again.", {
        id: "generation-status",
      });
    }
  };

  const count = answers.length;

  return (
    <HomeLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="border-b border-border pb-4 flex justify-between items-center">
          <Heading as="h2">Your Generated Answers (Inngest + SSE)</Heading>
          {/* Status indicator */}
          {isGenerating && (
            <span className="text-sm text-muted-foreground animate-pulse flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Generating {count}/{TARGET_TOTAL}...
            </span>
          )}
        </div>

        {/* Control Section */}
        <Section className="p-0">
          <div className="space-y-2">
            <Button
              onClick={startGeneration}
              disabled={isGenerating}
              size="lg"
              className="w-full md:w-auto"
            >
              {isGenerating ? (
                <>Generation in progress...</>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {answers.length > 0 ? "Regenerate All" : "Start Generation"}
                </>
              )}
            </Button>
            {eventId && (
              <p className="text-xs text-muted-foreground">
                Job ID: {eventId} (Check Inngest dashboard for details)
              </p>
            )}
          </div>
        </Section>

        {/* Info Box */}
        {isGenerating && (
          <div className="p-4 border border-blue-500/50 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300">
            <p className="font-semibold">Background Generation Active (SSE)</p>
            <p className="text-sm mt-1">
              Your answers are being generated in the background. Updates will
              appear in real-time via Server-Sent Events (instant push notifications).
              You can close this tab and come back later - the job will continue running!
            </p>
          </div>
        )}

        {/* The Main Answers List */}
        {(answers.length > 0 || isGenerating) && (
          <Section className="p-0">
            <AnswersList
              answers={answers}
              isLoading={isGenerating && count < TARGET_TOTAL}
            />
          </Section>
        )}

        {/* Empty State */}
        {!isGenerating && answers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No answers generated yet.</p>
            <p className="text-sm mt-2">
              Click "Start Generation" to begin the background process with
              real-time SSE updates.
            </p>
          </div>
        )}
      </div>
    </HomeLayout>
  );
};

export default AnswersInngestSSEPage;
