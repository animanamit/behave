import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/typography";
import { formatDistanceToNow } from "date-fns";
import { PracticeSessionWithFeedback } from "@/lib/zod-schemas";

interface SessionListProps {
  sessions: PracticeSessionWithFeedback[];
}

export function SessionList({ sessions }: SessionListProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    return "text-yellow-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Improvement";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sessions.map((session) => (
        <Link key={session.id} href={`/review/${session.id}`}>
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
            <div className="flex-1">
              <div className="flex justify-between items-start mb-3">
                <Badge variant="outline">{session.answer.competency}</Badge>
                <Text variant="small" className="text-muted-foreground">
                  {formatDistanceToNow(new Date(session.recordedAt), {
                    addSuffix: true,
                  })}
                </Text>
              </div>
              <Text variant="muted" className="line-clamp-2 mb-4">
                {session.answer.question}
              </Text>
            </div>

            {session.analysisStatus === "completed" && session.feedback ? (
              <div className="border-t pt-4 mt-2">
                <div className="flex items-center justify-between">
                  <Text variant="small" className="text-muted-foreground">
                    Score
                  </Text>
                  <div className="text-right">
                    <span
                      className={`text-2xl font-bold ${getScoreColor(
                        session.feedback.contentFidelityScore
                      )}`}
                    >
                      {session.feedback.contentFidelityScore}
                    </span>
                    <Text variant="small" className="block text-muted-foreground">
                      {getScoreLabel(session.feedback.contentFidelityScore)}
                    </Text>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-t pt-4 mt-2">
                <Text variant="small" className="text-muted-foreground">
                  Status: {session.analysisStatus}
                </Text>
              </div>
            )}
          </Card>
        </Link>
      ))}
    </div>
  );
}
