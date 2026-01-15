"use client";

import { HomeLayout } from "@/components/layouts/home-layout";
import { Heading, Text } from "@/components/ui/typography";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/components/navigation/breadcrumb";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";
import { authClient } from "@/lib/auth-client";
import { ActivityTimeline, ActivityItem } from "@/components/dashboard/activity-timeline";
import { RecentDocuments } from "@/components/dashboard/recent-documents";
import { RecentSessions } from "@/components/dashboard/recent-sessions";
import type { UserFile, PracticeSessionWithFeedback } from "@/lib/zod-schemas";

export default function HomePage() {
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user.id;

  const filesQuery = useQuery({
    queryKey: ["files", userId],
    queryFn: () => (trpc as any).files.getUserFiles.query({ userId }),
    enabled: !!userId,
  });
  const sessionsQuery = useQuery({
    queryKey: ["practiceSessions", userId],
    queryFn: () => (trpc as any).practiceSessions.getUserPracticeSessions.query({ userId }),
    enabled: !!userId,
  });

  if (isPending) {
    return (
      <HomeLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-border border-t-foreground/20 animate-spin rounded-full" />
        </div>
      </HomeLayout>
    );
  }

  const activities: ActivityItem[] = [];
  if (filesQuery.data) {
    filesQuery.data.slice(0, 2).forEach((file: UserFile) => {
      activities.push({
        type: "document",
        title: `Uploaded ${file.fileName}`,
        timestamp: new Date(file.uploadedAt),
      });
    });
  }
  if (sessionsQuery.data) {
    sessionsQuery.data.slice(0, 3).forEach((session: PracticeSessionWithFeedback) => {
      if (session.analysisStatus === "completed" && session.feedback) {
        activities.push({
          type: "session",
          title: `Completed ${session.answer.competency} session`,
          timestamp: new Date(session.recordedAt),
          score: session.feedback.contentFidelityScore,
        });
      }
    });
  }

  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <HomeLayout>
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Overview</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-end justify-between border-b border-border pb-6">
          <div className="space-y-1">
            <Heading as="h1">
              Welcome back, {session?.user?.name || "User"}
            </Heading>
            <Text variant="muted">
              Here's your interview prep overview
            </Text>
          </div>
        </div>

        {activities.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-xl p-6">
                <Heading as="h3" className="text-lg mb-4">
                  Recent Activity
                </Heading>
                <ActivityTimeline activities={activities.slice(0, 5)} />
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-xl p-6">
                  <Heading as="h3" className="text-lg mb-4">
                    Your Documents
                  </Heading>
                  {filesQuery.data && filesQuery.data.length > 0 ? (
                    <RecentDocuments files={filesQuery.data} maxCount={3} />
                  ) : (
                    <Text variant="muted" className="text-center py-4">
                      No documents yet.
                    </Text>
                  )}
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <Heading as="h3" className="text-lg mb-4">
                    Practice Sessions
                  </Heading>
                  {sessionsQuery.data && sessionsQuery.data.length > 0 ? (
                    <RecentSessions sessions={sessionsQuery.data} maxCount={3} />
                  ) : (
                    <Text variant="muted" className="text-center py-4">
                      No sessions yet.
                    </Text>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activities.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <Heading as="h3" className="text-lg mb-4">
                Your Documents
              </Heading>
              {filesQuery.data && filesQuery.data.length > 0 ? (
                <RecentDocuments files={filesQuery.data} maxCount={3} />
              ) : (
                <Text variant="muted" className="text-center py-4">
                  No documents yet.
                </Text>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <Heading as="h3" className="text-lg mb-4">
                Practice Sessions
              </Heading>
              {sessionsQuery.data && sessionsQuery.data.length > 0 ? (
                <RecentSessions sessions={sessionsQuery.data} maxCount={3} />
              ) : (
                <Text variant="muted" className="text-center py-4">
                  No sessions yet.
                </Text>
              )}
            </div>
          </div>
        )}
      </div>
    </HomeLayout>
  );
}
