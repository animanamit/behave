"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { STARAnswer } from "@/lib/zod-schemas";

interface PracticeQuestionListProps {
  answers: STARAnswer[];
  onSelectAnswer: (answer: STARAnswer) => void;
}

export function PracticeQuestionList({
  answers,
  onSelectAnswer,
}: PracticeQuestionListProps) {
  return (
    <div className="space-y-3">
      {answers.map((answer, idx) => (
        <Card
          key={idx}
          onClick={() => onSelectAnswer(answer)}
          className={cn(
            "group cursor-pointer transition-all duration-200",
            "border-border/50 hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm"
          )}
        >
          <CardHeader className="p-4">
            <div className="flex flex-col gap-2">
              {/* Competency Badge - Prominent at the top */}
              <div className="flex items-center">
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-normal px-2 py-0.5"
                >
                  {answer?.competency || "Competency"}
                </Badge>
              </div>

              {/* Question Title */}
              <CardTitle className="text-base font-medium leading-snug group-hover:text-primary transition-colors">
                {answer?.question || <Skeleton className="h-5 w-3/4" />}
              </CardTitle>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

