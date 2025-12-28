import { Button } from "@/components/ui/button";
import {
  Video,
  Play,
  Circle,
  Square,
  Save,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PracticeControlsProps {
  cameraStarted: boolean;
  isRecording: boolean;
  isSaving: boolean;
  isPlayingRecording: boolean;
  recordedVideoUrl: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayRecording: () => void;
  onSaveRecording: () => void;
  onBackToCamera: () => void;
}

export function PracticeControls({
  cameraStarted,
  isRecording,
  isSaving,
  isPlayingRecording,
  recordedVideoUrl,
  onStartRecording,
  onStopRecording,
  onPlayRecording,
  onSaveRecording,
  onBackToCamera,
}: PracticeControlsProps) {
  const hasRecording = !!recordedVideoUrl;

  console.log("[PracticeControls] Render:", {
    cameraStarted,
    isRecording,
    isSaving,
    isPlayingRecording,
    hasRecording,
  });

  return (
    <div className="h-24 border border-border bg-card rounded-xl flex items-center justify-between px-8 gap-6 shadow-sm w-full max-w-3xl mx-auto">
      {/* Left Group: Playback Controls */}
      <div className="flex items-center gap-3 flex-1 justify-start">
        <Button
          onClick={onPlayRecording}
          variant="outline"
          className="gap-2 min-w-[100px]"
          disabled={!hasRecording || isRecording || isSaving || !cameraStarted}
        >
          <Play className="w-4 h-4" />
          Review
        </Button>

        <Button
          onClick={onBackToCamera}
          variant="ghost"
          className="gap-2"
          disabled={!isPlayingRecording || isSaving}
        >
          <Video className="w-4 h-4" />
          Back to Cam
        </Button>
      </div>

      {/* Center Group: Record Control */}
      <div className="flex items-center justify-center shrink-0">
        {!isRecording ? (
          <Button
            size="lg"
            onClick={() => {
              console.log("[PracticeControls] Start button clicked");
              onStartRecording();
            }}
            disabled={!cameraStarted || isSaving || isPlayingRecording}
            className={cn(
              "rounded-full w-16 h-16 p-0 shadow-xl hover:scale-105 transition-all duration-300",
              cameraStarted
                ? "bg-red-500 hover:bg-red-600 text-white border-4 border-red-100"
                : "bg-zinc-200 text-zinc-400 border-4 border-zinc-100 cursor-not-allowed"
            )}
          >
            <div className="w-6 h-6 bg-current rounded-sm" />
            <span className="sr-only">Start Recording</span>
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={() => {
              console.log("[PracticeControls] Stop button clicked");
              onStopRecording();
            }}
            className="rounded-full w-16 h-16 p-0 border-4 border-red-100 bg-white text-red-500 hover:bg-red-50 hover:scale-105 transition-all duration-300 shadow-xl"
          >
            <Square className="w-6 h-6 fill-current" />
            <span className="sr-only">Stop Recording</span>
          </Button>
        )}
      </div>

      {/* Right Group: Action Controls */}
      <div className="flex items-center gap-3 flex-1 justify-end">
        <Button
          onClick={onStartRecording} // Using start recording as "New Take" implies resetting
          variant="secondary"
          className="gap-2"
          disabled={!hasRecording || isRecording || isSaving}
        >
          <RefreshCw className="w-4 h-4" />
          New Take
        </Button>

        <Button
          onClick={onSaveRecording}
          variant="default"
          className="gap-2 min-w-[120px]"
          disabled={!hasRecording || isRecording || isSaving}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
