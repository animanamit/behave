"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Circle, Square, ArrowLeft, VideoOff, Video, Mic, MicOff, Play } from "lucide-react"
import Link from "next/link"

export default function PracticePage() {
  const [isRecording, setIsRecording] = useState(false)
  const [timer, setTimer] = useState(0)
  const [cameraStarted, setCameraStarted] = useState(false)
  const [hasCamera, setHasCamera] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isMicOn, setIsMicOn] = useState(true)
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null)
  const [isPlayingRecording, setIsPlayingRecording] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const playbackVideoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  useEffect(() => {
    if (streamRef.current && videoRef.current && cameraStarted) {
      videoRef.current.srcObject = streamRef.current

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch((err) => console.error("[v0] Video play error:", err))
        }
      }, 100)
    }
  }, [hasCamera, cameraStarted])

  useEffect(() => {
    if (recordedVideoUrl && playbackVideoRef.current && isPlayingRecording) {
      console.log("[v0] Setting up playback video with URL:", recordedVideoUrl)
      playbackVideoRef.current.src = recordedVideoUrl
      playbackVideoRef.current.load()

      playbackVideoRef.current.onloadedmetadata = () => {
        console.log("[v0] Playback video metadata loaded, duration:", playbackVideoRef.current?.duration)
      }

      playbackVideoRef.current.onerror = (e) => {
        console.error("[v0] Playback video error:", e)
      }

      playbackVideoRef.current.play().catch((err) => {
        console.error("[v0] Playback video play error:", err)
      })
    }
  }, [recordedVideoUrl, isPlayingRecording])

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl)
      }
    }
  }, [recordedVideoUrl])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch((err) => console.error("[v0] Video play error:", err))
      }

      setCameraStarted(true)
      setHasCamera(true)
      setCameraError(null)
      console.log("[v0] Camera started manually")
    } catch (error) {
      console.error("[v0] Camera access error:", error)
      setCameraError("Unable to access camera/microphone. Please grant permissions.")
      setHasCamera(false)
    }
  }

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsCameraOn(videoTrack.enabled)
      }
    }
  }

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMicOn(audioTrack.enabled)
      }
    }
  }

  const handleStartRecording = () => {
    if (!streamRef.current) {
      console.error("[v0] No stream available")
      return
    }

    try {
      let mimeType = "video/webm;codecs=vp8,opus"

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.log("[v0] vp8 not supported, trying vp9")
        mimeType = "video/webm;codecs=vp9,opus"
      }

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.log("[v0] vp9 not supported, using default")
        mimeType = "video/webm"
      }

      console.log("[v0] Using mimeType:", mimeType)

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: mimeType,
      })

      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
          console.log("[v0] Data chunk received, size:", event.data.size)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        console.log("[v0] Recording complete. Blob size:", blob.size, "bytes, type:", blob.type)
        console.log("[v0] Created URL:", url)
        setRecordedVideoUrl(url)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(1000)

      setIsRecording(true)
      setTimer(0)
      console.log("[v0] Recording started")
    } catch (error) {
      console.error("[v0] Recording start error:", error)
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
      console.log("[v0] Recording stopped")
    }
    setIsRecording(false)
  }

  const handlePlayRecording = () => {
    console.log("[v0] Play recording clicked, URL:", recordedVideoUrl)
    setIsPlayingRecording(true)
  }

  const handleBackToCamera = () => {
    setIsPlayingRecording(false)
    if (playbackVideoRef.current) {
      playbackVideoRef.current.pause()
      playbackVideoRef.current.currentTime = 0
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-foreground">Practice Session</h1>
            <p className="text-sm text-muted-foreground mt-1">Record your answer while following the script</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          <div className="lg:col-span-2">
            <Card className="shadow-lg h-full">
              <CardContent className="p-6">
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-6">
                  {!cameraStarted ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-24 h-24 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto mb-4">
                          <Video className="w-12 h-12 text-teal-500" />
                        </div>
                        <Button onClick={handleStartCamera} size="lg" className="bg-teal-600 hover:bg-teal-700">
                          <Video className="w-4 h-4 mr-2" />
                          Start Camera
                        </Button>
                        <p className="text-muted-foreground text-sm mt-3">Click to enable camera and microphone</p>
                      </div>
                    </div>
                  ) : isPlayingRecording && recordedVideoUrl ? (
                    <>
                      <video
                        ref={playbackVideoRef}
                        controls
                        autoPlay
                        playsInline
                        className="w-full h-full bg-black object-contain"
                        onEnded={() => {
                          console.log("[v0] Playback ended")
                          setIsPlayingRecording(false)
                        }}
                      />
                      <div className="absolute top-4 left-4 bg-teal-500/90 text-white px-3 py-1.5 rounded-full">
                        <span className="text-sm font-medium">Playback</span>
                      </div>
                    </>
                  ) : hasCamera ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full bg-black" />
                      {!isCameraOn && (
                        <div className="absolute inset-0 bg-black flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                              <VideoOff className="w-12 h-12 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">Camera is off</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                          <VideoOff className="w-12 h-12 text-red-500" />
                        </div>
                        <p className="text-muted-foreground max-w-xs">{cameraError || "Camera access denied"}</p>
                      </div>
                    </div>
                  )}

                  {isRecording && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/90 text-white px-3 py-1.5 rounded-full">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Recording</span>
                    </div>
                  )}
                  {cameraStarted && !isPlayingRecording && (
                    <div className="absolute top-4 right-4 bg-background/90 text-foreground px-4 py-2 rounded-lg font-mono text-lg font-semibold">
                      {formatTime(timer)}
                    </div>
                  )}

                  {cameraStarted && !isPlayingRecording && (
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={isCameraOn ? "secondary" : "destructive"}
                        onClick={toggleCamera}
                        disabled={!hasCamera}
                        className="rounded-full w-10 h-10 p-0"
                      >
                        {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant={isMicOn ? "secondary" : "destructive"}
                        onClick={toggleMic}
                        disabled={!hasCamera}
                        className="rounded-full w-10 h-10 p-0"
                      >
                        {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-4">
                  {!cameraStarted ? (
                    <p className="text-center text-sm text-muted-foreground">Start your camera to begin</p>
                  ) : isPlayingRecording ? (
                    <Button onClick={handleBackToCamera} variant="outline" size="lg">
                      <Video className="w-4 h-4 mr-2" />
                      Back to Camera
                    </Button>
                  ) : recordedVideoUrl && !isRecording ? (
                    <div className="flex items-center gap-3">
                      <Button onClick={handlePlayRecording} variant="outline" size="lg">
                        <Play className="w-4 h-4 mr-2" />
                        Watch Recording
                      </Button>
                      <Button
                        size="lg"
                        onClick={handleStartRecording}
                        disabled={!hasCamera}
                        className="bg-teal-600 hover:bg-teal-700 text-white rounded-full w-16 h-16 p-0 disabled:opacity-50"
                      >
                        <Circle className="w-8 h-8 fill-current" />
                      </Button>
                    </div>
                  ) : !isRecording ? (
                    <Button
                      size="lg"
                      onClick={handleStartRecording}
                      disabled={!hasCamera}
                      className="bg-teal-600 hover:bg-teal-700 text-white rounded-full w-16 h-16 p-0 disabled:opacity-50"
                    >
                      <Circle className="w-8 h-8 fill-current" />
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={handleStopRecording}
                      variant="destructive"
                      className="rounded-full w-16 h-16 p-0"
                    >
                      <Square className="w-6 h-6 fill-current" />
                    </Button>
                  )}
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  {!cameraStarted
                    ? "Enable your camera to start practicing"
                    : isPlayingRecording
                      ? "Watching your recorded answer"
                      : recordedVideoUrl && !isRecording
                        ? "Watch your recording or record a new answer"
                        : !isRecording
                          ? "Click to start recording"
                          : "Click to stop recording"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="shadow-lg sticky top-6">
              <CardHeader className="bg-teal-500/10 border-b border-teal-500/20">
                <CardTitle className="text-lg text-foreground">Interview Question</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="text-base font-semibold text-foreground mb-2 leading-relaxed">
                    Tell me about a time you handled conflict with a teammate.
                  </h3>
                </div>

                <div className="border border-border rounded-lg p-4 bg-muted/30 max-h-[500px] overflow-y-auto">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3 font-semibold">
                    Your Script
                  </p>
                  <div className="space-y-4 text-sm leading-relaxed text-foreground">
                    <p>
                      <span className="font-semibold text-teal-400">Situation:</span> In my previous role as a senior
                      developer, I was working on a critical feature launch with a tight deadline. My teammate and I had
                      different approaches to implementing the authentication system.
                    </p>
                    <p>
                      <span className="font-semibold text-teal-400">Task:</span> I needed to resolve this disagreement
                      quickly while maintaining team cohesion and ensuring we delivered a secure, high-quality solution
                      on time.
                    </p>
                    <p>
                      <span className="font-semibold text-teal-400">Action:</span> I scheduled a one-on-one meeting to
                      understand their perspective fully. I listened actively and realized their approach had merit for
                      scalability. We created a comparison document outlining pros and cons of each approach, then
                      presented it to our tech lead for input. Together, we agreed on a hybrid solution that combined
                      the best aspects of both approaches.
                    </p>
                    <p>
                      <span className="font-semibold text-teal-400">Result:</span> We delivered the feature two days
                      ahead of schedule. The authentication system handled 50,000 users in the first month with zero
                      security incidents. More importantly, my relationship with my teammate strengthened, and we
                      established a collaborative problem-solving pattern that benefited future projects.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
