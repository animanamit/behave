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
                // Animation: Smooth fade in and slide up when a new card appears
                "animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out overflow-hidden transition-all",
                // Styling:
                // If active: Blue border + Glow + Shadow (User feedback for "I'm working here")
                // If static: Borderless with subtle background hover
                isActive
                  ? "border-primary/50 shadow-lg ring-1 ring-primary/20 bg-primary/5"
                  : "border-0 shadow-none bg-transparent hover:bg-muted/20"
              )}
            >
              <CardHeader className="pb-3 pl-0">
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
                    <Badge
                      variant="outline"
                      className="border-muted-foreground/20"
                    >
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

              <CardContent className="pt-2 pl-0 space-y-6">
                {/* 
                  STAR SECTIONS
                  Each section (Situation, Task, Action, Result) follows the same pattern:
                  - Small uppercase label
                  - Content div (uses div instead of p to allow Skeletons inside without hydration errors)
                  - Skeleton fallback if content is missing
                */}

                {/* Situation - GREEN */}
                <div className="space-y-1.5">
                  <h4 className="font-bold uppercase tracking-wider text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    Situation
                  </h4>
                  <div className="text-sm leading-relaxed text-foreground/90">
                    {answer?.situation || <Skeleton className="h-4 w-full" />}
                  </div>
                </div>

                {/* Task - BLUE */}
                <div className="space-y-1.5">
                  <h4 className="font-bold uppercase tracking-wider text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    Task
                  </h4>
                  <div className="text-sm leading-relaxed text-foreground/90">
                    {answer?.task || <Skeleton className="h-4 w-full" />}
                  </div>
                </div>

                {/* Action - AMBER/YELLOW */}
                <div className="space-y-1.5">
                  <h4 className="font-bold uppercase tracking-wider text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    Action
                  </h4>
                  <div className="text-sm leading-relaxed text-foreground/90">
                    {answer?.action || <Skeleton className="h-4 w-full" />}
                  </div>
                </div>

                {/* Result - RED/ROSE */}
                <div className="space-y-1.5">
                  <h4 className="font-bold uppercase tracking-wider text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    Result
                  </h4>
                  <div className="text-sm leading-relaxed font-medium text-foreground">
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
          <Card className="border-0 shadow-none opacity-60 animate-pulse">
            <CardHeader className="pb-3 pl-0">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-6 w-1/2 mt-2" />
            </CardHeader>
            <CardContent className="pt-2 pl-0 space-y-4">
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
