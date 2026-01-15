"use client";

import { Activity, useState, Suspense } from "react";
import { HomeLayout } from "@/components/layouts/home-layout";
import { PracticeQuestionList } from "@/components/practice/practice-question-list";
import dynamic from "next/dynamic"; // Import dynamic
import { trpc } from "@/lib/trpc-client";
import { authClient } from "@/lib/auth-client";
import { STARAnswer } from "@/lib/zod-schemas";
import { Heading, Text } from "@/components/ui/typography";
import { Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Dynamically import PracticeSession to disable SSR for it
const PracticeSession = dynamic(
  () =>
    import("@/components/practice/practice-session").then(
      (mod) => mod.PracticeSession
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    ),
  }
);

export default function PracticePage() {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;

  const [selectedAnswer, setSelectedAnswer] = useState<STARAnswer | null>(null);
  // mode controls which Activity is visible
  const [mode, setMode] = useState<"list" | "practice">("list");

  const answersQuery = trpc.answers.getUserAnswers.useQuery(
    { userId: userId ?? "" },
    { enabled: !!userId }
  );

  const handleSelectAnswer = (answer: STARAnswer) => {
    setSelectedAnswer(answer);
    setMode("practice");
  };

  const handleBackToSelection = () => {
    setMode("list");
    // We keep selectedAnswer set so PracticeSession doesn't unmount immediately if we wanted to keep its state,
    // but here we might want to reset it if we want a fresh session next time.
    // However, keeping it allows 'Activity' to work effectively if we switch back to the SAME answer.
    // For now, let's keep it. To reset, we'd clear it.
    // To truly use Activity for caching the *List* state (scroll pos), we definitely need Activity around List.
  };

  return (
    <HomeLayout>
      <div className="h-full">
        {/* List View Activity */}
        <Activity mode={mode === "list" ? "visible" : "hidden"}>
          <div className="flex flex-col h-full space-y-6">
            <div className="space-y-2 shrink-0">
              <Heading as="h2" className="text-2xl tracking-tight">
                Practice Mode
              </Heading>
              <Text variant="muted">
                Select an answer to practice recording yourself.
              </Text>
            </div>

            {answersQuery.isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <Text variant="muted">Loading answers...</Text>
              </div>
            ) : answersQuery.data && answersQuery.data.length > 0 ? (
              <PracticeQuestionList
                answers={answersQuery.data}
                onSelectAnswer={handleSelectAnswer}
                onReviewSessions={() => {}}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 space-y-6 border border-dashed border-border rounded-xl bg-muted/5">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <Heading as="h4">No answers yet</Heading>
                  <Text variant="muted" className="max-w-md">
                    Generate some answers first to start practicing.
                  </Text>
                </div>
                <Link href="/answers">
                  <Button>Go to Generator</Button>
                </Link>
              </div>
            )}
          </div>
        </Activity>

        {/* Practice View Activity */}
        <Activity mode={mode === "practice" ? "visible" : "hidden"}>
          <div className="h-full w-full">
            {selectedAnswer ? (
              <PracticeSession
                answer={selectedAnswer}
                onBack={handleBackToSelection}
              />
            ) : (
              // Fallback if no answer selected yet (shouldn't happen if logic is correct)
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            )}
          </div>
        </Activity>
      </div>
    </HomeLayout>
  );
}
