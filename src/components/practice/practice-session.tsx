"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { STARAnswer } from "@/lib/zod-schemas";
import { Teleprompter } from "./teleprompter";
import { authClient } from "@/lib/auth-client";
import { useVideoRecorder } from "@/hooks/use-video-recorder";
import { VideoRecorder } from "./video-recorder";
import { RecordingControls } from "./recording-controls";
import { PlaybackReview } from "./playback-review";
import { trpc } from "@/lib/trpc-client";
import { toast } from "sonner";
import { useState, useCallback } from "react";

interface PracticeSessionProps {
  answer: STARAnswer;
  onBack: () => void;
}

export function PracticeSession({ answer, onBack }: PracticeSessionProps) {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;

  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  const getPresignedUrlMutation = trpc.files.getPresignedUrl.useMutation();
  const savePracticeSessionMutation = trpc.practiceSessions.savePracticeSession.useMutation();

  const {
    recordingState,
    timer,
    countdown,
    recordedBlob,
    recordedUrl,
    webcamRef,
    previewRef,
    handleStartCamera,
    handleStartRecording,
    handleStopRecording,
    handleReRecord,
    handleDiscard,
    errorMessage,
    formatTime,
    isCameraReady,
    isRecording,
    isReview,
  } = useVideoRecorder();

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!recordedBlob || !userId) {
      toast.error("No recording to save or user not authenticated");
      return;
    }

    setIsSaving(true);
    try {
      const fileName = `practice-${answer.id}-${Date.now()}.webm`;
      const fileType = "video/webm";
      const s3Key = `recordings/${userId}/${fileName}`;

      const { uploadURL } = await getPresignedUrlMutation.mutateAsync({
        s3Key,
        fileName,
        contentType: fileType,
      });

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: recordedBlob,
        headers: { "Content-Type": fileType },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload to S3");
      }

      await savePracticeSessionMutation.mutateAsync({
        answerId: answer.id as string,
        videoS3Key: s3Key,
        duration: timer,
        userId,
      });

      setShowSuccessOverlay(true);
      toast.success("Recording saved! Analysis in progress...");

      setTimeout(() => {
        toast.info("Check Sessions for AI feedback once analysis is complete.", {
          duration: 6000,
        });
      }, 2000);
    } catch (error) {
      console.error("[PracticeSession] ERROR:", error);
      toast.error("Failed to save recording");
      setIsSaving(false);
    }
  }, [recordedBlob, userId, answer.id, timer, getPresignedUrlMutation, savePracticeSessionMutation]);

  const handleToggleCamera = useCallback(() => {
    setIsCameraOn((prev) => !prev);
  }, []);

  const handleToggleMic = useCallback(() => {
    setIsMicOn((prev) => !prev);
  }, []);

  const handleRecordAnother = useCallback(() => {
    setShowSuccessOverlay(false);
    setIsSaving(false);
    handleReRecord();
  }, [handleReRecord]);

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col p-4 gap-4">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Practice Session</h1>
          <p className="text-sm text-muted-foreground">
            Record yourself while following the script
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-xl text-sm">
          {errorMessage}
        </div>
      )}

      {/* Main content */}
      <div className="grid lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Left: Video */}
        <div className="flex flex-col gap-4 h-full">
          {isReview ? (
            <PlaybackReview
              previewRef={previewRef}
              recordedUrl={recordedUrl}
              timer={timer}
              formatTime={formatTime}
            />
          ) : (
            <VideoRecorder
              webcamRef={webcamRef}
              isCameraReady={isCameraReady}
              isRecording={isRecording}
              countdown={countdown}
              onToggleCamera={handleToggleCamera}
              onToggleMic={handleToggleMic}
              isCameraOn={isCameraOn}
              isMicOn={isMicOn}
            />
          )}

          <RecordingControls
            recordingState={showSuccessOverlay ? "saved" : recordingState}
            timer={timer}
            formatTime={formatTime}
            onStartCamera={handleStartCamera}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onReRecord={handleRecordAnother}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </div>

        {/* Right: Teleprompter */}
        <div className="h-full overflow-hidden">
          <Teleprompter answer={answer} className="h-full" />
        </div>
      </div>

      {/* Success overlay */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <Card className="p-8 max-w-md w-full mx-4 animate-scale-in">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto animate-bounce-in">
                <CheckCircle2 className="w-12 h-12 text-success" />
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-2">Recording Saved!</h2>
                <p className="text-muted-foreground">
                  Your practice session is being analyzed. Check the Sessions page for AI feedback
                  once analysis is complete.
                </p>
              </div>

              <div className="space-y-3">
                <Button onClick={handleRecordAnother} className="w-full h-12">
                  Record Another Take
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSuccessOverlay(false);
                    onBack();
                  }}
                  className="w-full h-12"
                >
                  Back to Selection
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
