"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, ChevronRight, Check } from "lucide-react";
import { STARAnswer } from "@/lib/zod-schemas";
import { cn } from "@/lib/utils";

/**
 * Preload the PracticeSession component on hover.
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

export function PracticeQuestionList({
  answers,
  practiceCounts = {},
  onSelectAnswer,
}: PracticeQuestionListProps) {
  const [filter, setFilter] = useState<"all" | "practiced" | "not-practiced">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredAnswers = answers.filter((answer) => {
    if (filter === "all") return true;
    const hasPracticed = (practiceCounts[answer.id as string] || 0) > 0;
    return filter === "practiced" ? hasPracticed : !hasPracticed;
  });

  // Group answers by competency
  const groupedAnswers = filteredAnswers.reduce((acc, answer) => {
    const competency = answer.competency || "Other";
    if (!acc[competency]) acc[competency] = [];
    acc[competency].push(answer);
    return acc;
  }, {} as Record<string, STARAnswer[]>);

  const competencies = Object.keys(groupedAnswers).sort();

  return (
    <div className="space-y-8">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-border/40">
        {[
          { value: "all", label: "All" },
          { value: "not-practiced", label: "To Practice" },
          { value: "practiced", label: "Completed" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as typeof filter)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors relative",
              filter === tab.value
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {filter === tab.value && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
            )}
          </button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground">
          {filteredAnswers.length} questions
        </span>
      </div>

      {/* Grouped list */}
      <div className="space-y-8">
        {competencies.map((competency) => (
          <div key={competency} className="space-y-1">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1 mb-3">
              {competency}
            </h3>
            <div className="space-y-0.5">
              {groupedAnswers[competency].map((answer, idx) => {
                const hasPracticed = (practiceCounts[answer.id as string] || 0) > 0;
                const isExpanded = expandedId === answer.id;

                return (
                  <div
                    key={answer.id}
                    className={cn(
                      "group rounded-lg transition-colors",
                      isExpanded ? "bg-secondary/50" : "hover:bg-secondary/30"
                    )}
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : (answer.id as string))}
                      className="w-full text-left px-3 py-3 flex items-start gap-3"
                    >
                      {/* Status indicator */}
                      <div className={cn(
                        "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs",
                        hasPracticed
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {hasPracticed ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>

                      {/* Question */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm leading-relaxed",
                          hasPracticed ? "text-muted-foreground" : "text-foreground"
                        )}>
                          {answer.question}
                        </p>
                      </div>

                      {/* Expand indicator */}
                      <ChevronRight className={cn(
                        "w-4 h-4 text-muted-foreground shrink-0 transition-transform mt-0.5",
                        isExpanded && "rotate-90"
                      )} />
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-3 pb-4 pt-1 ml-8 space-y-4 animate-fade-in">
                        {/* STAR preview */}
                        <div className="space-y-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Situation: </span>
                            <span className="text-foreground/80">{answer.situation}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Task: </span>
                            <span className="text-foreground/80">{answer.task}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Action: </span>
                            <span className="text-foreground/80">{answer.action}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Result: </span>
                            <span className="text-foreground/80">{answer.result}</span>
                          </div>
                        </div>

                        {/* Practice button */}
                        <Button
                          size="sm"
                          onMouseEnter={preloadPracticeSession}
                          onFocus={preloadPracticeSession}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAnswer(answer);
                          }}
                          className="gap-2"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Start Practice
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredAnswers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No questions match this filter.
        </div>
      )}
    </div>
  );
}
