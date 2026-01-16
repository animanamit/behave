import { Heading, Text } from "@/components/ui/typography";
import { RecentSessions } from "@/components/dashboard/recent-sessions";
import { getServerCaller } from "@/lib/trpc-server";
import { getCurrentUser } from "@/lib/cached-auth";

/**
 * Sessions section that fetches and displays recent practice sessions.
 * This is an async Server Component - data is fetched on the server.
 */
export async function SessionsSection() {
  const user = await getCurrentUser();

  if (!user?.id) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <Heading as="h3" className="text-lg mb-4">
          Practice Sessions
        </Heading>
        <Text variant="muted" className="text-center py-4">
          Please sign in to view sessions.
        </Text>
      </div>
    );
  }

  const trpc = await getServerCaller();
  const sessions = await trpc.practiceSessions.getUserPracticeSessions({
    userId: user.id,
  });

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <Heading as="h3" className="text-lg mb-4">
        Practice Sessions
      </Heading>
      {sessions && sessions.length > 0 ? (
        <RecentSessions sessions={sessions} maxCount={3} />
      ) : (
        <Text variant="muted" className="text-center py-4">
          No sessions yet.
        </Text>
      )}
    </div>
  );
}
