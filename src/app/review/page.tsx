"use client";

import { HomeLayout } from "@/components/layouts/home-layout";
import { Heading, Text } from "@/components/ui/typography";
import { trpc } from "@/lib/trpc-client";
import { authClient } from "@/lib/auth-client";
import { Loader2, Sparkles } from "lucide-react";
import { SessionList } from "@/components/review/session-list";

export default function ReviewPage() {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;

  const sessionsQuery = trpc.practiceSessions.getUserPracticeSessions.useQuery(
    { userId: userId ?? "" },
    { enabled: !!userId }
  );

  if (sessionsQuery.isLoading) {
    return (
      <HomeLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b border-border pb-4">
          <div>
            <Heading as="h2" className="text-2xl tracking-tight">
              Practice Sessions
            </Heading>
            <Text variant="muted">
              Review your performance and AI feedback
            </Text>
          </div>
        </div>

        {sessionsQuery.data && sessionsQuery.data.length > 0 ? (
          <SessionList sessions={sessionsQuery.data} />
        ) : (
          <div className="py-12 text-center border border-dashed border-border bg-muted/10 rounded-xl">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <Text variant="muted" className="mt-4">
              No practice sessions recorded yet.
            </Text>
            <Text variant="small" className="mt-2">
              Go to Practice page to record your first session.
            </Text>
          </div>
        )}
      </div>
    </HomeLayout>
  );
}
