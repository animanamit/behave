import { Heading } from "@/components/ui/typography";
import {
  ActivityTimeline,
  ActivityItem,
} from "@/components/dashboard/activity-timeline";
import { getServerCaller } from "@/lib/trpc-server";
import { getCurrentUser } from "@/lib/cached-auth";
import type { UserFile, PracticeSessionWithFeedback } from "@/lib/zod-schemas";

/**
 * Activity section that fetches and displays recent activity.
 * This is an async Server Component - data is fetched on the server.
 *
 * This component combines data from files and sessions into a unified
 * activity timeline, sorted by timestamp.
 */
export async function ActivitySection() {
  const user = await getCurrentUser();

  if (!user?.id) {
    return null;
  }

  const trpc = await getServerCaller();

  // Fetch files and sessions in parallel for efficiency
  const [files, sessions] = await Promise.all([
    trpc.files.getUserFiles({ userId: user.id }),
    trpc.practiceSessions.getUserPracticeSessions({ userId: user.id }),
  ]);

  // Build activity items from files and sessions
  const activities: ActivityItem[] = [];

  if (files) {
    files.slice(0, 2).forEach((file: UserFile) => {
      activities.push({
        type: "document",
        title: `Uploaded ${file.fileName}`,
        timestamp: new Date(file.uploadedAt),
      });
    });
  }

  if (sessions) {
    sessions
      .slice(0, 3)
      .forEach((session: PracticeSessionWithFeedback) => {
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

  // Use toSorted() for immutable sorting
  const sortedActivities = activities.toSorted(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  if (sortedActivities.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <Heading as="h3" className="text-lg mb-4">
        Recent Activity
      </Heading>
      <ActivityTimeline activities={sortedActivities.slice(0, 5)} />
    </div>
  );
}
