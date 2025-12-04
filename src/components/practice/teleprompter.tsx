"use client";

import { useState, useEffect, useCallback } from "react";
import { STARAnswer } from "@/lib/zod-schemas";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import { ArrowRight, ArrowLeft, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface TeleprompterProps {
  answer: STARAnswer;
  className?: string;
}

const SECTIONS = ["Question", "Situation", "Task", "Action", "Result"] as const;

export function Teleprompter({ answer, className }: TeleprompterProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Map sections to their content
  const sectionContent = [
    {
      title: "Question",
      content: answer.question,
      description: "Prepare to answer:",
    },
    {
      title: "Situation",
      content: answer.situation,
      description:
        "Set the scene and give the necessary details of your example.",
    },
    {
      title: "Task",
      content: answer.task,
      description: "Describe what your responsibility was in that situation.",
    },
    {
      title: "Action",
      content: answer.action,
      description: "Explain exactly what steps you took to address it.",
    },
    {
      title: "Result",
      content: answer.result,
      description: "Share what outcomes your actions achieved.",
    },
  ];

  const currentSection = sectionContent[currentIndex];
  const progress = ((currentIndex + 1) / SECTIONS.length) * 100;

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input (though there aren't any here)
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.code) {
        case "Space":
        case "ArrowRight":
          e.preventDefault(); // Prevent page scroll on space
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
        "flex flex-col h-full bg-card border border-border rounded-lg overflow-hidden shadow-sm",
        className
      )}
    >
      {/* Header with Progress */}
      <div className="px-4 py-3 border-b border-border bg-muted/30 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Text
              variant="muted"
              className="text-[10px] font-small uppercase tracking-wider"
            >
              Current Section
            </Text>
            <div className="flex items-center gap-2">
              <Heading as="h3" className="text-base text-primary">
                {currentSection.title}
              </Heading>
              <span className="text-muted-foreground text-xs font-normal">
                ({currentIndex + 1}/{SECTIONS.length})
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            title="Reset to beginning"
            className="h-8 w-8"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
        <Progress value={progress} className="h-1" />
      </div>

      {/* Main Content Area - Scrollable if text is very long, but trying to fit it */}
      <div className="flex-1 p-4 flex flex-col justify-center overflow-y-auto relative group scrollbar-thin">
        {/* Hint Overlay */}
        <div className="absolute top-2 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded border border-border pointer-events-none">
          Press <span className="font-mono font-bold">Space</span> to advance
        </div>

        <div className="space-y-3 max-w-prose mx-auto w-full">
          <Text className="text-base text-muted-foreground font-medium">
            {currentSection.description}
          </Text>

          <div className="prose dark:prose-invert leading-relaxed">
            <p className="text-md font-semibold tracking-tight">
              {currentSection.content}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Navigation controls */}
      <div className="px-4 py-3 border-t border-border bg-muted/10 shrink-0 flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="w-28 gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Previous
        </Button>

        <div className="text-[10px] text-muted-foreground hidden sm:block">
          Use <kbd className="px-1 py-0.5 bg-muted border rounded">←</kbd>{" "}
          <kbd className="px-1 py-0.5 bg-muted border rounded">Space</kbd>{" "}
          <kbd className="px-1 py-0.5 bg-muted border rounded">→</kbd> keys
        </div>

        <Button
          size="sm"
          onClick={handleNext}
          disabled={currentIndex === SECTIONS.length - 1}
          className="w-28 gap-2"
        >
          Next
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
