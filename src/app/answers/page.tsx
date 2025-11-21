"use client";
import { HomeLayout } from "@/components/layouts/home-layout";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/layout";
import { Heading } from "@/components/ui/typography";
import UserFilesTable, {
  UserFilesTableSkeleton,
} from "@/components/user-files/user-files-table";
import { Suspense } from "react";

const AnswersPage = () => {
  function askAi() {
    console.log("huh");
  }
  return (
    <HomeLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="border-b border-border pb-4">
          <Heading as="h2">Your Generated Answers</Heading>
        </div>

        <Suspense fallback={<UserFilesTableSkeleton />}>
          <UserFilesTable />
        </Suspense>

        <Section className="p-0">
          <Button onClick={askAi}>Generate New Answer</Button>
        </Section>
      </div>
    </HomeLayout>
  );
};

export default AnswersPage;
