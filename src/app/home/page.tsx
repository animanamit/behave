import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/cached-auth";
import { getServerCaller } from "@/lib/trpc-server";
import { HomeLayout } from "@/components/layouts/home-layout";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardInteractive } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreText } from "@/components/ui/score-ring";
import { Play, ArrowRight, Shuffle, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Loading skeleton for the hero section
function HeroSkeleton() {
  return (
    <Card className="p-8 animate-pulse">
      <div className="h-4 w-32 bg-muted rounded mb-4" />
      <div className="h-6 w-64 bg-muted rounded mb-2" />
      <div className="h-4 w-96 bg-muted rounded mb-6" />
      <div className="h-12 w-40 bg-muted rounded" />
    </Card>
  );
}

// Loading skeleton for sessions
function SessionsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

// Hero section with suggested practice
async function HeroSection() {
  const user = await getCurrentUser();
  if (!user?.id) return null;

  const trpc = await getServerCaller();

  // Get answers and sessions to find unpracticed answers
  const [answers, sessions] = await Promise.all([
    trpc.answers.getUserAnswers({ userId: user.id }),
    trpc.practiceSessions.getUserPracticeSessions({ userId: user.id }),
  ]);

  // Find answers that haven't been practiced
  const practicedAnswerIds = new Set(sessions.map((s) => String(s.answer.id)));
  const unpracticedAnswers = answers.filter((a) => !practicedAnswerIds.has(String(a.id)));

  // Get a suggested answer (first unpracticed, or random if all practiced)
  const suggestedAnswer =
    unpracticedAnswers[0] || answers[Math.floor(Math.random() * answers.length)];

  const practiceCount = sessions.filter((s) => s.analysisStatus === "completed").length;
  const totalAnswers = answers.length;

  if (!suggestedAnswer) {
    // No answers yet - prompt to generate
    return (
      <Card className="p-8 bg-gradient-to-br from-card to-secondary/30">
        <p className="text-sm font-medium text-muted-foreground mb-2">Get started</p>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">
          Generate your interview answers
        </h2>
        <p className="text-muted-foreground mb-6 max-w-lg">
          Upload your resume and we&apos;ll create 25 personalized STAR-format answers
          tailored to your experience.
        </p>
        <Link href="/answers">
          <Button size="lg">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-8 bg-gradient-to-br from-card to-secondary/20 animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline" size="sm">
          {practiceCount} of {totalAnswers} practiced
        </Badge>
        {unpracticedAnswers.length > 0 && (
          <Badge variant="info" size="sm">
            {unpracticedAnswers.length} new
          </Badge>
        )}
      </div>

      <p className="text-sm font-medium text-muted-foreground mb-1">Ready to practice?</p>
      <h2 className="text-2xl font-semibold tracking-tight mb-2">
        {suggestedAnswer.competency}
      </h2>
      <p className="text-muted-foreground mb-6 line-clamp-2 max-w-lg">
        &ldquo;{suggestedAnswer.question}&rdquo;
      </p>

      <div className="flex flex-wrap gap-3">
        <Link href={`/practice?id=${suggestedAnswer.id}`}>
          <Button size="lg">
            <Play className="mr-2 h-4 w-4" />
            Start Practice
          </Button>
        </Link>
        <Link href="/answers">
          <Button variant="outline" size="lg">
            <Shuffle className="mr-2 h-4 w-4" />
            Pick Another
          </Button>
        </Link>
      </div>
    </Card>
  );
}

// Recent sessions section
async function RecentSessionsSection() {
  const user = await getCurrentUser();
  if (!user?.id) return null;

  const trpc = await getServerCaller();
  const sessions = await trpc.practiceSessions.getUserPracticeSessions({
    userId: user.id,
  });

  const recentSessions = sessions.slice(0, 4);

  if (recentSessions.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-xl border border-dashed border-border bg-muted/5">
        <p className="text-muted-foreground">
          No practice sessions yet. Start practicing to see your progress here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recentSessions.map((session, idx) => (
        <Link key={session.id} href={`/review/${session.id}`}>
          <CardInteractive
            className={`p-4 flex items-center justify-between stagger-item stagger-${idx + 1}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium truncate">{session.answer.competency}</span>
                {session.analysisStatus !== "completed" && (
                  <Badge variant="outline" size="sm">
                    {session.analysisStatus}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(session.recordedAt), { addSuffix: true })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {session.analysisStatus === "completed" && session.feedback && (
                <ScoreText
                  score={session.feedback.contentFidelityScore}
                  className="text-lg"
                />
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardInteractive>
        </Link>
      ))}

      {sessions.length > 4 && (
        <Link href="/review" className="block">
          <Button variant="ghost" className="w-full">
            View all {sessions.length} sessions
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      )}
    </div>
  );
}

// Greeting based on time of day
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const firstName = user.name?.split(" ")[0] || "there";

  return (
    <HomeLayout>
      <div className="page-transition">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Greeting */}
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {getGreeting()}, {firstName}
            </h1>
          </div>

          {/* Hero - Suggested Practice */}
          <Suspense fallback={<HeroSkeleton />}>
            <HeroSection />
          </Suspense>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Recent Sessions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Sessions</h2>
              <Link href="/review">
                <Button variant="ghost" size="sm">
                  View all
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <Suspense fallback={<SessionsSkeleton />}>
              <RecentSessionsSection />
            </Suspense>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
