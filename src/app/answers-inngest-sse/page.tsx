"use client";

import { HomeLayout } from "@/components/layouts/home-layout";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/layout";
import { Heading } from "@/components/ui/typography";
import { AnswersList } from "@/components/answers/answers-list";
import { STARAnswer } from "@/lib/zod-schemas";
import { Sparkles } from "lucide-react";
import { useState, useEffect, useCallback, useEffectEvent } from "react";
import { toast } from "sonner";

const TARGET_TOTAL_ANSWERS = 25;

const AnswersInngestSSEPage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<STARAnswer[]>([]);

  // -------------------------------------------------------------------------
  // EFFECT EVENTS
  // -------------------------------------------------------------------------
  // These functions always read the LATEST state values when called,
  // but they don't cause the useEffect to re-run when those values change.
  // This solves the "stale closure" problem without manual ref syncing.

  const handleInitial = useEffectEvent((data: { answers?: STARAnswer[] }) => {
    if (data.answers && data.answers.length > 0) {
      setAnswers(data.answers);
    }
  });

  const handleUpdate = useEffectEvent(
    (data: { answers?: STARAnswer[]; count: number }) => {
      setAnswers(data.answers || []);

      // isGenerating here is ALWAYS the current value, not a stale closure
      if (isGenerating && data.count > 0) {
        toast.loading(
          `Generating answers... (${data.count}/${TARGET_TOTAL_ANSWERS})`,
          { id: "generation-status" }
        );
      }

      if (data.count >= TARGET_TOTAL_ANSWERS && isGenerating) {
        setIsGenerating(false);
        toast.success("All 25 answers generated successfully!", {
          id: "generation-status",
        });
      }
    }
  );

  const handleHeartbeat = useEffectEvent(() => {
    console.log("[SSE] Heartbeat received");
  });

  const handleError = useEffectEvent((error: Event) => {
    console.error("[SSE] Connection error:", error);
    // Could add UI feedback here - isGenerating would be current
    if (isGenerating) {
      toast.error("Connection lost. Attempting to reconnect...", {
        id: "sse-error",
      });
    }
  });

  // -------------------------------------------------------------------------
  // SSE CONNECTION MANAGEMENT
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isGenerating) return;

    const eventSource = new EventSource("/api/answers-stream");

    // All handlers use Effect Events - they see current state,
    // but don't need to be in the dependency array
    eventSource.addEventListener("initial", (e) => {
      handleInitial(JSON.parse(e.data));
    });

    eventSource.addEventListener("update", (e) => {
      handleUpdate(JSON.parse(e.data));
    });

    eventSource.addEventListener("heartbeat", () => {
      handleHeartbeat();
    });

    eventSource.onerror = (error) => {
      handleError(error);
    };

    return () => {
      eventSource.close();
    };
  }, [isGenerating]);
  // ^ Clean dependency array!
  // Effect Events are intentionally NOT listed here.
  // They're stable references that always read current values.

  // -------------------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------------------
  const startGeneration = useCallback(async () => {
    if (isGenerating) return;

    toast.dismiss("generation-status");
    setIsGenerating(true);
    setEventId(null);
    setAnswers([]);

    await fetch("/api/clear-answers", { method: "POST" });

    toast.loading("Starting background generation...", {
      id: "generation-status",
    });

    try {
      const res = await fetch("/api/generate-answers-inngest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error("Failed to start generation");

      const data = await res.json();
      setEventId(data.eventId);

      toast.loading(
        `Generation started! Waiting for real-time updates... (0/${TARGET_TOTAL_ANSWERS})`,
        { id: "generation-status" }
      );
    } catch (error) {
      console.error("Failed to start generation:", error);
      setIsGenerating(false);
      toast.error("Failed to start generation. Please try again.", {
        id: "generation-status",
      });
    }
  }, [isGenerating]);

  const count = answers.length;

  return (
    <HomeLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="border-b border-border pb-4 flex justify-between items-center">
          <Heading as="h2">Your Generated Answers (Inngest + SSE)</Heading>
          {isGenerating && (
            <span className="text-sm text-muted-foreground animate-pulse flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Generating {count}/{TARGET_TOTAL_ANSWERS}...
            </span>
          )}
        </div>

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

        {isGenerating && (
          <div className="p-4 border border-blue-500/50 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300">
            <p className="font-semibold">Background Generation Active (SSE)</p>
            <p className="text-sm mt-1">
              Your answers are being generated in the background. Updates will
              appear in real-time via Server-Sent Events (instant push
              notifications). You can close this tab and come back later - the
              job will continue running!
            </p>
          </div>
        )}

        {(answers.length > 0 || isGenerating) && (
          <Section className="p-0">
            <AnswersList
              answers={answers}
              isLoading={isGenerating && count < TARGET_TOTAL_ANSWERS}
            />
          </Section>
        )}

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
