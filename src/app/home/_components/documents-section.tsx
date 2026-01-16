import { Heading, Text } from "@/components/ui/typography";
import { RecentDocuments } from "@/components/dashboard/recent-documents";
import { getServerCaller } from "@/lib/trpc-server";
import { getCurrentUser } from "@/lib/cached-auth";

/**
 * Documents section that fetches and displays recent documents.
 * This is an async Server Component - data is fetched on the server.
 */
export async function DocumentsSection() {
  const user = await getCurrentUser();

  if (!user?.id) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <Heading as="h3" className="text-lg mb-4">
          Your Documents
        </Heading>
        <Text variant="muted" className="text-center py-4">
          Please sign in to view documents.
        </Text>
      </div>
    );
  }

  const trpc = await getServerCaller();
  const files = await trpc.files.getUserFiles({ userId: user.id });

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <Heading as="h3" className="text-lg mb-4">
        Your Documents
      </Heading>
      {files && files.length > 0 ? (
        <RecentDocuments files={files} maxCount={3} />
      ) : (
        <Text variant="muted" className="text-center py-4">
          No documents yet.
        </Text>
      )}
    </div>
  );
}
