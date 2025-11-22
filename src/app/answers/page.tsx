"use client";

import { HomeLayout } from "@/components/layouts/home-layout";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/layout";
import { Heading } from "@/components/ui/typography";
import { AnswersList } from "@/components/answers/answers-list";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { GenerateAnswersSchema, STARAnswer } from "@/lib/zod-schemas";
import { Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

// BATCH CONFIGURATION
// We generate 5 answers at a time to respect the 60s serverless timeout.
// 5 batches x 5 answers = 25 total answers.
const BATCH_SIZE = 5;
const TARGET_TOTAL = 25;

const AnswersPage = () => {
  // -------------------------------------------------------------------------
  // STATE MANAGEMENT
  // -------------------------------------------------------------------------

  // Stores ALL fully completed answers from previous batches.
  // This is our "permanent record" that grows as each batch finishes.
  const [completedAnswers, setCompletedAnswers] = useState<STARAnswer[]>([]);

  // Tracks if the "Daisy Chain" process is currently active.
  const [isChaining, setIsChaining] = useState(false);

  // We use a ref to toast ID so we can update the SAME toast message.
  const toastIdRef = useRef<string | number | null>(null);

  // -------------------------------------------------------------------------
  // AI SDK HOOK: useObject
  // -------------------------------------------------------------------------
  const { object, submit, isLoading, error } = useObject({
    api: "/api/generate-answers",
    schema: GenerateAnswersSchema,
    // onFinish is ONLY responsible for saving the data.
    // It does NOT decide what to do next. This avoids stale closure issues.
    onFinish: ({ object: finishedObject }) => {
      if (finishedObject?.answers) {
        const newAnswers = finishedObject.answers as STARAnswer[];
        setCompletedAnswers((prev) => [...prev, ...newAnswers]);
      }
    },
    onError: (err) => {
      console.error("Batch generation failed:", err);
      setIsChaining(false);
      if (toastIdRef.current) {
        toast.error("Generation stopped due to an error.", {
          id: toastIdRef.current,
        });
      }
    },
  });

  // -------------------------------------------------------------------------
  // CHAINING LOGIC (The "Brain")
  // -------------------------------------------------------------------------
  // This effect monitors the 'completedAnswers' state.
  // When a batch finishes (and 'isLoading' goes back to false), this decides
  // whether to trigger the next batch or finish.
  useEffect(() => {
    // Only run if the process is active
    if (!isChaining) return;

    // Do NOT run if a request is currently in progress.
    // We wait for 'isLoading' to flip to false (which happens after onFinish).
    if (isLoading) return;

    const currentCount = completedAnswers.length;

    // CASE 1: We've reached the target (25). STOP.
    if (currentCount >= TARGET_TOTAL) {
      setIsChaining(false);
      if (toastIdRef.current) {
        toast.success("All 25 answers generated successfully!", {
          id: toastIdRef.current,
        });
      }
      return;
    }

    // CASE 2: We have some answers (e.g. 5, 10, 15...), but not all.
    // Trigger the next batch.
    // (Note: We check > 0 to avoid double-triggering on initial start,
    // though 'isLoading' usually handles that).
    if (currentCount > 0 && currentCount < TARGET_TOTAL) {
      const nextId = currentCount + 1;
      const currentBatchNumber = Math.floor(currentCount / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(TARGET_TOTAL / BATCH_SIZE);

      // Update toast
      if (toastIdRef.current) {
        toast.loading(
          `Generating batch ${currentBatchNumber + 1} of ${totalBatches}...`,
          { id: toastIdRef.current }
        );
      }

      // Trigger next batch
      // We calculate 'nextId' directly from the length, ensuring it's always fresh.
      submit({ startId: nextId, batchSize: BATCH_SIZE });
    }
  }, [completedAnswers.length, isChaining, isLoading, submit]);

  // -------------------------------------------------------------------------
  // DATA MERGING FOR UI
  // -------------------------------------------------------------------------
  // Merge static completed answers with the currently streaming ones.
  const activeStreamAnswers = (object?.answers as STARAnswer[]) || [];
  const allAnswersToDisplay = [...completedAnswers, ...activeStreamAnswers];

  // -------------------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------------------
  const startGeneration = () => {
    // Reset state for a fresh run
    setCompletedAnswers([]);
    setIsChaining(true);

    // Show initial toast
    toastIdRef.current = toast.loading("Starting generation (Batch 1 of 5)...");

    // Manually trigger the FIRST batch
    submit({ startId: 1, batchSize: BATCH_SIZE });
  };

  return (
    <HomeLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="border-b border-border pb-4 flex justify-between items-center">
          <Heading as="h2">Your Generated Answers</Heading>
          {/* Status text inside the header instead of the button */}
          {isChaining && (
            <span className="text-sm text-muted-foreground animate-pulse flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Generating {allAnswersToDisplay.length}/{TARGET_TOTAL}...
            </span>
          )}
        </div>

        {/* Control Section */}
        <Section className="p-0">
          <Button
            onClick={startGeneration}
            disabled={isChaining}
            size="lg"
            className="w-full md:w-auto"
          >
            {isChaining ? (
              <>Streaming in progress...</>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {completedAnswers.length > 0
                  ? "Regenerate All"
                  : "Start Streaming Generation"}
              </>
            )}
          </Button>
        </Section>

        {/* Error Display */}
        {error && (
          <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive">
            <p className="font-semibold">Generation Stopped</p>
            <p className="text-sm opacity-90">{error.message}</p>
          </div>
        )}

        {/* The Main Answers List */}
        {(allAnswersToDisplay.length > 0 || isChaining) && (
          <Section className="p-0">
            <AnswersList answers={allAnswersToDisplay} isLoading={isChaining} />
          </Section>
        )}
      </div>
    </HomeLayout>
  );
};

export default AnswersPage;
