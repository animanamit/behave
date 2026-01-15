import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/typography";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Mic } from "lucide-react";
import type { PracticeSessionWithFeedback } from "@/lib/zod-schemas";

interface RecentSessionsProps {
  sessions: PracticeSessionWithFeedback[];
  maxCount?: number;
}

export function RecentSessions({ sessions, maxCount = 3 }: RecentSessionsProps) {
  const recentSessions = sessions.slice(0, maxCount);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    return "text-yellow-600";
  };

  return (
    <div className="space-y-2">
      {recentSessions.length > 0 ? (
        recentSessions.map((session) => (
          <Link
            key={session.id}
            href={`/review/${session.id}`}
            className="block"
          >
            <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <Mic className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Text className="font-medium">
                    {session.answer.competency}
                  </Text>
                  <Text variant="small" className="text-muted-foreground">
                    {formatDistanceToNow(new Date(session.recordedAt), {
                      addSuffix: true,
                    })}
                  </Text>
                </div>
              </div>
              {session.analysisStatus === "completed" && session.feedback ? (
                <span
                  className={`text-sm font-bold ${getScoreColor(
                    session.feedback.contentFidelityScore
                  )}`}
                >
                  {session.feedback.contentFidelityScore}%
                </span>
              ) : (
                <Badge variant="outline">{session.analysisStatus}</Badge>
              )}
            </div>
          </Link>
        ))
      ) : (
        <Text variant="muted" className="text-center py-4">
          No practice sessions recorded yet.
        </Text>
      )}
      {sessions.length > maxCount && (
        <div className="pt-2">
          <Link href="/review">
            <Button variant="outline" size="sm" className="w-full">
              View All Sessions ({sessions.length})
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
