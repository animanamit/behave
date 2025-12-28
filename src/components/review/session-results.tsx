import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text, Heading } from "@/components/ui/typography";
import { Separator } from "@/components/ui/separator";
import { PracticeSessionWithFeedback } from "@/lib/zod-schemas";
import { CheckCircle2, AlertCircle, Volume2, Timer } from "lucide-react";
import { useState } from "react";

interface SessionResultsProps {
  session: PracticeSessionWithFeedback;
}

export function SessionResults({ session }: SessionResultsProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const feedback = session.feedback!;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-blue-600 bg-blue-50";
    return "text-yellow-600 bg-yellow-50";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Improvement";
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <Badge className="mb-2">{session.answer.competency}</Badge>
        <Heading as="h2" className="text-xl mb-2">
          {session.answer.question}
        </Heading>
        <Text variant="muted" className="text-sm">
          Recorded {new Date(session.recordedAt).toLocaleDateString()}
        </Text>
      </Card>

      <Card className="overflow-hidden">
        <video
          src={session.videoUrl}
          controls
          className="w-full bg-black"
          style={{ maxHeight: "500px" }}
        />
      </Card>

      <Card className="p-8 text-center">
        <div className="mb-4">
          <Text
            variant="small"
            className="text-muted-foreground uppercase tracking-wide"
          >
            Content Fidelity Score
          </Text>
        </div>
        <div
          className={`text-6xl font-bold mb-4 ${getScoreColor(
            feedback.contentFidelityScore
          )}`}
        >
          {feedback.contentFidelityScore}
        </div>
        <Text variant="small" className="text-muted-foreground mb-6 block">
          {getScoreLabel(feedback.contentFidelityScore)}
        </Text>

        <div className="flex justify-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-muted-foreground" />
            <span>{session.duration}s</span>
          </div>
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <span>
              {feedback.wordsMatched}/{feedback.totalWords} words matched
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="w-5 h-5 text-muted-foreground" />
            <Text
              variant="small"
              className="text-muted-foreground uppercase"
            >
              Pacing
            </Text>
          </div>
          <p className="text-lg font-semibold">
            {feedback.pacing}
            {feedback.pacing === "Just right" && (
              <CheckCircle2 className="w-5 h-5 text-green-600 inline ml-2" />
            )}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
            <Text
              variant="small"
              className="text-muted-foreground uppercase"
            >
              Confidence
            </Text>
          </div>
          <p className="text-lg font-semibold">{feedback.confidence}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-muted-foreground" />
            <Text
              variant="small"
              className="text-muted-foreground uppercase"
            >
              Script Adherence
            </Text>
          </div>
          <p className="text-lg font-semibold">
            {feedback.wentOffScript ? "Went off-script" : "Stayed on script"}
          </p>
          {feedback.wentOffScript && (
            <Text variant="small" className="text-muted-foreground mt-1">
              Made it {feedback.offScriptImprovement}
            </Text>
          )}
        </Card>
      </div>

      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <Heading as="h3" className="text-lg">Suggestions</Heading>
        </div>
        <Text variant="muted">{feedback.suggestions}</Text>
      </Card>

      <Card className="p-6">
        <Button
          variant="ghost"
          onClick={() => setShowTranscript(!showTranscript)}
          className="w-full justify-between mb-4"
        >
          <span className="font-semibold">View Transcript</span>
          {showTranscript ? <span>▼</span> : <span>▶</span>}
        </Button>
        {showTranscript && (
          <>
            <Separator className="mb-4" />
            <div className="bg-muted/50 p-4 rounded-lg">
              <Text variant="muted" className="whitespace-pre-wrap">
                {session.transcript}
              </Text>
            </div>
          </>
        )}
      </Card>

      <Card className="p-6">
        <Heading as="h3" className="text-lg mb-4">Original Script</Heading>
        <div className="bg-muted/50 p-4 rounded-lg max-h-64 overflow-y-auto">
          <Text variant="muted" className="whitespace-pre-wrap">
            {session.answer.fullAnswer}
          </Text>
        </div>
      </Card>
    </div>
  );
}
