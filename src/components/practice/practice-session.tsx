"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import {
  Circle,
  Square,
  VideoOff,
  Video,
  Mic,
  MicOff,
  Play,
  ArrowLeft,
} from "lucide-react";
import { STARAnswer } from "@/lib/zod-schemas";
import { Teleprompter } from "./teleprompter";

interface PracticeSessionProps {
  answer: STARAnswer;
  onBack: () => void;
}

export function PracticeSession({ answer, onBack }: PracticeSessionProps) {
  const [isRecording, setIsRecording] = useState(false);
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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
    if (streamRef.current && videoRef.current && cameraStarted) {
      videoRef.current.srcObject = streamRef.current;

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current
            .play()
            .catch((err) => console.error("[v0] Video play error:", err));
        }
      }, 100);
    }
  }, [hasCamera, cameraStarted]);

  useEffect(() => {
    if (recordedVideoUrl && playbackVideoRef.current && isPlayingRecording) {
      playbackVideoRef.current.src = recordedVideoUrl;
      playbackVideoRef.current.load();

      playbackVideoRef.current.play().catch((err) => {
        console.error("[v0] Playback video play error:", err);
      });
    }
  }, [recordedVideoUrl, isPlayingRecording]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, [recordedVideoUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current
          .play()
          .catch((err) => console.error("[v0] Video play error:", err));
      }

      setCameraStarted(true);
      setHasCamera(true);
      setCameraError(null);
    } catch (error) {
      console.error("[v0] Camera access error:", error);
      setCameraError(
        "Unable to access camera/microphone. Please grant permissions."
      );
      setHasCamera(false);
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const handleStartRecording = () => {
    if (!streamRef.current) {
      console.error("[v0] No stream available");
      return;
    }

    try {
      let mimeType = "video/webm;codecs=vp8,opus";

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm;codecs=vp9,opus";
      }

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm";
      }

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: mimeType,
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);

      setIsRecording(true);
      setTimer(0);
    } catch (error) {
      console.error("[v0] Recording start error:", error);
    }
  };

  const handleStopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
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
  };

  return (
    <div className="space-y-2 h-[calc(100vh-4rem)] flex flex-col p-2">
      <div className="flex justify-between items-center shrink-0 pb-2">
        <div className="space-y-1">
          <Heading as="h2" className="text-xl">Practice Session</Heading>
          <Text variant="muted" className="text-xs">Record your answer while following the script</Text>
        </div>
        <Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Back to Selection
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Video Area - Main Focus */}
        <div className="flex flex-col gap-4 h-full">
          <div className="relative flex-1 bg-black rounded-lg border border-border overflow-hidden shadow-sm">
            {!cameraStarted ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/10">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <Video className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Button onClick={handleStartCamera} size="lg">
                      Start Camera
                    </Button>
                    <Text variant="muted" className="block">
                      Enable camera and microphone to begin
                    </Text>
                  </div>
                </div>
              </div>
            ) : isPlayingRecording && recordedVideoUrl ? (
              <>
                <video
                  ref={playbackVideoRef}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                  onEnded={() => setIsPlayingRecording(false)}
                />
                <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium font-mono uppercase tracking-wider">
                  Playback
                </div>
              </>
            ) : hasCamera ? (
              <>
                <video
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

            {/* Overlays */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-1 text-xs font-medium font-mono uppercase tracking-wider animate-pulse">
                <div className="w-2 h-2 bg-current rounded-full" />
                Recording
              </div>
            )}

            {cameraStarted && !isPlayingRecording && (
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 font-mono text-sm">
                {formatTime(timer)}
              </div>
            )}

            {/* Controls Overlay */}
            {cameraStarted && !isPlayingRecording && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 backdrop-blur-sm p-2 rounded-full border border-white/10">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleCamera}
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
                  onClick={toggleMic}
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

          {/* Action Bar */}
          <div className="h-20 border border-border bg-card rounded-lg flex items-center justify-center gap-4 shrink-0 shadow-sm">
            {!cameraStarted ? (
              <Text variant="muted">Camera not started</Text>
            ) : isPlayingRecording ? (
              <Button
                onClick={handleBackToCamera}
                variant="outline"
                className="gap-2"
              >
                <Video className="w-4 h-4" />
                Back to Camera
              </Button>
            ) : recordedVideoUrl && !isRecording ? (
              <>
                <Button
                  onClick={handlePlayRecording}
                  variant="outline"
                  className="gap-2"
                >
                  <Play className="w-4 h-4" />
                  Review Recording
                </Button>
                <Button onClick={handleStartRecording} className="gap-2">
                  <Circle className="w-4 h-4 fill-current" />
                  Record New Take
                </Button>
              </>
            ) : !isRecording ? (
              <Button
                size="lg"
                onClick={handleStartRecording}
                className="rounded-full w-14 h-14 p-0 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                <div className="w-6 h-6 bg-current rounded-sm" />
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleStopRecording}
                variant="outline"
                className="rounded-full w-14 h-14 p-0 border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Square className="w-5 h-5 fill-current" />
              </Button>
            )}
          </div>
        </div>

        {/* Script / Teleprompter Area */}
        <div className="h-full overflow-hidden">
          <Teleprompter answer={answer} className="h-full" />
        </div>
      </div>
    </div>
  );
}
