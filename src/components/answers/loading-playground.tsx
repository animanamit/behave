"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { GenerateAnswersResponse } from "@/lib/zod-schemas";
import { CheckCircle2, Sparkles } from "lucide-react";

// Define a loose type for the streaming object since it's partial by definition
type PartialAnswers = {
  answers?: Array<{
    id?: number;
    competency?: string;
    question?: string;
    situation?: string;
    task?: string;
    action?: string;
    result?: string;
    fullAnswer?: string;
  }>;
};

interface LoadingPlaygroundProps {
  // We accept a partial shape because that's what useObject streams
  object: PartialAnswers | undefined; 
  isLoading: boolean; 
  targetCount?: number; 
}

/**
 * A "Playground" component to visualize 3 different ways of showing streaming AI data.
 */
export function LoadingPlayground({ 
  object, 
  isLoading, 
  targetCount = 25 
}: LoadingPlaygroundProps) {
  const answers = object?.answers || [];
  const count = answers.length;
  const progress = Math.min((count / targetCount) * 100, 100);

  return (
    <div className="space-y-12 py-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Loading State Playground</h2>
        <p className="text-muted-foreground">
          Visualizing 3 different ways to handle streaming AI responses.
        </p>
      </div>

      {/* OPTION A: THE LIVE STREAM */}
      <section className="space-y-4 border rounded-xl p-6 bg-muted/10">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Badge variant="outline">Option A</Badge>
            The "Live Stream" List
          </h3>
          {isLoading && <Badge variant="secondary" className="animate-pulse">Streaming...</Badge>}
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Best for: When users want to read content immediately as it arrives.
        </p>

        <div className="space-y-4">
          {answers.map((answer, idx) => (
            <Card key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex justify-between">
                  <span>{answer?.competency || "Thinking..."}</span>
                  <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {answer?.situation ? answer.situation.substring(0, 100) + "..." : "Generating..."}
                </p>
              </CardContent>
            </Card>
          ))}

          {isLoading && (
            <Card className="border-dashed opacity-50">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* OPTION B: THE PROGRESS DASHBOARD */}
      <section className="space-y-4 border rounded-xl p-6 bg-muted/10">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Badge variant="outline">Option B</Badge>
            The "Progress Dashboard"
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Best for: Background tasks where completion status is more important than content.
        </p>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Generating Answers...</span>
                <span>{count} / {targetCount}</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            <div className="rounded-lg bg-muted p-4 h-[120px] overflow-hidden relative">
              {answers.length > 0 ? (
                <div className="animate-in fade-in">
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-primary">
                    <Sparkles className="w-4 h-4" />
                    Latest: {answers[count - 1]?.competency}
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    "{answers[count - 1]?.fullAnswer?.substring(0, 150) || "Writing..."}..."
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  {isLoading ? "Waiting for stream to start..." : "Ready to generate."}
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-muted to-transparent" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* OPTION C: THE GRID FILL */}
      <section className="space-y-4 border rounded-xl p-6 bg-muted/10">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Badge variant="outline">Option C</Badge>
            The "Grid Fill"
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Best for: Giving a sense of scope and "filling up" a collection.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: targetCount }).map((_, idx) => {
            const answer = answers[idx];
            const isGenerated = !!answer;
            const isNext = idx === count && isLoading;

            return (
              <div
                key={idx}
                className={`
                  h-24 rounded-lg border flex flex-col items-center justify-center p-2 text-center transition-all duration-500
                  ${isGenerated 
                    ? "bg-card border-border shadow-sm scale-100" 
                    : "bg-muted/30 border-transparent scale-95 opacity-50"
                  }
                  ${isNext ? "border-primary/50 animate-pulse bg-primary/5" : ""}
                `}
              >
                {isGenerated ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-green-500 mb-1" />
                    <span className="text-xs font-medium truncate w-full px-2">
                      {answer.competency}
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-mono text-muted-foreground">
                    {idx + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
