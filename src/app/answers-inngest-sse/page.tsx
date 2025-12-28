"use client";

import { HomeLayout } from "@/components/layouts/home-layout";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/layout";
import { Heading } from "@/components/ui/typography";
import { AnswersList } from "@/components/answers/answers-list";
import { STARAnswer } from "@/lib/zod-schemas";
import { Sparkles, FileText } from "lucide-react";
import { useState, useCallback, useEffect, useEffectEvent } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/user-files/data-table";
import { columns } from "@/components/user-files/columns";
import { trpc } from "@/lib/trpc-client";
import { authClient } from "@/lib/auth-client";
import { RowSelectionState } from "@tanstack/react-table";

const TARGET_TOTAL_ANSWERS = 25;

const AnswersInngestSSEPage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<STARAnswer[]>([]);

  // File Selection State
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;

  // 1. Fetch Files
  const filesQuery = trpc.files.getUserFiles.useQuery(
    { userId: userId ?? "" },
    { enabled: !!userId }
  );

  // 2. Selection State
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // 3. Helper to enforce Single Selection
  const handleSelectionChange: React.Dispatch<
    React.SetStateAction<RowSelectionState>
  > = (updater) => {
    const newSelection =
      typeof updater === "function" ? updater(rowSelection) : updater;
    const keys = Object.keys(newSelection);

    // Keep only the most recently selected item
    if (keys.length > 1) {
      const lastKey = keys[keys.length - 1];
      setRowSelection({ [lastKey]: true });
    } else {
      setRowSelection(newSelection);
    }
  };

  // Get the selected file ID (if any)
  const selectedFileId = Object.keys(rowSelection)[0];

  // -------------------------------------------------------------------------
  // EFFECT EVENTS
  // -------------------------------------------------------------------------
  const handleInitial = useEffectEvent((data: { answers?: STARAnswer[] }) => {
    if (data.answers && data.answers.length > 0) {
      setAnswers(data.answers);
    }
  });

  const handleUpdate = useEffectEvent(
    (data: { answers?: STARAnswer[]; count: number }) => {
      setAnswers(data.answers || []);

      if (isGenerating && data.count > 0 && data.count < TARGET_TOTAL_ANSWERS) {
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

  // -------------------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------------------
  const startGeneration = useCallback(async () => {
    if (isGenerating) return;

    // Validation: Ensure a file is selected
    if (!selectedFileId) {
      toast.error("Please select a resume file first");
      return;
    }

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
        body: JSON.stringify({
          fileId: selectedFileId, // Pass selected file ID
        }),
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
  }, [isGenerating, selectedFileId]);

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

        {/* File Selection Section */}
        <Section className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-medium">Select a Resume</h3>
          </div>

          {filesQuery.isLoading ? (
            <div className="h-32 bg-muted/10 animate-pulse rounded-md border border-border" />
          ) : (
            <div className="rounded-md border border-border">
              <DataTable
                columns={columns}
                data={filesQuery.data || []}
                rowSelection={rowSelection}
                setRowSelection={handleSelectionChange}
              />
            </div>
          )}
        </Section>

        {/* Controls */}
        <Section className="p-0">
          <div className="space-y-2">
            <Button
              onClick={startGeneration}
              disabled={isGenerating || !selectedFileId}
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
            {!selectedFileId && !isGenerating && (
              <p className="text-sm text-red-500/80">
                * Please select a file above to start
              </p>
            )}
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
