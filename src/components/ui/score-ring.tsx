"use client";

import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number; // 0-100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

/**
 * Circular progress ring for displaying scores.
 *
 * Features:
 * - Color-coded based on score (green/blue/amber)
 * - Subtle glow effect
 * - Animated fill on mount
 */
export function ScoreRing({
  score,
  size = "md",
  showLabel = true,
  className,
}: ScoreRingProps) {
  // Clamp score between 0-100
  const clampedScore = Math.max(0, Math.min(100, score));

  // Determine color based on score
  const getScoreColor = () => {
    if (clampedScore >= 80) return "success";
    if (clampedScore >= 60) return "info";
    return "warning";
  };

  const color = getScoreColor();

  const colorClasses = {
    success: {
      stroke: "stroke-success",
      text: "text-success",
      glow: "drop-shadow-[0_0_8px_var(--success-glow)]",
    },
    info: {
      stroke: "stroke-info",
      text: "text-info",
      glow: "drop-shadow-[0_0_8px_var(--info-glow)]",
    },
    warning: {
      stroke: "stroke-warning",
      text: "text-warning",
      glow: "drop-shadow-[0_0_8px_var(--warning-glow)]",
    },
  };

  const sizeConfig = {
    sm: { dimension: 48, strokeWidth: 4, fontSize: "text-sm" },
    md: { dimension: 72, strokeWidth: 5, fontSize: "text-xl" },
    lg: { dimension: 96, strokeWidth: 6, fontSize: "text-2xl" },
  };

  const { dimension, strokeWidth, fontSize } = sizeConfig[size];
  const radius = (dimension - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
        className={cn("-rotate-90", colorClasses[color].glow)}
      >
        {/* Background circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn(
            colorClasses[color].stroke,
            "transition-[stroke-dashoffset] duration-700 ease-out"
          )}
          style={{
            // Animation on mount
            animation: "score-ring-fill 0.8s ease-out forwards",
          }}
        />
      </svg>

      {/* Score label */}
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-semibold", fontSize, colorClasses[color].text)}>
            {Math.round(clampedScore)}
          </span>
        </div>
      )}

      <style jsx>{`
        @keyframes score-ring-fill {
          from {
            stroke-dashoffset: ${circumference};
          }
          to {
            stroke-dashoffset: ${strokeDashoffset};
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Compact inline score display (no ring, just colored text)
 */
export function ScoreText({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const clampedScore = Math.max(0, Math.min(100, score));

  const colorClass =
    clampedScore >= 80
      ? "score-excellent"
      : clampedScore >= 60
      ? "score-good"
      : "score-needs-work";

  return (
    <span className={cn("font-semibold", colorClass, className)}>
      {Math.round(clampedScore)}%
    </span>
  );
}
