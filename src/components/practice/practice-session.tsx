"use client";

import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import { ArrowLeft } from "lucide-react";
import { STARAnswer } from "@/lib/zod-schemas";
import { Teleprompter } from "./teleprompter";
import { authClient } from "@/lib/auth-client";
import { usePracticeSession } from "@/hooks/use-practice-session";
import { VideoDisplay } from "./video-display";
import { PracticeControls } from "./practice-controls";

interface PracticeSessionProps {
  answer: STARAnswer;
  onBack: () => void;
}

export function PracticeSession({ answer, onBack }: PracticeSessionProps) {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;

  const {
    isRecording,
    isSaving,
    timer,
    cameraStarted,
    hasCamera,
    cameraError,
    isCameraOn,
    isMicOn,
    recordedVideoUrl,
    isPlayingRecording,
    videoRef,
    playbackVideoRef,
    handleStartCamera,
    toggleCamera,
    toggleMic,
    handleStartRecording,
    handleStopRecording,
    handlePlayRecording,
    handleBackToCamera,
    handleSaveRecording,
    formatTime,
  } = usePracticeSession({ answer, userId });

  return (
    <div className="space-y-2 h-[calc(100vh-4rem)] flex flex-col p-2">
      <div className="flex justify-between items-center shrink-0 pb-2">
        <div className="space-y-1">
          <Heading as="h2" className="text-xl">
            Practice Session
          </Heading>
          <Text variant="muted" className="text-xs">
            Record your answer while following the script
          </Text>
        </div>
        <Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Back to Selection
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-4 h-full">
          <VideoDisplay
            videoRef={videoRef}
            playbackVideoRef={playbackVideoRef}
            cameraStarted={cameraStarted}
            isPlayingRecording={isPlayingRecording}
            recordedVideoUrl={recordedVideoUrl}
            hasCamera={hasCamera}
            isCameraOn={isCameraOn}
            isMicOn={isMicOn}
            cameraError={cameraError}
            isRecording={isRecording}
            timer={timer}
            onStartCamera={handleStartCamera}
            onToggleCamera={toggleCamera}
            onToggleMic={toggleMic}
            onPlaybackEnded={handleBackToCamera}
            formatTime={formatTime}
          />

          <PracticeControls
            cameraStarted={cameraStarted}
            isRecording={isRecording}
            isSaving={isSaving}
            isPlayingRecording={isPlayingRecording}
            recordedVideoUrl={recordedVideoUrl}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onPlayRecording={handlePlayRecording}
            onSaveRecording={handleSaveRecording}
            onBackToCamera={handleBackToCamera}
          />
        </div>

        <div className="h-full overflow-hidden">
          <Teleprompter answer={answer} className="h-full" />
        </div>
      </div>
    </div>
  );
}
