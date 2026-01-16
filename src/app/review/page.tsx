"use client";

import { HomeLayout } from "@/components/layouts/home-layout";
import { Card, CardInteractive } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreText, ScoreRing } from "@/components/ui/score-ring";
import { trpc } from "@/lib/trpc-client";
import { authClient } from "@/lib/auth-client";
import { Loader2, ChevronRight, Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function ReviewPage() {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;

  const sessionsQuery = trpc.practiceSessions.getUserPracticeSessions.useQuery(
    { userId: userId ?? "" },
    { enabled: !!userId }
  );

  if (sessionsQuery.isLoading) {
    return (
      <HomeLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </HomeLayout>
    );
  }

  const sessions = sessionsQuery.data || [];

  // Calculate stats
  const completedSessions = sessions.filter((s) => s.analysisStatus === "completed");
  const avgScore =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce(
            (sum, s) => sum + (s.feedback?.contentFidelityScore || 0),
            0
          ) / completedSessions.length
        )
      : 0;

  return (
    <HomeLayout>
      <div className="page-transition max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Practice Sessions</h1>
          <p className="text-muted-foreground mt-1">
            Review your recordings and AI feedback
          </p>
        </div>

        {/* Stats Overview */}
        {completedSessions.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center stagger-item stagger-1">
              <p className="text-3xl font-semibold tabular-nums">{sessions.length}</p>
              <p className="text-sm text-muted-foreground">Total Sessions</p>
            </Card>
            <Card className="p-4 text-center stagger-item stagger-2">
              <p className="text-3xl font-semibold tabular-nums">{completedSessions.length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </Card>
            <Card className="p-4 text-center stagger-item stagger-3">
              <div className="flex justify-center">
                <ScoreRing score={avgScore} size="sm" />
              </div>
              <p className="text-sm text-muted-foreground mt-1">Avg Score</p>
            </Card>
          </div>
        )}

        {/* Sessions List */}
        {sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session, idx) => (
              <Link key={session.id} href={`/review/${session.id}`}>
                <CardInteractive
                  className={`p-5 flex items-center justify-between stagger-item stagger-${Math.min(idx + 4, 8)}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{session.answer.competency}</span>
                      {session.analysisStatus === "completed" && session.feedback && (
                        <Badge
                          variant={
                            session.feedback.contentFidelityScore >= 80
                              ? "success"
                              : session.feedback.contentFidelityScore >= 60
                              ? "info"
                              : "warning"
                          }
                          size="sm"
                        >
                          {session.feedback.pacing}
                        </Badge>
                      )}
                      {session.analysisStatus !== "completed" && (
                        <Badge variant="outline" size="sm">
                          {session.analysisStatus === "pending" && "Processing..."}
                          {session.analysisStatus === "transcribing" && "Transcribing..."}
                          {session.analysisStatus === "analyzing" && "Analyzing..."}
                          {session.analysisStatus === "failed" && "Failed"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      &ldquo;{session.answer.question}&rdquo;
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(session.recordedAt), { addSuffix: true })}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {session.analysisStatus === "completed" && session.feedback && (
                      <ScoreText
                        score={session.feedback.contentFidelityScore}
                        className="text-2xl"
                      />
                    )}
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardInteractive>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="max-w-sm mx-auto space-y-4">
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mx-auto">
                <Play className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No sessions yet</h3>
              <p className="text-muted-foreground">
                Practice your first answer to see your recordings and feedback here.
              </p>
              <Link href="/practice">
                <Button>Start Practicing</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </HomeLayout>
  );
}
