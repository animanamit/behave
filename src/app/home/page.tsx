"use client";

import { useState } from "react";
import { HomeLayout } from "@/components/layouts/home-layout";
import { Heading, Text } from "@/components/ui/typography";
import { Section, Grid } from "@/components/ui/layout";
import { authClient } from "@/lib/auth-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UploadCareerDoc from "@/components/upload-career-doc";
import UserFilesTable from "@/components/user-files/user-files-table";
import { MatchDefinition, type MatchResult } from "@/components/practice/match-definition";
import { getRandomVocabulary } from "@/lib/vocabulary";
import Loading from "@/app/home/loading";

export default function HomePage() {
  const { data: session, isPending } = authClient.useSession();
  const [vocabLevel, setVocabLevel] = useState<"basic" | "advanced">("basic");

  if (isPending) {
    return <Loading />;
  }

  const handleVocabComplete = (results: MatchResult[]) => {
    const correctCount = results.filter((r) => r.correct).length;
    console.log(`Vocabulary quiz completed: ${correctCount}/${results.length} correct`);
    // You can add analytics/logging here later
  };

  return (
    <HomeLayout>
      <div className="max-w-6xl mx-auto space-y-8">
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
              Vocabulary Practice
            </Heading>
            <Tabs
              value={vocabLevel}
              onValueChange={(v) => setVocabLevel(v as "basic" | "advanced")}
            >
              <TabsList className="grid w-full max-w-xs grid-cols-2">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="mt-6">
                <MatchDefinition
                  items={getRandomVocabulary("basic", 6)}
                  onComplete={handleVocabComplete}
                  title="Match Basic Vocabulary"
                  description="Practice essential professional vocabulary"
                />
              </TabsContent>
              <TabsContent value="advanced" className="mt-6">
                <MatchDefinition
                  items={getRandomVocabulary("advanced", 6)}
                  onComplete={handleVocabComplete}
                  title="Match Advanced Vocabulary"
                  description="Challenge yourself with more complex terms"
                />
              </TabsContent>
            </Tabs>
          </Section>

          <Section className="p-0 md:p-0">
            <Heading as="h3" className="mb-6">
              Your Documents
            </Heading>
            <UserFilesTable />
          </Section>
        </Grid>
      </div>
    </HomeLayout>
  );
}
