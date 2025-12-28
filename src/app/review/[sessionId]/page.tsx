"use client";

import React from "react";
import { HomeLayout } from "@/components/layouts/home-layout";
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc-client";
import { SessionResults } from "@/components/review/session-results";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, PlayIcon, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";

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
    {
      enabled: !!sessionId,
      refetchOnWindowFocus: false,
    }
  );

  const { data: session, isLoading } = sessionQuery;
  const presignedUrlMutation = trpc.files.getPresignedUrl.useMutation();

  useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (session && session.videoUrl && !presignedUrl) {
        try {
          const s3Key = session.videoUrl.split('.amazonaws.com/')[1];
          if (s3Key) {
            const result = await presignedUrlMutation.mutateAsync({ s3Key });
            if (result) {
              setPresignedUrl(result.url);
              console.log('[SessionPage] Generated initial presigned URL');
            }
          }
        } catch (error) {
          console.error('[SessionPage] Failed to generate initial presigned URL:', error);
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
      console.log('[SessionPage] Status changed:', lastStatus, '->', currentStatus);

      if (currentStatus === 'transcribing') {
        toast.info('Transcribing audio...', { duration: 3000 });
      } else if (currentStatus === 'analyzing') {
        toast.info('Analyzing your performance...', { duration: 3000 });
      } else if (currentStatus === 'completed') {
        toast.success('Analysis complete! 🎉', { duration: 5000 });
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          setIsAnalyzing(false);
        }
      } else if (currentStatus === 'failed') {
        toast.error('Analysis failed. Please try again.', { duration: 5000 });
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
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const handleAnalyze = async () => {
    if (!session) return;

    setIsAnalyzing(true);
    lastStatusRef.current = session.analysisStatus;

    try {
      const response = await fetch('/api/reanalyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to trigger analysis');
      }

      const result = await response.json();
      console.log('[SessionPage] Analysis trigger result:', result);

      toast.success('Analysis started!', { description: result.step === 'transcription' ? 'Transcribing audio...' : 'Analyzing performance...', duration: 3000 });

      pollingIntervalRef.current = setInterval(() => {
        console.log('[SessionPage] Polling for updates...');
        sessionQuery.refetch();
      }, 2000);

    } catch (error) {
      console.error('Analyze error:', error);
      toast.error('Failed to start analysis', { duration: 3000 });
      setIsAnalyzing(false);
    }
  };

  const handleManualRefresh = async () => {
    console.log('[SessionPage] Manual refresh');
    sessionQuery.refetch();

    // Extract S3 key from videoUrl and generate presigned URL
    if (session && session.videoUrl) {
      try {
        const s3Key = session.videoUrl.split('.amazonaws.com/')[1];
        if (!s3Key) {
          throw new Error('Could not extract S3 key from videoUrl');
        }

        const result = await presignedUrlMutation.mutateAsync({ s3Key });

        if (result) {
          setPresignedUrl(result.url);
          setVideoError(false);
          console.log('[SessionPage] Generated presigned URL');
        }
      } catch (error) {
        console.error('[SessionPage] Failed to generate presigned URL:', error);
        toast.error('Failed to refresh video URL');
      }
    }
  };

  const handleReset = async () => {
    if (!session) return;

    if (!confirm('Reset this session? This will clear the current status and allow you to start fresh.')) {
      return;
    }

    try {
      const response = await fetch('/api/reanalyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, reset: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to reset session');
      }

      toast.success('Session reset! Click "Run Analysis" to start fresh.');
      sessionQuery.refetch();
    } catch (error) {
      console.error('Reset error:', error);
      toast.error('Failed to reset session');
    }
  };

  if (isLoading) {
    return (
      <HomeLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
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

  if (session.analysisStatus === 'completed' && session.feedback) {
    return (
      <HomeLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4">
            <Link href="/review">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sessions
              </Button>
            </Link>
            <Button onClick={handleManualRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          <SessionResults session={session} />
        </div>
      </HomeLayout>
    );
  }

  if (session.analysisStatus === 'failed') {
    return (
      <HomeLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/review">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sessions
              </Button>
            </Link>
          </div>
          <Card className="p-8 text-center border-destructive bg-destructive/5">
            <Heading as="h2" className="text-xl mb-2">Analysis Failed</Heading>
            <Text variant="muted" className="mb-4">
              There was an error analyzing your recording. You can try again.
            </Text>
            <Button onClick={handleAnalyze} disabled={isAnalyzing}>
              <PlayIcon className="w-4 h-4 mr-2" />
              Run Analysis Again
            </Button>
          </Card>
        </div>
      </HomeLayout>
    );
  }

  const isProcessing = session.analysisStatus === 'transcribing' || session.analysisStatus === 'analyzing';

  return (
    <HomeLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/review">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sessions
            </Button>
          </Link>
          <Button onClick={handleManualRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {isProcessing ? (
          <>
            <Card className="p-8 text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <Heading as="h2" className="text-xl mb-2">
                {session.analysisStatus === 'transcribing' && 'Transcribing Audio'}
                {session.analysisStatus === 'analyzing' && 'Analyzing Performance'}
              </Heading>
              <Text variant="muted" className="mb-4">
                {session.analysisStatus === 'transcribing' && 'AI is transcribing your audio. This usually takes 30-60 seconds.'}
                {session.analysisStatus === 'analyzing' && 'AI is analyzing your performance against STAR script. This usually takes 1-2 minutes.'}
              </Text>

              {session.transcript && (
                <Card className="mt-6 p-4 bg-muted/50 text-left">
                  <Text variant="muted" className="text-xs uppercase tracking-wide mb-2 block">
                    Transcript
                  </Text>
                  <Text variant="muted" className="whitespace-pre-wrap">
                    {session.transcript}
                  </Text>
                </Card>
              )}

              <Button onClick={handleReset} variant="destructive" size="sm" className="mt-4">
                Reset & Start Over
              </Button>
            </Card>

            {session.videoUrl && (
              <Card className="overflow-hidden">
                <div className="p-4 border-b border-border">
                  <Heading as="h3" className="text-lg">Your Recording</Heading>
                  <Text variant="muted" className="text-sm">
                    {session.answer.competency} • {new Date(session.recordedAt).toLocaleDateString()}
                  </Text>
                </div>
                <div className="relative bg-black">
                  <video
                    src={presignedUrl || session.videoUrl}
                    controls
                    preload="metadata"
                    className="w-full"
                    style={{ maxHeight: "400px" }}
                    onError={() => setVideoError(true)}
                    onLoadStart={() => setVideoError(false)}
                  />
                  {videoError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-4">
                      <div className="text-center">
                        <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                        <Heading as="h3" className="text-lg mb-2">Video Unavailable</Heading>
                        <Text variant="muted" className="mb-4">
                          Could not load video. Please try clicking "Refresh" button in the header.
                        </Text>
                        <Text variant="small" className="font-mono bg-white/10 p-2 rounded block">
                          {session.videoUrl}
                        </Text>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </>
        ) : (
          <>
            {session.videoUrl && (
              <Card className="overflow-hidden">
                <div className="p-4 border-b border-border">
                  <Heading as="h3" className="text-lg">Your Recording</Heading>
                  <Text variant="muted" className="text-sm">
                    {session.answer.competency} • {new Date(session.recordedAt).toLocaleDateString()}
                  </Text>
                </div>
                <div className="relative bg-black">
                  <video
                    src={presignedUrl || session.videoUrl}
                    controls
                    preload="metadata"
                    className="w-full"
                    style={{ maxHeight: "400px" }}
                    onError={() => setVideoError(true)}
                    onLoadStart={() => setVideoError(false)}
                  />
                  {videoError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-4">
                      <div className="text-center">
                        <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                        <Heading as="h3" className="text-lg mb-2">Video Unavailable</Heading>
                        <Text variant="muted" className="mb-4">
                          Could not load video. Please try clicking "Refresh" button in the header.
                        </Text>
                        <Text variant="small" className="font-mono bg-white/10 p-2 rounded block">
                          {session.videoUrl}
                        </Text>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <Card className="p-8 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <PlayIcon className="w-6 h-6 text-primary" />
              </div>
              <Heading as="h2" className="text-xl mb-2">Ready to Analyze</Heading>
              <Text variant="muted" className="mb-2">
                This recording has not been analyzed yet.
              </Text>
              <Text variant="muted" className="text-sm mb-4">
                AI will transcribe your audio and analyze your performance against STAR script.
              </Text>
              <Button onClick={handleAnalyze} size="lg" disabled={isAnalyzing}>
                <PlayIcon className="w-4 h-4 mr-2" />
                {isAnalyzing ? 'Starting...' : 'Run Analysis'}
              </Button>
            </Card>
          </>
        )}
      </div>
    </HomeLayout>
  );
}
