"use client";

import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
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
  const utils = trpc.useUtils();

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

      console.log('[PracticeSession] Step 1: Getting presigned URL...', { fileName, fileType });
      const { uploadURL } = await getPresignedUrlMutation.mutateAsync({
        s3Key,
        fileName,
        contentType: fileType,
      });
      console.log('[PracticeSession] Step 1: Presigned URL received', { s3Key });

      console.log('[PracticeSession] Step 2: Uploading to S3...');
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: recordedBlob,
        headers: { "Content-Type": fileType },
      });

      if (!uploadResponse.ok) {
        console.error('[PracticeSession] Step 2: Upload failed', uploadResponse.status);
        throw new Error("Failed to upload to S3");
      }
      console.log('[PracticeSession] Step 2: Upload complete');

      console.log('[PracticeSession] Step 3: Saving session to DB...');
      const result = await savePracticeSessionMutation.mutateAsync({
        answerId: answer.id as string,
        videoS3Key: s3Key,
        duration: timer,
        userId,
      });
      console.log('[PracticeSession] Step 3: Session saved', result, 'Inngest event "video/uploaded" should trigger now');

      setShowSuccessOverlay(true);
      toast.success("Recording saved successfully! Analysis in progress...");

      setTimeout(() => {
        toast.info("Check the Review page for AI feedback once analysis is complete.", {
          duration: 6000,
        });
      }, 2000);

    } catch (error) {
      console.error('[PracticeSession] ERROR:', error);
      toast.error("Failed to save recording");
      setIsSaving(false);
    }
  }, [recordedBlob, userId, answer.id, timer, getPresignedUrlMutation, savePracticeSessionMutation]);

  const handleToggleCamera = useCallback(() => {
    setIsCameraOn(prev => !prev);
  }, []);

  const handleToggleMic = useCallback(() => {
    setIsMicOn(prev => !prev);
  }, []);

  const handleRecordAnother = useCallback(() => {
    setShowSuccessOverlay(false);
    setIsSaving(false);
    handleReRecord();
  }, [handleReRecord]);

  const handleBackToReview = useCallback(() => {
    setShowSuccessOverlay(false);
    setIsSaving(false);
  }, []);

  return (
    <div className="space-y-2 h-[calc(100vh-4rem)] flex flex-col p-2">
      <div className="flex justify-between items-center shrink-0 pb-2">
        <div className="space-y-1">
          <Heading as="h2" className="text-xl">
            Practice Session
          </Heading>
          <Text variant="muted" className="text-xs">
            Record your answer while following script
          </Text>
        </div>
        <Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Back to Selection
        </Button>
      </div>

      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
          <Text className="font-medium">{errorMessage}</Text>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 flex-1 min-h-0">
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
            recordingState={showSuccessOverlay ? 'saved' : recordingState}
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

        <div className="h-full overflow-hidden">
          <Teleprompter answer={answer} className="h-full" />
        </div>
      </div>

      {showSuccessOverlay && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              
              <div>
                <Heading as="h3" className="text-2xl mb-2">
                  Recording Saved!
                </Heading>
                <Text variant="muted" className="text-center">
                  Your practice session is being analyzed. You can view the results 
                  on your review page once analysis is complete.
                </Text>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleRecordAnother}
                  className="w-full h-12 text-base"
                >
                  Record Another Take
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    handleBackToReview();
                    onBack();
                  }}
                  className="w-full h-12 text-base"
                >
                  Back to Selection
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
