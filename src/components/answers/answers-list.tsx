"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { STARAnswer } from "@/lib/zod-schemas";

// -------------------------------------------------------------------------
// PROPS DEFINITION
// -------------------------------------------------------------------------
// Simplified to just accept an array of answers.
// The parent component handles the merging of streaming + completed data.
interface AnswersListProps {
  answers: STARAnswer[]; // The merged list of all answers (streaming + completed)
  isLoading: boolean; // Whether the "Daisy Chain" process is still active
}

export function AnswersList({ answers, isLoading }: AnswersListProps) {
  return (
    <div className="space-y-8">
      {/* 
        NOTE: The sticky progress bar has been removed as requested 
        to reduce visual noise and layout shift. 
        Progress is now handled via the Toast notification in page.tsx.
      */}

      {/* Answers List Container */}
      <div className="space-y-6">
        {answers.map((answer, idx) => {
          // -------------------------------------------------------------------------
          // ACTIVE CARD DETECTION
          // -------------------------------------------------------------------------
          // The "active" card is the very last one in the list IF we are currently loading.
          // This gets the "typing" animation styling.
          const isActive = isLoading && idx === answers.length - 1;

          return (
            <Card
              key={idx}
              className={cn(
                // Animation: Fade in and slide up when a new card appears
                "animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden transition-all",
                // Styling:
                // If active: Blue border + Glow + Shadow (User feedback for "I'm working here")
                // If static: Standard border
                isActive
                  ? "border-primary/50 shadow-md ring-1 ring-primary/10"
                  : "border-border"
              )}
            >
              <CardHeader className="bg-muted/5 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Index Badge (e.g., #1, #2) */}
                    <Badge
                      variant="secondary"
                      className="bg-muted text-muted-foreground"
                    >
                      #{answer.id || idx + 1}
                    </Badge>
                    {/* Competency Badge (e.g., Leadership) */}
                    <Badge variant="secondary">
                      {answer?.competency || "Thinking..."}
                    </Badge>
                  </div>
                  {/* 
                    Checkmark Indicator:
                    Only shows when the 'result' field (the final field) has content,
                    indicating the answer is likely fully generated.
                  */}
                  {answer?.result && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                </div>
                {/* Question Title */}
                <CardTitle className="text-lg mt-2 leading-snug">
                  {answer?.question || <Skeleton className="h-6 w-3/4" />}
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {/* 
                  STAR SECTIONS
                  Each section (Situation, Task, Action, Result) follows the same pattern:
                  - Small uppercase label
                  - Content div (uses div instead of p to allow Skeletons inside without hydration errors)
                  - Skeleton fallback if content is missing
                */}

                {/* Situation */}
                <div className="space-y-1">
                  <h4 className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                    Situation
                  </h4>
                  <div className="text-sm leading-relaxed">
                    {answer?.situation || <Skeleton className="h-4 w-full" />}
                  </div>
                </div>

                {/* Task */}
                <div className="space-y-1">
                  <h4 className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                    Task
                  </h4>
                  <div className="text-sm leading-relaxed">
                    {answer?.task || <Skeleton className="h-4 w-full" />}
                  </div>
                </div>

                {/* Action */}
                <div className="space-y-1">
                  <h4 className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                    Action
                  </h4>
                  <div className="text-sm leading-relaxed">
                    {answer?.action || <Skeleton className="h-4 w-full" />}
                  </div>
                </div>

                {/* Result */}
                <div className="space-y-1">
                  <h4 className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                    Result
                  </h4>
                  <div className="text-sm leading-relaxed font-medium text-foreground/90">
                    {answer?.result || <Skeleton className="h-4 w-full" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* 
          INITIAL LOADING SKELETON
          Only displayed when we have ZERO answers and are in the loading state.
          Ideally, the first stream chunk arrives so fast this is rarely seen,
          but it provides immediate feedback on the very first click.
        */}
        {isLoading && answers.length === 0 && (
          <Card className="border-dashed opacity-60 animate-pulse">
            <CardHeader className="bg-muted/5 pb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-6 w-1/2 mt-2" />
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
