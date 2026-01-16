"use client";

import { Play, Square, RotateCcw, Save, Loader2, CheckCircle2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { memo } from "react";
import { cn } from "@/lib/utils";

type RecordingState =
  | "idle"
  | "camera_ready"
  | "countdown"
  | "recording"
  | "review"
  | "saving"
  | "saved";

interface RecordingControlsProps {
  recordingState: RecordingState;
  timer: number;
  formatTime: (s: number) => string;
  onStartCamera: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onReRecord: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export const RecordingControls = memo(function RecordingControls({
  recordingState,
  timer,
  formatTime,
  onStartCamera,
  onStartRecording,
  onStopRecording,
  onReRecord,
  onSave,
  isSaving,
}: RecordingControlsProps) {
  return (
    <div className="relative border border-border/40 bg-card rounded-xl p-6 flex flex-col items-center justify-center min-h-[120px]">
      {/* Timer display when recording */}
      {recordingState === "recording" && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-background px-5 py-2 rounded-full font-mono text-lg font-medium">
          {formatTime(timer)}
        </div>
      )}

      {/* Idle - Start camera */}
      {recordingState === "idle" && (
        <Button size="xl" onClick={onStartCamera} className="gap-3">
          <Camera className="w-5 h-5" />
          Start Camera
        </Button>
      )}

      {/* Camera ready - Start recording */}
      {recordingState === "camera_ready" && (
        <button
          onClick={onStartRecording}
          className="w-20 h-20 rounded-full bg-destructive hover:bg-destructive/90 text-white flex items-center justify-center hover:scale-105 transition-all ring-4 ring-destructive/10"
        >
          <div className="w-7 h-7 bg-white rounded-sm" />
        </button>
      )}

      {/* Countdown */}
      {recordingState === "countdown" && (
        <div className="text-3xl font-bold text-destructive animate-pulse">
          Get Ready...
        </div>
      )}

      {/* Recording - Stop button */}
      {recordingState === "recording" && (
        <button
          onClick={onStopRecording}
          className="w-20 h-20 rounded-full bg-white border-4 border-destructive/20 text-destructive flex items-center justify-center hover:scale-105 transition-all"
        >
          <Square className="w-8 h-8 fill-current" />
        </button>
      )}

      {/* Review - Save or re-record */}
      {recordingState === "review" && (
        <div className="flex items-center gap-4">
          <Button variant="outline" size="lg" onClick={onReRecord} className="gap-2 h-14 px-6">
            <RotateCcw className="w-5 h-5" />
            Re-record
          </Button>
          <Button
            size="lg"
            onClick={onSave}
            disabled={isSaving}
            className="gap-2 h-14 px-8"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Recording
              </>
            )}
          </Button>
        </div>
      )}

      {/* Saving state */}
      {recordingState === "saving" && (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-lg">Uploading your recording...</span>
        </div>
      )}

      {/* Saved state */}
      {recordingState === "saved" && (
        <div className="text-center space-y-2">
          <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
          <p className="text-lg font-medium text-success">Recording saved!</p>
        </div>
      )}

      {/* Helper text */}
      {recordingState === "camera_ready" && (
        <p className="text-sm text-muted-foreground mt-4">
          Click the red button to start recording
        </p>
      )}
    </div>
  );
});
