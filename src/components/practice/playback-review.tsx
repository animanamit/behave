"use client";

import { memo } from "react";
import { Heading, Text } from "@/components/ui/typography";
import { Clock } from "lucide-react";

interface PlaybackReviewProps {
  previewRef: any;
  recordedUrl: string | null;
  timer: number;
  formatTime: (s: number) => string;
}

export const PlaybackReview = memo(function PlaybackReview({
  previewRef,
  recordedUrl,
  timer,
  formatTime,
}: PlaybackReviewProps) {
  return (
    <div className="relative flex-1 bg-black rounded-lg border border-border overflow-hidden">
      <video
        ref={previewRef}
        src={recordedUrl || undefined}
        controls
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      />
      
      <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium font-mono uppercase tracking-wider rounded-full shadow-lg">
        Playback
      </div>

      <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md text-white px-3 py-1 text-sm font-mono rounded-full flex items-center gap-2">
        <Clock className="w-4 h-4" />
        {formatTime(timer)}
      </div>
    </div>
  );
});
