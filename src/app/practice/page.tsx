"use client";

import { useState } from "react";
import { HomeLayout } from "@/components/layouts/home-layout";
import { PracticeQuestionList } from "@/components/practice/practice-question-list";
import dynamic from "next/dynamic";
import { trpc } from "@/lib/trpc-client";
import { authClient } from "@/lib/auth-client";
import { STARAnswer } from "@/lib/zod-schemas";
import { Loader2, Sparkles } from "lucide-react";
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
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

export default function PracticePage() {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;

  const [selectedAnswer, setSelectedAnswer] = useState<STARAnswer | null>(null);
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
  };

  // Practice mode - full screen experience
  if (mode === "practice" && selectedAnswer) {
    return (
      <PracticeSession
        answer={selectedAnswer}
        onBack={handleBackToSelection}
      />
    );
  }

  // List mode
  return (
    <HomeLayout>
      <div className="page-transition max-w-2xl mx-auto py-2">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Practice</h1>
          <p className="text-muted-foreground mt-1">
            Select a question to practice your response
          </p>
        </div>

        {/* Content */}
        {answersQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading questions...</p>
          </div>
        ) : answersQuery.data && answersQuery.data.length > 0 ? (
          <PracticeQuestionList
            answers={answersQuery.data}
            onSelectAnswer={handleSelectAnswer}
            onReviewSessions={() => {}}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-medium">No questions yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Generate your STAR answers first to start practicing.
              </p>
            </div>
            <Link href="/answers">
              <Button>Generate Answers</Button>
            </Link>
          </div>
        )}
      </div>
    </HomeLayout>
  );
}
