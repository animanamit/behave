"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading, Text, Caption } from "@/components/ui/typography";
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
import Link from "next/link";
import { HomeLayout } from "@/components/layouts/home-layout";

export default function PracticePage() {
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
      console.log("[v0] Setting up playback video with URL:", recordedVideoUrl);
      playbackVideoRef.current.src = recordedVideoUrl;
      playbackVideoRef.current.load();

      playbackVideoRef.current.onloadedmetadata = () => {
        console.log(
          "[v0] Playback video metadata loaded, duration:",
          playbackVideoRef.current?.duration
        );
      };

      playbackVideoRef.current.onerror = (e) => {
        console.error("[v0] Playback video error:", e);
      };

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
      console.log("[v0] Camera started manually");
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
        console.log("[v0] vp8 not supported, trying vp9");
        mimeType = "video/webm;codecs=vp9,opus";
      }

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.log("[v0] vp9 not supported, using default");
        mimeType = "video/webm";
      }

      console.log("[v0] Using mimeType:", mimeType);

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: mimeType,
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log("[v0] Data chunk received, size:", event.data.size);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        console.log(
          "[v0] Recording complete. Blob size:",
          blob.size,
          "bytes, type:",
          blob.type
        );
        console.log("[v0] Created URL:", url);
        setRecordedVideoUrl(url);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);

      setIsRecording(true);
      setTimer(0);
      console.log("[v0] Recording started");
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
      console.log("[v0] Recording stopped");
    }
    setIsRecording(false);
  };

  const handlePlayRecording = () => {
    console.log("[v0] Play recording clicked, URL:", recordedVideoUrl);
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
    <HomeLayout>
      <div className="max-w-5xl mx-auto space-y-6 h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex justify-between items-center border-b border-border pb-4 shrink-0">
          <div className="space-y-1">
            <Heading as="h2">Practice Session</Heading>
            <Text variant="muted">
              Record your answer while following the script
            </Text>
          </div>
          <Link href="/home">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Video Area - Main Focus */}
          <div className="lg:col-span-2 flex flex-col gap-4 h-full">
            <div className="relative flex-1 bg-black rounded-none border border-border overflow-hidden">
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
            <div className="h-20 border border-border bg-card flex items-center justify-center gap-4 shrink-0">
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

          {/* Script / Question Area */}
          <div className="lg:col-span-1 h-full flex flex-col bg-card border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <Caption className="mb-2 block">Current Question</Caption>
              <Heading as="h4" className="leading-snug">
                Tell me about a time you handled conflict with a teammate.
              </Heading>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div className="space-y-2">
                <Caption>STAR Method Script</Caption>
                <div className="space-y-4 text-sm leading-relaxed">
                  <div>
                    <span className="font-medium text-primary block mb-1">
                      Situation
                    </span>
                    <Text variant="muted">
                      In my previous role as a senior developer, I was working
                      on a critical feature launch with a tight deadline. My
                      teammate and I had different approaches to implementing
                      the authentication system.
                    </Text>
                  </div>

                  <div>
                    <span className="font-medium text-primary block mb-1">
                      Task
                    </span>
                    <Text variant="muted">
                      I needed to resolve this disagreement quickly while
                      maintaining team cohesion and ensuring we delivered a
                      secure, high-quality solution on time.
                    </Text>
                  </div>

                  <div>
                    <span className="font-medium text-primary block mb-1">
                      Action
                    </span>
                    <Text variant="muted">
                      I scheduled a one-on-one meeting to understand their
                      perspective fully. I listened actively and realized their
                      approach had merit for scalability. We created a
                      comparison document outlining pros and cons of each
                      approach, then presented it to our tech lead for input.
                      Together, we agreed on a hybrid solution that combined the
                      best aspects of both approaches.
                    </Text>
                  </div>

                  <div>
                    <span className="font-medium text-primary block mb-1">
                      Result
                    </span>
                    <Text variant="muted">
                      We delivered the feature two days ahead of schedule. The
                      authentication system handled 50,000 users in the first
                      month with zero security incidents. More importantly, my
                      relationship with my teammate strengthened, and we
                      established a collaborative problem-solving pattern that
                      benefited future projects.
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
