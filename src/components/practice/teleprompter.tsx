"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import { STARAnswer } from "@/lib/zod-schemas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface TeleprompterProps {
  answer: STARAnswer;
  className?: string;
}

const SECTIONS = ["Question", "Situation", "Task", "Action", "Result"] as const;

type SectionType = (typeof SECTIONS)[number];

const sectionStyles: Record<SectionType, { badge: "default" | "situation" | "task" | "action" | "result"; color: string }> = {
  Question: { badge: "default", color: "text-foreground" },
  Situation: { badge: "situation", color: "text-[var(--star-situation)]" },
  Task: { badge: "task", color: "text-[var(--star-task)]" },
  Action: { badge: "action", color: "text-[var(--star-action)]" },
  Result: { badge: "result", color: "text-[var(--star-result)]" },
};

export const Teleprompter = memo(function Teleprompter({ answer, className }: TeleprompterProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const sectionContent = [
    {
      title: "Question" as const,
      content: answer.question,
      description: "The interview question:",
    },
    {
      title: "Situation" as const,
      content: answer.situation,
      description: "Set the scene with context and details.",
    },
    {
      title: "Task" as const,
      content: answer.task,
      description: "Describe your responsibility.",
    },
    {
      title: "Action" as const,
      content: answer.action,
      description: "Explain the steps you took.",
    },
    {
      title: "Result" as const,
      content: answer.result,
      description: "Share the outcomes achieved.",
    },
  ];

  const currentSection = sectionContent[currentIndex];
  const progress = ((currentIndex + 1) / SECTIONS.length) * 100;
  const style = sectionStyles[currentSection.title];

  const handleNext = useCallback(() => {
    if (currentIndex < SECTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleReset = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.code) {
        case "Space":
        case "ArrowRight":
          e.preventDefault();
          handleNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlePrev();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden shadow-sm",
        className
      )}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-secondary/30 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant={style.badge} size="lg">
              {currentSection.title}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} of {SECTIONS.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleReset}
            title="Reset to beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 p-6 overflow-y-auto relative group"
      >
        {/* Keyboard hint */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md border">
          Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">Space</kbd> to advance
        </div>

        <div key={currentIndex} className="max-w-prose mx-auto space-y-4 animate-fade-in">
          <p className="text-sm text-muted-foreground font-medium">
            {currentSection.description}
          </p>

          <div className="space-y-4">
            {currentSection.content
              .split(/(?<=[.!?])\s+(?=[A-Z])/)
              .map((sentence, i) => (
                <p
                  key={i}
                  className={cn(
                    "text-lg leading-relaxed font-medium",
                    currentSection.title === "Question"
                      ? "text-foreground italic"
                      : "text-foreground/90"
                  )}
                >
                  {sentence.trim()}
                </p>
              ))}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="px-5 py-4 border-t border-border bg-secondary/20 shrink-0 flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px]">←</kbd>
          <kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px]">Space</kbd>
          <kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px]">→</kbd>
        </div>

        <Button
          size="sm"
          onClick={handleNext}
          disabled={currentIndex === SECTIONS.length - 1}
          className="gap-2"
        >
          Next
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});
