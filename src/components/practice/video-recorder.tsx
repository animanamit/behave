"use client";

import { Video, VideoOff, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/typography";
import { memo } from "react";
import { cn } from "@/lib/utils";

interface VideoRecorderProps {
  webcamRef: any;
  isCameraReady: boolean;
  isRecording: boolean;
  countdown: number | null;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  isCameraOn: boolean;
  isMicOn: boolean;
}

export const VideoRecorder = memo(function VideoRecorder({
  webcamRef,
  isCameraReady,
  isRecording,
  countdown,
  onToggleCamera,
  onToggleMic,
  isCameraOn,
  isMicOn,
}: VideoRecorderProps) {
  return (
    <div className="relative flex-1 bg-black rounded-lg border border-border overflow-hidden">
      <video
        ref={webcamRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-contain transform scale-x-[-1]"
      />
      
      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="text-8xl font-bold text-white animate-pulse">
            {countdown}
          </div>
        </div>
      )}

      {isRecording && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-1.5 text-xs font-medium font-mono uppercase tracking-wider animate-pulse rounded-full">
          <div className="w-2 h-2 bg-current rounded-full" />
          Recording
        </div>
      )}

      {(isCameraReady || isRecording) && countdown === null && (
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 font-mono text-sm rounded-full border border-white/10">
          00:00
        </div>
      )}

      {isCameraReady && countdown === null && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/50 backdrop-blur-md p-2 rounded-full border border-white/10">
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleCamera}
            className="text-white hover:text-white hover:bg-white/20 rounded-full h-10 w-10"
          >
            {isCameraOn ? (
              <Video className="w-5 h-5" />
            ) : (
              <VideoOff className="w-5 h-5" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleMic}
            className="text-white hover:text-white hover:bg-white/20 rounded-full h-10 w-10"
          >
            {isMicOn ? (
              <Mic className="w-5 h-5" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
});
