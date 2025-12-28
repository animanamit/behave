"use client";

import { HomeLayout } from "@/components/layouts/home-layout";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { SessionResults } from "@/components/review/session-results";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function SessionDetailPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const [pollingCount, setPollingCount] = useState(0);
  const MAX_POLL_COUNT = 150;

  const sessionQuery = trpc.practiceSessions.getPracticeSession.useQuery(
    { sessionId: params.sessionId },
    {
      refetchInterval: (data) => {
        if (!data || !('analysisStatus' in data)) return false;
        const status = data.analysisStatus;
        if (
          status === "completed" ||
          status === "failed"
        ) {
          return false;
        }
        if (pollingCount >= MAX_POLL_COUNT) {
          return false;
        }
        return 2000;
      },
    }
  );

  const handleRetry = () => {
    setPollingCount(0);
    sessionQuery.refetch();
  };

  useEffect(() => {
    if (sessionQuery.data) {
      setPollingCount((prev) => prev + 1);
    }
  }, [sessionQuery.data]);

  if (sessionQuery.isLoading) {
    return (
      <HomeLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </HomeLayout>
    );
  }

  if (!sessionQuery.data) {
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

  const session = sessionQuery.data;
  const isTimeout = pollingCount >= MAX_POLL_COUNT;
  const isLoading =
    session.analysisStatus !== "completed" &&
    session.analysisStatus !== "failed" &&
    !isTimeout;

  return (
    <HomeLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/review">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        {isLoading && (
          <div className="text-center py-16 border border-dashed border-border rounded-xl bg-muted/5">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium mb-2">
              {session.analysisStatus === "pending" && "Uploading video..."}
              {session.analysisStatus === "transcribing" &&
                "Transcribing audio (AI working)..."}
              {session.analysisStatus === "analyzing" &&
                "Analyzing your performance..."}
            </p>
            <p className="text-muted-foreground text-sm">
              This usually takes 1-3 minutes
            </p>
          </div>
        )}

        {isTimeout && (
          <div className="text-center py-16 border border-dashed border-border rounded-xl bg-muted/5">
            <p className="text-lg font-medium mb-2">
              Analysis is taking longer than expected
            </p>
            <p className="text-muted-foreground mb-4">
              Click below to try again
            </p>
            <Button onClick={handleRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {session.analysisStatus === "failed" && (
          <div className="text-center py-16 border border-dashed border-destructive rounded-xl bg-destructive/5">
            <p className="text-lg font-medium mb-2">
              Analysis failed. Please try recording again.
            </p>
            <Button onClick={handleRetry} variant="destructive">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {session.analysisStatus === "completed" && (
          <SessionResults session={session} />
        )}
      </div>
    </HomeLayout>
  );
}
