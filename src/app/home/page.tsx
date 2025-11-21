"use client";

import { HomeLayout } from "@/components/layouts/home-layout";
import { Heading, Text } from "@/components/ui/typography";
import { Section, Grid } from "@/components/ui/layout";
import { authClient } from "@/lib/auth-client";
import UploadCareerDoc from "@/components/upload-career-doc";
import UserFilesTable from "@/components/user-files/user-files-table";
import Loading from "@/app/home/loading";

export default function HomePage() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Loading />;
  }

  return (
    <HomeLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-end justify-between border-b border-border pb-6">
          <div className="space-y-1">
            <Heading as="h1">Welcome, {session?.user?.name || "User"}</Heading>
            <Text variant="muted">
              Manage your documents and practice sessions.
            </Text>
          </div>
        </div>

        <Grid cols={1} className="gap-12">
          <Section className="p-0 md:p-0">
            <Heading as="h3" className="mb-6">
              Upload New Document
            </Heading>
            <UploadCareerDoc />
          </Section>
        </Grid>
      </div>
    </HomeLayout>
  );
}
