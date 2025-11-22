"use client";

import { HomeLayout } from "@/components/layouts/home-layout";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/layout";
import { Heading } from "@/components/ui/typography";
import { AnswersList } from "@/components/answers/answers-list";
import { STARAnswer } from "@/lib/zod-schemas";
import { Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const TARGET_TOTAL = 25;

/**
 * ANSWERS PAGE (Inngest + Polling)
 *
 * This version uses:
 * 1. Inngest for background job processing (no timeout limits)
 * 2. React Query polling to check for new answers every 2 seconds
 *
 * HOW POLLING WORKS:
 * - React Query calls /api/get-answers every 2 seconds
 * - Each call returns the current state of answers
 * - Frontend compares new state with old state to detect changes
 * - UI updates when new answers appear
 *
 * KEY DIFFERENCES FROM SSE:
 * - Uses React Query's refetchInterval instead of EventSource
 * - Updates appear with 0-2 second delay (vs instant with SSE)
 * - Simpler code (no connection management)
 * - Higher server load (many requests vs one connection)
 *
 * KEY DIFFERENCES FROM STREAMING:
 * - No useObject hook (we poll instead of stream)
 * - No recursive batching (Inngest handles it)
 * - User can close laptop (job continues in background)
 * - Answers appear in chunks (5 at a time) vs letter-by-letter
 */
const AnswersInngestPollingPage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // POLLING LOGIC (React Query)
  // -------------------------------------------------------------------------
  // React Query automatically calls the queryFn every 2 seconds
  // when refetchInterval is set. It stops when:
  // - Component unmounts
  // - refetchInterval becomes false
  // - Query is disabled
  const {
    data: answersData,
    isLoading: isLoadingAnswers,
    refetch,
  } = useQuery({
    queryKey: ["answers"], // Cache key (React Query caches results)
    queryFn: async () => {
      // This function is called every 2 seconds (when polling is active)
      const res = await fetch("/api/get-answers");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{ answers: STARAnswer[]; count: number }>;
    },
    // Poll every 2 seconds ONLY if we're generating
    // When isGenerating is false, polling stops (saves resources)
    refetchInterval: isGenerating ? 2000 : false,
    // No "enabled" check needed - refetchInterval handles it
  });

  const answers = answersData?.answers || [];
  const count = answers.length;

  // -------------------------------------------------------------------------
  // EFFECT: Check if Generation is Complete
  // -------------------------------------------------------------------------
  // When we reach 25 answers, stop the generation state
  // This also stops polling (refetchInterval becomes false)
  useEffect(() => {
    if (isGenerating && count >= TARGET_TOTAL) {
      setIsGenerating(false);
      toast.success("All 25 answers generated successfully!", {
        id: "generation-status",
      });
    }
  }, [count, isGenerating]);

  // -------------------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------------------
  const startGeneration = async () => {
    setIsGenerating(true);
    setEventId(null);

    // Clear old answers first (start fresh)
    await fetch("/api/clear-answers", { method: "POST" });

    // Show initial toast
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
        `Generation started! Checking progress... (0/${TARGET_TOTAL})`,
        { id: "generation-status" }
      );

      // Start polling immediately
      // React Query will now call /api/get-answers every 2 seconds
      refetch();
    } catch (error) {
      console.error("Failed to start generation:", error);
      setIsGenerating(false);
      toast.error("Failed to start generation. Please try again.", {
        id: "generation-status",
      });
    }
  };

  // -------------------------------------------------------------------------
  // EFFECT: Update Toast with Current Count
  // -------------------------------------------------------------------------
  // Every time the count changes (from polling), update the toast
  useEffect(() => {
    if (isGenerating && count > 0) {
      toast.loading(
        `Generating answers... (${count}/${TARGET_TOTAL})`,
        { id: "generation-status" }
      );
    }
  }, [count, isGenerating]);

  return (
    <HomeLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="border-b border-border pb-4 flex justify-between items-center">
          <Heading as="h2">Your Generated Answers (Inngest + Polling)</Heading>
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
            <p className="font-semibold">Background Generation Active (Polling)</p>
            <p className="text-sm mt-1">
              Your answers are being generated in the background. This page checks
              for updates every 2 seconds. You can close this tab and come back later
              - the job will continue running!
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
              polling updates.
            </p>
          </div>
        )}
      </div>
    </HomeLayout>
  );
};

export default AnswersInngestPollingPage;

