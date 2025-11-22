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
 * ANSWERS PAGE (Inngest Version)
 * 
 * This version uses Inngest for background job processing.
 * Key differences from streaming version:
 * 1. No useObject hook - we use React Query to poll the in-memory store
 * 2. No recursive batching - Inngest handles all 25 at once
 * 3. User can close laptop - job continues in background
 * 4. No real-time streaming - answers "pop in" when ready
 * 5. No database - uses in-memory store (data lost on server restart)
 */
const AnswersInngestPage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // POLLING LOGIC (React Query)
  // -------------------------------------------------------------------------
  // This hook automatically polls the API every 2 seconds to check for new answers.
  // It stops polling when we have 25 answers or when the component unmounts.
  const {
    data: answersData,
    isLoading: isLoadingAnswers,
    refetch,
  } = useQuery({
    queryKey: ["answers"],
    queryFn: async () => {
      const res = await fetch("/api/get-answers");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{ answers: STARAnswer[]; count: number }>;
    },
    // Poll every 2 seconds ONLY if we're generating
    refetchInterval: isGenerating ? 2000 : false,
    // Remove the enabled check - it's not needed since refetchInterval already controls polling
  });

  const answers = answersData?.answers || [];
  const count = answers.length;

  // -------------------------------------------------------------------------
  // EFFECT: Stop polling when we have all answers
  // -------------------------------------------------------------------------
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

    // Clear old answers first
    await fetch("/api/clear-answers", { method: "POST" });

    // Show initial toast
    toast.loading("Starting background generation...", {
      id: "generation-status",
    });

    try {
      // Trigger the Inngest job
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
      refetch();
    } catch (error) {
      console.error("Failed to start generation:", error);
      setIsGenerating(false);
      toast.error("Failed to start generation. Please try again.", {
        id: "generation-status",
      });
    }
  };

  // Update toast with current count
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
          <Heading as="h2">Your Generated Answers (Inngest)</Heading>
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
            <p className="font-semibold">Background Generation Active</p>
            <p className="text-sm mt-1">
              Your answers are being generated in the background. You can close
              this tab and come back later - the job will continue running!
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
              Click "Start Generation" to begin the background process.
            </p>
          </div>
        )}
      </div>
    </HomeLayout>
  );
};

export default AnswersInngestPage;

