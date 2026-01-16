"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { STARAnswer } from "@/lib/zod-schemas";
import Link from "next/link";

interface AnswersListProps {
  answers: STARAnswer[];
  isLoading: boolean;
  onSelectAnswer?: (answer: STARAnswer) => void;
  showContent?: boolean;
  practicedIds?: Set<string>; // IDs of answers that have been practiced
}

export function AnswersList({
  answers,
  isLoading,
  onSelectAnswer,
  showContent = true,
  practicedIds = new Set(),
}: AnswersListProps) {
  return (
    <div className="space-y-4">
      {answers.map((answer, idx) => {
        const isActive = isLoading && idx === answers.length - 1;
        const isPracticed = practicedIds.has(String(answer.id));

        const staggerClass = idx < 8 ? `stagger-${idx + 1}` : "";

        return (
          <Card
            key={idx}
            onClick={() => onSelectAnswer?.(answer)}
            className={cn(
              "answer-card overflow-hidden transition-colors duration-200 stagger-item",
              staggerClass,
              isActive
                ? "border-accent/30 bg-accent/5"
                : "hover:bg-secondary/30",
              onSelectAnswer && "cursor-pointer"
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-light text-muted-foreground/40 tabular-nums">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <Badge variant="outline">{answer?.competency || "..."}</Badge>
                  {isPracticed && (
                    <Badge variant="success" size="sm">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Practiced
                    </Badge>
                  )}
                </div>
                {answer?.result && !isPracticed && (
                  <Link
                    href={`/practice?id=${answer.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="outline" size="sm">
                      <Play className="w-3 h-3 mr-1" />
                      Practice
                    </Button>
                  </Link>
                )}
              </div>
              <CardTitle className="text-base mt-3 leading-snug font-medium">
                {answer?.question || <Skeleton className="h-5 w-3/4" />}
              </CardTitle>
            </CardHeader>

            {showContent && (
              <CardContent className="pt-0 space-y-4">
                {/* Situation */}
                <div className="space-y-1.5">
                  <Badge variant="situation" size="sm">
                    Situation
                  </Badge>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {answer?.situation || <Skeleton className="h-4 w-full" />}
                  </p>
                </div>

                {/* Task */}
                <div className="space-y-1.5">
                  <Badge variant="task" size="sm">
                    Task
                  </Badge>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {answer?.task || <Skeleton className="h-4 w-full" />}
                  </p>
                </div>

                {/* Action */}
                <div className="space-y-1.5">
                  <Badge variant="action" size="sm">
                    Action
                  </Badge>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {answer?.action || <Skeleton className="h-4 w-full" />}
                  </p>
                </div>

                {/* Result */}
                <div className="space-y-1.5">
                  <Badge variant="result" size="sm">
                    Result
                  </Badge>
                  <p className="text-sm leading-relaxed text-foreground font-medium">
                    {answer?.result || <Skeleton className="h-4 w-full" />}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Initial loading skeleton */}
      {isLoading && answers.length === 0 && (
        <Card className="opacity-60 animate-pulse">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-5 w-1/2 mt-3" />
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
