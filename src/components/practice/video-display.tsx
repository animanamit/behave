import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/typography";
import { Video, VideoOff, Mic, MicOff } from "lucide-react";
import { RefObject } from "react";

interface VideoDisplayProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  playbackVideoRef: RefObject<HTMLVideoElement | null>;
  cameraStarted: boolean;
  isPlayingRecording: boolean;
  recordedVideoUrl: string | null;
  hasCamera: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
  cameraError: string | null;
  isRecording: boolean;
  timer: number;
  onStartCamera: () => void;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onPlaybackEnded: () => void;
  formatTime: (seconds: number) => string;
}

export function VideoDisplay({
  videoRef,
  playbackVideoRef,
  cameraStarted,
  isPlayingRecording,
  recordedVideoUrl,
  hasCamera,
  isCameraOn,
  isMicOn,
  cameraError,
  isRecording,
  timer,
  onStartCamera,
  onToggleCamera,
  onToggleMic,
  onPlaybackEnded,
  formatTime,
}: VideoDisplayProps) {
  return (
    <div className="relative flex-1 bg-black rounded-lg border border-border overflow-hidden shadow-sm group">
      {/* Debug Overlay */}
      <div className="absolute top-0 right-0 bg-white/80 text-black text-xs p-1 z-50 font-mono pointer-events-none">
        Rec:{isRecording ? "ON" : "OFF"} | Play:
        {isPlayingRecording ? "ON" : "OFF"} | URL:
        {!!recordedVideoUrl ? "YES" : "NO"} | Cam:{hasCamera ? "YES" : "NO"}
      </div>

      {!cameraStarted ? (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/90">
          <div className="text-center space-y-6 max-w-sm mx-auto p-6 rounded-xl border border-white/10 bg-zinc-900 shadow-2xl">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto border-2 border-primary/20 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <Video className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-4">
              <Button
                onClick={onStartCamera}
                size="lg"
                className="w-full text-lg font-semibold h-12 shadow-lg hover:scale-105 transition-transform"
              >
                Start Camera
              </Button>
              <Text variant="muted" className="block text-sm text-zinc-400">
                Allow camera and microphone access to begin your practice
                session.
              </Text>
            </div>
          </div>
        </div>
      ) : isPlayingRecording && recordedVideoUrl ? (
        <>
          <video
            key="playback-video"
            ref={playbackVideoRef}
            src={recordedVideoUrl}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain bg-black"
            // onEnded={onPlaybackEnded} // Don't auto-close on end
          />
          <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium font-mono uppercase tracking-wider shadow-lg pointer-events-none z-10">
            Playback
          </div>
        </>
      ) : hasCamera ? (
        <>
          <video
            key="preview-video"
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain transform scale-x-[-1]"
          />
          {!isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto">
                  <VideoOff className="w-6 h-6 text-muted-foreground" />
                </div>
                <Text variant="muted">Camera is off</Text>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Text className="text-destructive">
            {cameraError || "Camera access denied"}
          </Text>
        </div>
      )}

      {isRecording && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-1 text-xs font-medium font-mono uppercase tracking-wider animate-pulse shadow-lg z-10">
          <div className="w-2 h-2 bg-current rounded-full" />
          Recording
        </div>
      )}

      {cameraStarted && !isPlayingRecording && (
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 font-mono text-sm rounded-full border border-white/10 shadow-sm z-10">
          {formatTime(timer)}
        </div>
      )}

      {cameraStarted && !isPlayingRecording && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 backdrop-blur-md p-2 rounded-full border border-white/10 shadow-lg z-10 transition-opacity opacity-0 group-hover:opacity-100">
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleCamera}
            disabled={!hasCamera}
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
            disabled={!hasCamera}
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
}
