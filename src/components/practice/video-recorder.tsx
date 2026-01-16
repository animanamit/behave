"use client";

import { Video, VideoOff, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="relative flex-1 bg-foreground/95 rounded-xl overflow-hidden">
      <video
        ref={webcamRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-contain transform scale-x-[-1]"
      />

      {/* Countdown overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-8xl font-bold text-white animate-pulse">
            {countdown}
          </div>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive text-white px-4 py-2 text-sm font-medium rounded-full animate-pulse">
          <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
          Recording
        </div>
      )}

      {/* Camera/Mic controls */}
      {isCameraReady && countdown === null && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10">
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleCamera}
            className={cn(
              "rounded-full h-10 w-10 transition-colors",
              isCameraOn
                ? "text-white hover:text-white hover:bg-white/20"
                : "text-red-400 hover:text-red-400 hover:bg-red-500/20"
            )}
          >
            {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleMic}
            className={cn(
              "rounded-full h-10 w-10 transition-colors",
              isMicOn
                ? "text-white hover:text-white hover:bg-white/20"
                : "text-red-400 hover:text-red-400 hover:bg-red-500/20"
            )}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>
        </div>
      )}
    </div>
  );
});
