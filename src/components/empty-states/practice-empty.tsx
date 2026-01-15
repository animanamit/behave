import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import Link from "next/link";

export function PracticeEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-border bg-muted/5 rounded-xl text-center space-y-4">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-primary" />
      </div>
      <div className="space-y-2">
        <Heading as="h3">No answers to practice</Heading>
        <Text variant="muted" className="max-w-md">
          Generate some answers first to start practicing your interview skills.
        </Text>
      </div>
      <Link href="/answers">
        <Button>Generate Answers</Button>
      </Link>
    </div>
  );
}
