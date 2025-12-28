import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc-client";
import { STARAnswer } from "@/lib/zod-schemas";
import { useReactMediaRecorder } from "react-media-recorder";

interface UsePracticeSessionProps {
  answer: STARAnswer;
  userId?: string;
}

export function usePracticeSession({
  answer,
  userId,
}: UsePracticeSessionProps) {
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [timer, setTimer] = useState(0);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackVideoRef = useRef<HTMLVideoElement>(null);
  const recordedBlobRef = useRef<Blob | null>(null);

  // We'll explicitly manage stream request if needed, but react-media-recorder
  // is generally good. However, if it fails to start, we might need to ensure
  // we pass a fresh stream or verify `isCameraEnabled` didn't toggle off.

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    previewStream,
    clearBlobUrl,
    muteAudio,
    unMuteAudio,
    error,
  } = useReactMediaRecorder({
    video: isCameraEnabled,
    audio: isCameraEnabled,
    askPermissionOnMount: false, // Wait for user action (we toggle isCameraEnabled)
    onStop: (blobUrl, blob) => {
      recordedBlobRef.current = blob;
      setRecordedVideoUrl(blobUrl);
    },
  });

  const isRecording = status === "recording";

  const getPresignedUrlMutation = trpc.files.getPresignedUrl.useMutation();
  const saveFileMutation = trpc.files.saveFile.useMutation();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (error) {
      console.error("[react-media-recorder] Error:", error);
      setCameraError(`Recording error: ${error}`);
      if (error === "NO_RECORDER") {
        toast.error("MediaRecorder not supported or failed to initialize.");
      }
    }
  }, [error]);

  // Update videoRef with the previewStream from react-media-recorder
  useEffect(() => {
    if (previewStream && videoRef.current && cameraStarted) {
      if (videoRef.current.srcObject !== previewStream) {
        videoRef.current.srcObject = previewStream;
        videoRef.current.muted = true; // Mute local playback

        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current
              .play()
              .catch((err) => console.error("[v0] Video play error:", err));
          }
        }, 100);
      }
    }
  }, [previewStream, cameraStarted]);

  // Check for camera errors
  useEffect(() => {
    if ((status as string) === "failed") {
      setCameraError(
        "Unable to access camera/microphone. Please grant permissions."
      );
      setHasCamera(false);
    } else if (isCameraEnabled && previewStream) {
      setHasCamera(true);
      setCameraError(null);
    }
  }, [isCameraEnabled, previewStream, status]);

  useEffect(() => {
    if (recordedVideoUrl && playbackVideoRef.current && isPlayingRecording) {
      const videoEl = playbackVideoRef.current;
      videoEl.src = recordedVideoUrl;
      videoEl.load();
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.error("[v0] Playback video play error:", err);
          toast.error("Auto-play failed. Please click play.");
        });
      }
    }
  }, [recordedVideoUrl, isPlayingRecording]);

  useEffect(() => {
    return () => {
      clearBlobUrl();
    };
  }, [clearBlobUrl]);

  const handleStartCamera = async () => {
    setIsCameraEnabled(true);
    setCameraStarted(true);
    setHasCamera(true);
    setCameraError(null);
  };

  const toggleCamera = () => {
    if (previewStream) {
      const videoTrack = previewStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (isMicOn) {
      muteAudio();
      setIsMicOn(false);
    } else {
      unMuteAudio();
      setIsMicOn(true);
    }
  };

  const handleStartRecording = () => {
    console.log("[v0] Starting recording...");
    // It's possible the library needs a moment if the stream was just initialized
    // or if the previous recording stop isn't fully cleaned up.
    // But usually startRecording() handles it.

    // One edge case: if status is 'acquiring_media', calling startRecording might fail silently
    // or if permission isn't fully granted yet.

    startRecording();
    setTimer(0);
  };

  const handleStopRecording = () => {
    console.log("[v0] Stopping recording...");
    stopRecording();
  };

  const handlePlayRecording = () => {
    setIsPlayingRecording(true);
  };

  const handleBackToCamera = () => {
    setIsPlayingRecording(false);
    if (playbackVideoRef.current) {
      playbackVideoRef.current.pause();
      playbackVideoRef.current.currentTime = 0;
    }
    clearBlobUrl();
    setRecordedVideoUrl(null);
  };

  const handleSaveRecording = async () => {
    const blob = recordedBlobRef.current;
    if (!blob && !recordedVideoUrl) {
      toast.error("No recording to save");
      return;
    }
    if (!userId) {
      toast.error("User not authenticated");
      return;
    }

    setIsSaving(true);
    try {
      let finalBlob = blob;
      if (!finalBlob && recordedVideoUrl) {
        const response = await fetch(recordedVideoUrl);
        finalBlob = await response.blob();
      }

      if (!finalBlob) {
        throw new Error("Could not retrieve recording blob");
      }

      const timestamp = Date.now();
      const fileName = `practice-${answer.id}-${timestamp}.webm`;
      const fileType = finalBlob.type || "video/webm";
      const file = new File([finalBlob], fileName, { type: fileType });

      const { uploadURL, s3Key } = await getPresignedUrlMutation.mutateAsync({
        fileName,
        contentType: fileType as any,
      });

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": fileType },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload to S3");
      }

      await saveFileMutation.mutateAsync({
        s3Key,
        fileName,
        fileSize: file.size,
        contentType: fileType,
        userId,
      });

      toast.success("Recording saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save recording");
    } finally {
      setIsSaving(false);
    }
  };

  return {
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
    formatTime: (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    },
  };
}
