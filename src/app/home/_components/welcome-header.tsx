import { Heading, Text } from "@/components/ui/typography";
import { getCurrentSession } from "@/lib/cached-auth";

/**
 * Welcome header that displays the user's name.
 * This is an async Server Component that fetches the session server-side.
 */
export async function WelcomeHeader() {
  const session = await getCurrentSession();
  const userName = session?.user?.name || "User";

  return (
    <div className="flex items-end justify-between border-b border-border pb-6">
      <div className="space-y-1">
        <Heading as="h1">Welcome back, {userName}</Heading>
        <Text variant="muted">Here&apos;s your interview prep overview</Text>
      </div>
    </div>
  );
}
