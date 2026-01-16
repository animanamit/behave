"use client";

import React from "react";
import { HomeLayout } from "@/components/layouts/home-layout";
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { ArrowLeft, Loader2, PlayIcon, RefreshCw, AlertCircle, CheckCircle2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = React.use(params);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatusRef = useRef<string | null>(null);

  const sessionQuery = trpc.practiceSessions.getPracticeSession.useQuery(
    { sessionId },
    { enabled: !!sessionId, refetchOnWindowFocus: false }
  );

  const { data: session, isLoading } = sessionQuery;
  const presignedUrlMutation = trpc.files.getPresignedUrl.useMutation();

  useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (session && session.videoUrl && !presignedUrl) {
        try {
          const s3Key = session.videoUrl.split(".amazonaws.com/")[1];
          if (s3Key) {
            const result = await presignedUrlMutation.mutateAsync({ s3Key });
            if (result) setPresignedUrl(result.url);
          }
        } catch (error) {
          console.error("Failed to generate presigned URL:", error);
        }
      }
    };
    fetchPresignedUrl();
  }, [session, presignedUrl]);

  useEffect(() => {
    if (!session) return;
    const currentStatus = session.analysisStatus;
    const lastStatus = lastStatusRef.current;

    if (lastStatus && currentStatus !== lastStatus) {
      if (currentStatus === "transcribing") {
        toast.info("Transcribing audio...", { duration: 3000 });
      } else if (currentStatus === "analyzing") {
        toast.info("Analyzing your performance...", { duration: 3000 });
      } else if (currentStatus === "completed") {
        toast.success("Analysis complete!", { duration: 5000 });
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          setIsAnalyzing(false);
        }
      } else if (currentStatus === "failed") {
        toast.error("Analysis failed. Please try again.", { duration: 5000 });
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          setIsAnalyzing(false);
        }
      }
      lastStatusRef.current = currentStatus;
    } else if (!lastStatus) {
      lastStatusRef.current = currentStatus;
    }
  }, [session]);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  const handleAnalyze = async () => {
    if (!session) return;
    setIsAnalyzing(true);
    lastStatusRef.current = session.analysisStatus;

    try {
      const response = await fetch("/api/reanalyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) throw new Error("Failed to trigger analysis");

      const result = await response.json();
      toast.success("Analysis started!", { duration: 3000 });

      pollingIntervalRef.current = setInterval(() => {
        sessionQuery.refetch();
      }, 2000);
    } catch (error) {
      toast.error("Failed to start analysis");
      setIsAnalyzing(false);
    }
  };

  const handleManualRefresh = async () => {
    sessionQuery.refetch();
    if (session && session.videoUrl) {
      try {
        const s3Key = session.videoUrl.split(".amazonaws.com/")[1];
        if (s3Key) {
          const result = await presignedUrlMutation.mutateAsync({ s3Key });
          if (result) {
            setPresignedUrl(result.url);
            setVideoError(false);
          }
        }
      } catch (error) {
        toast.error("Failed to refresh video URL");
      }
    }
  };

  if (isLoading) {
    return (
      <HomeLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </HomeLayout>
    );
  }

  if (!session) {
    return (
      <HomeLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Session not found</p>
          <Link href="/review">
            <Button className="mt-4">Back to Sessions</Button>
          </Link>
        </div>
      </HomeLayout>
    );
  }

  const isProcessing = session.analysisStatus === "transcribing" || session.analysisStatus === "analyzing";

  // Completed session with feedback
  if (session.analysisStatus === "completed" && session.feedback) {
    const score = session.feedback.contentFidelityScore;

    return (
      <HomeLayout>
        <div className="page-transition max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link href="/review">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Sessions
              </Button>
            </Link>
            <Button onClick={handleManualRefresh} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{session.answer.competency}</h1>
            <p className="text-muted-foreground">
              Recorded {formatDistanceToNow(new Date(session.recordedAt), { addSuffix: true })}
            </p>
          </div>

          {/* Main content grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Video + Question */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Player */}
              <Card className="overflow-hidden">
                <div className="relative bg-foreground/95 aspect-video">
                  <video
                    src={presignedUrl || session.videoUrl}
                    controls
                    preload="metadata"
                    className="w-full h-full"
                    onError={() => setVideoError(true)}
                    onLoadStart={() => setVideoError(false)}
                  />
                  {videoError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-white p-4">
                      <div className="text-center space-y-2">
                        <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground" />
                        <p className="text-sm">Video unavailable. Try refreshing.</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Question */}
              <Card className="p-5">
                <p className="text-sm font-medium text-muted-foreground mb-2">Question</p>
                <p className="text-foreground italic">&ldquo;{session.answer.question}&rdquo;</p>
              </Card>

              {/* Feedback Details */}
              <Card className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-muted-foreground" />
                  <h3 className="font-semibold">AI Feedback</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">{session.feedback.suggestions}</p>

                {session.feedback.wentOffScript && session.feedback.offScriptImprovement && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Off-Script Improvements</p>
                    <p className="text-sm text-foreground">{session.feedback.offScriptImprovement}</p>
                  </div>
                )}
              </Card>

              {/* Transcript Comparison */}
              {session.transcript && (
                <Card className="p-5 space-y-4">
                  <h3 className="font-semibold">What You Said</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {session.transcript}
                  </p>
                </Card>
              )}
            </div>

            {/* Right: Score + Stats */}
            <div className="space-y-6">
              {/* Score Card */}
              <Card className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <ScoreRing score={score} size="lg" />
                </div>
                <p className="text-sm text-muted-foreground">Content Fidelity Score</p>
              </Card>

              {/* Stats */}
              <Card className="p-5 space-y-4">
                <h3 className="font-semibold">Performance</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pacing</span>
                    <Badge
                      variant={
                        session.feedback.pacing === "Good"
                          ? "success"
                          : session.feedback.pacing === "Too Fast"
                          ? "warning"
                          : "info"
                      }
                    >
                      {session.feedback.pacing}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Confidence</span>
                    <Badge
                      variant={
                        session.feedback.confidence === "High"
                          ? "success"
                          : session.feedback.confidence === "Medium"
                          ? "info"
                          : "warning"
                      }
                    >
                      {session.feedback.confidence}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">On Script</span>
                    <Badge variant={session.feedback.wentOffScript ? "warning" : "success"}>
                      {session.feedback.wentOffScript ? "Went Off Script" : "Stayed On Script"}
                    </Badge>
                  </div>

                  {session.feedback.wordsMatched !== null && session.feedback.totalWords !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Word Match</span>
                      <span className="text-sm font-medium">
                        {session.feedback.wordsMatched} / {session.feedback.totalWords}
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Action */}
              <Link href={`/practice?id=${session.answer.id}`}>
                <Button className="w-full gap-2">
                  <PlayIcon className="w-4 h-4" />
                  Practice Again
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </HomeLayout>
    );
  }

  // Failed state
  if (session.analysisStatus === "failed") {
    return (
      <HomeLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Link href="/review">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Sessions
            </Button>
          </Link>

          <Card className="p-8 text-center border-destructive/30 bg-destructive/5">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Analysis Failed</h2>
            <p className="text-muted-foreground mb-6">
              There was an error analyzing your recording. You can try again.
            </p>
            <Button onClick={handleAnalyze} disabled={isAnalyzing}>
              <PlayIcon className="w-4 h-4 mr-2" />
              Run Analysis Again
            </Button>
          </Card>
        </div>
      </HomeLayout>
    );
  }

  // Processing or pending state
  return (
    <HomeLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/review">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Sessions
            </Button>
          </Link>
          <Button onClick={handleManualRefresh} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {isProcessing ? (
          <Card className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-accent" />
            <h2 className="text-xl font-semibold mb-2">
              {session.analysisStatus === "transcribing" && "Transcribing Audio"}
              {session.analysisStatus === "analyzing" && "Analyzing Performance"}
            </h2>
            <p className="text-muted-foreground">
              {session.analysisStatus === "transcribing" && "AI is transcribing your audio..."}
              {session.analysisStatus === "analyzing" && "AI is analyzing your performance..."}
            </p>
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <PlayIcon className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Ready to Analyze</h2>
            <p className="text-muted-foreground mb-6">
              This recording has not been analyzed yet. AI will transcribe and analyze your
              performance.
            </p>
            <Button onClick={handleAnalyze} size="lg" disabled={isAnalyzing}>
              <PlayIcon className="w-4 h-4 mr-2" />
              {isAnalyzing ? "Starting..." : "Run Analysis"}
            </Button>
          </Card>
        )}

        {/* Video preview */}
        {session.videoUrl && (
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">{session.answer.competency}</h3>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(session.recordedAt), { addSuffix: true })}
              </p>
            </div>
            <div className="relative bg-foreground/95 aspect-video">
              <video
                src={presignedUrl || session.videoUrl}
                controls
                preload="metadata"
                className="w-full h-full"
                onError={() => setVideoError(true)}
                onLoadStart={() => setVideoError(false)}
              />
              {videoError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-white p-4">
                  <div className="text-center space-y-2">
                    <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground" />
                    <p className="text-sm">Video unavailable. Try refreshing.</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Transcript preview if available */}
        {session.transcript && (
          <Card className="p-5">
            <p className="text-sm font-medium text-muted-foreground mb-2">Transcript</p>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{session.transcript}</p>
          </Card>
        )}
      </div>
    </HomeLayout>
  );
}
