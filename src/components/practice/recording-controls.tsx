"use client";

import { Play, Square, RotateCcw, Save, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/typography";
import { memo } from "react";

type RecordingState = 
  | 'idle' 
  | 'camera_ready' 
  | 'countdown' 
  | 'recording' 
  | 'review' 
  | 'saving' 
  | 'saved';

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
    <div className="relative h-24 border border-border bg-card rounded-xl flex items-center justify-center shadow-sm w-full max-w-lg mx-auto px-8">
      
      {recordingState === 'idle' && (
        <Button
          size="lg"
          onClick={onStartCamera}
          className="rounded-full w-20 h-20 bg-primary hover:bg-primary/90 text-white"
        >
          <div className="w-8 h-8 bg-white rounded-sm" />
        </Button>
      )}

      {recordingState === 'camera_ready' && (
        <Button
          size="lg"
          onClick={onStartRecording}
          className="rounded-full w-20 h-20 bg-red-500 hover:bg-red-600 text-white border-4 border-red-100 shadow-xl hover:scale-105 transition-all"
        >
          <div className="w-8 h-8 bg-current rounded-sm" />
        </Button>
      )}

      {recordingState === 'countdown' && (
        <div className="text-4xl font-bold text-red-500 animate-pulse">
          Get Ready...
        </div>
      )}

      {recordingState === 'recording' && (
        <Button
          size="lg"
          onClick={onStopRecording}
          className="rounded-full w-20 h-20 bg-white text-red-500 border-4 border-red-100 shadow-xl hover:scale-105 transition-all"
        >
          <Square className="w-10 h-10 fill-current" />
        </Button>
      )}

      {recordingState === 'review' && (
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={onReRecord}
            className="gap-2 h-16 px-6"
          >
            <RotateCcw className="w-5 h-5" />
            Re-record
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={onSave}
            disabled={isSaving}
            className="gap-2 h-16 px-6 bg-primary hover:bg-primary/90"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      )}

      {recordingState === 'saving' && (
        <div className="flex items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <Text className="text-lg">Uploading your recording...</Text>
        </div>
      )}

      {recordingState === 'saved' && (
        <div className="text-center space-y-2">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
          <Text className="text-lg font-medium text-green-700">
            Recording saved successfully!
          </Text>
        </div>
      )}

      {recordingState === 'recording' && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-1 rounded-full font-mono text-lg">
          {formatTime(timer)}
        </div>
      )}
    </div>
  );
});
