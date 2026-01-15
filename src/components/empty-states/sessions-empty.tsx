import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import Link from "next/link";

export function SessionsEmpty() {
  return (
    <div className="py-12 text-center border border-dashed border-border bg-muted/10 rounded-xl">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
        <History className="w-6 h-6 text-primary" />
      </div>
      <Heading as="h3" className="mt-4 mb-2">
        No practice sessions recorded yet
      </Heading>
      <Text variant="muted" className="mb-4">
        Record your first practice session to start tracking your progress.
      </Text>
      <Link href="/practice">
        <Button>Start Practice</Button>
      </Link>
    </div>
  );
}
