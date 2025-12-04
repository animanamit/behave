"use client";

import { HomeLayout } from "@/components/layouts/home-layout";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/typography";
import { AnswersList } from "@/components/answers/answers-list";
import { STARAnswer } from "@/lib/zod-schemas";
import {
  Sparkles,
  FileText,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useState, useCallback, useEffect, useEffectEvent } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/user-files/data-table";
import { columns } from "@/components/user-files/columns";
import { trpc } from "@/lib/trpc-client";
import { authClient } from "@/lib/auth-client";
import { RowSelectionState } from "@tanstack/react-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TARGET_TOTAL_ANSWERS = 25;

const AnswersPage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [streamingAnswers, setStreamingAnswers] = useState<STARAnswer[]>([]);

  // File Selection State
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;

  // 1. Fetch Files
  const filesQuery = trpc.files.getUserFiles.useQuery(
    { userId: userId ?? "" },
    { enabled: !!userId }
  );

  // 2. Fetch Existing Answers
  const answersQuery = trpc.answers.getUserAnswers.useQuery(
    { userId: userId ?? "" },
    {
      enabled: !!userId,
      refetchOnWindowFocus: false,
    }
  );

  // 3. Selection State
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // 4. Helper to enforce Single Selection
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
      setStreamingAnswers(data.answers);
    }
  });

  const handleUpdate = useEffectEvent(
    (data: { answers?: STARAnswer[]; count: number }) => {
      setStreamingAnswers(data.answers || []);

      if (isGenerating && data.count > 0 && data.count < TARGET_TOTAL_ANSWERS) {
        toast.loading(
          `Crafting answers... (${data.count}/${TARGET_TOTAL_ANSWERS})`,
          { id: "generation-status" }
        );
      }

      if (data.count >= TARGET_TOTAL_ANSWERS && isGenerating) {
        setIsGenerating(false);
        toast.success("All answers generated successfully!", {
          id: "generation-status",
        });
        answersQuery.refetch();
      }
    }
  );

  const handleHeartbeat = useEffectEvent(() => {
    console.log("[SSE] Heartbeat received");
  });

  const handleError = useEffectEvent((error: Event) => {
    console.error("[SSE] Connection error:", error);
    if (isGenerating) {
      toast.error("Connection lost. Reconnecting...", {
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

    if (!selectedFileId) {
      toast.error("Please select a resume file first");
      return;
    }

    toast.dismiss("generation-status");
    setIsGenerating(true);
    setEventId(null);
    setStreamingAnswers([]);

    await fetch("/api/clear-answers", { method: "POST" });

    toast.loading("Starting generation...", {
      id: "generation-status",
    });

    try {
      const res = await fetch("/api/generate-answers-inngest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: selectedFileId,
        }),
      });

      if (!res.ok) throw new Error("Failed to start generation");

      const data = await res.json();
      setEventId(data.eventId);
      console.log("Job ID:", data.eventId); // Keep for dev debugging

      toast.loading(`Started! Watch them appear live...`, {
        id: "generation-status",
      });
    } catch (error) {
      console.error("Failed to start generation:", error);
      setIsGenerating(false);
      toast.error("Failed to start generation. Please try again.", {
        id: "generation-status",
      });
    }
  }, [isGenerating, selectedFileId]);

  // DATA DERIVATION
  const displayAnswers = isGenerating
    ? streamingAnswers
    : answersQuery.data || [];

  const hasAnswers = displayAnswers.length > 0;
  const isLoadingAnswers = answersQuery.isLoading && !isGenerating;
  const count = displayAnswers.length;

  return (
    <HomeLayout>
      <div className="max-w-5xl mx-auto pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-border pb-6">
          <div>
            <Heading as="h2">Your Generated Answers</Heading>
            <p className="text-muted-foreground mt-1">
              Personalized behavioral interview answers based on your
              experience.
            </p>
          </div>

          {/* Status Indicator in Header */}
          {isGenerating && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating {count}/{TARGET_TOTAL_ANSWERS}...
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Step 1: File Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg">Select Resume</h3>
              </div>
              {selectedFileId && (
                <span className="text-sm text-muted-foreground hidden sm:inline-block">
                  <CheckCircle2 className="w-4 h-4 inline mr-1 text-green-500" />
                  Resume Selected
                </span>
              )}
            </div>

            {filesQuery.isLoading ? (
              <div className="h-32 bg-muted/10 animate-pulse rounded-lg border border-border" />
            ) : (
              <div className="rounded-lg border border-border bg-card/50">
                <DataTable
                  columns={columns}
                  data={filesQuery.data || []}
                  rowSelection={rowSelection}
                  setRowSelection={handleSelectionChange}
                />
              </div>
            )}
          </div>

          {/* Step 2: Action Area */}
          <div className="flex flex-col items-start gap-4">
            <Button
              onClick={startGeneration}
              disabled={isGenerating || !selectedFileId}
              size="lg"
              className={cn(
                "w-full md:w-auto min-w-[200px] transition-all",
                isGenerating ? "opacity-80" : "shadow-sm hover:shadow-md"
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Crafting Answers...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {hasAnswers ? "Regenerate All Answers" : "Generate Answers"}
                </>
              )}
            </Button>

            {!selectedFileId && !isGenerating && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Select a resume above to start generating
              </p>
            )}
          </div>

          {/* Friendly Progress Banner */}
          {isGenerating && (
            <Alert className="bg-primary/5 border-primary/20 animate-in fade-in slide-in-from-top-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary font-medium mb-1">
                We're crafting your answers
              </AlertTitle>
              <AlertDescription className="text-muted-foreground">
                This usually takes a minute or two. You can watch them appear
                live below, or feel free to leave and come back—we'll keep
                working in the background.
              </AlertDescription>
            </Alert>
          )}

          {/* Content Area */}
          <div className="pt-4">
            {isLoadingAnswers ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-muted/10 animate-pulse rounded-xl border border-border/50"
                  />
                ))}
              </div>
            ) : hasAnswers || isGenerating ? (
              <AnswersList
                answers={displayAnswers}
                isLoading={
                  isGenerating && displayAnswers.length < TARGET_TOTAL_ANSWERS
                }
              />
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-border rounded-xl bg-muted/5 text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">
                  No answers generated yet
                </h3>
                <p className="text-muted-foreground max-w-sm">
                  Select your resume above and click "Generate Answers" to get
                  personalized STAR-format responses for your next interview.
                </p>
                <Button
                  variant="outline"
                  onClick={startGeneration}
                  disabled={!selectedFileId}
                >
                  Start Generation
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </HomeLayout>
  );
};

export default AnswersPage;
