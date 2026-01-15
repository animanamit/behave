"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, History } from "lucide-react";
import { useState } from "react";
import { STARAnswer } from "@/lib/zod-schemas";
import type { PracticeSessionWithFeedback } from "@/lib/zod-schemas";

interface CompetencyScore {
  competency: string;
  averageScore: number;
  sessionCount: number;
}

interface CompetencyBarsProps {
  competencies: CompetencyScore[];
}

export function CompetencyBars({ competencies }: CompetencyBarsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    return "text-yellow-600 dark:text-yellow-400";
  };

  if (competencies.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-border bg-muted/5 rounded-xl">
        No practice sessions to analyze yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {competencies.map((item) => (
        <div key={item.competency} className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.competency}</span>
              <Badge variant="outline" className="text-xs">
                {item.sessionCount} session{item.sessionCount === 1 ? "" : "s"}
              </Badge>
            </div>
            <span
              className={`font-bold ${getScoreColor(item.averageScore)}`}
            >
              {Math.round(item.averageScore)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`${getScoreColor(item.averageScore)} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${item.averageScore}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
