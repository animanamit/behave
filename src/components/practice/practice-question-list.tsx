"use client";

import { useState, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, History } from "lucide-react";
import { STARAnswer } from "@/lib/zod-schemas";

/**
 * Preload the PracticeSession component on hover.
 * This triggers the dynamic import before the user clicks,
 * so the component is ready when they start practicing.
 * See revisions.md for explanation.
 */
const preloadPracticeSession = () => {
  import("@/components/practice/practice-session");
};

interface PracticeQuestionListProps {
  answers: STARAnswer[];
  practiceCounts?: Record<string, number>;
  onSelectAnswer: (answer: STARAnswer) => void;
  onReviewSessions: (answer: STARAnswer) => void;
}

const ITEMS_PER_PAGE = 12;

export function PracticeQuestionList({
  answers,
  practiceCounts = {},
  onSelectAnswer,
  onReviewSessions,
}: PracticeQuestionListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "practiced" | "not-practiced">("all");

  const filteredAnswers = answers.filter((answer) => {
    if (filter === "all") return true;
    const hasPracticed = (practiceCounts[answer.id as string] || 0) > 0;
    return filter === "practiced" ? hasPracticed : !hasPracticed;
  });

  const totalPages = Math.ceil(filteredAnswers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAnswers = filteredAnswers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {filteredAnswers.length} questions
          </span>
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="text-sm border border-border rounded-md px-3 py-1.5 bg-background"
          >
            <option value="all">All</option>
            <option value="practiced">Practiced</option>
            <option value="not-practiced">Not Practiced</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedAnswers.map((answer) => {
          const practiceCount = practiceCounts[answer.id as string] || 0;
          const hasPracticed = practiceCount > 0;

          return (
            <Card
              key={answer.id}
              className="transition-all duration-200 hover:border-primary/50 hover:shadow-sm"
            >
              <CardHeader className="p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    #{answer.id}
                  </Badge>
                  <Badge variant="outline">{answer.competency}</Badge>
                  {hasPracticed && (
                    <Badge variant="secondary" className="text-xs">
                      {practiceCount}
                    </Badge>
                  )}
                </div>

                <CardTitle className="text-sm font-medium leading-snug line-clamp-3">
                  {answer.question}
                </CardTitle>

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 gap-1 text-xs"
                    onMouseEnter={preloadPracticeSession}
                    onFocus={preloadPracticeSession}
                    onClick={() => {
                      onSelectAnswer(answer);
                    }}
                  >
                    <Play className="w-3 h-3" />
                    Practice
                  </Button>

                  {hasPracticed && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1 text-xs"
                      onClick={() => {
                        onReviewSessions(answer);
                      }}
                    >
                      <History className="w-3 h-3" />
                      Review
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className="w-9"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
