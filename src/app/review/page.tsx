import { Heading, Text } from "@/components/ui/typography";
import { HomeLayout } from "@/components/layouts/home-layout";

export default function ReviewPage() {
  return (
    <HomeLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b border-border pb-4">
          <Heading as="h2">Practice Sessions</Heading>
        </div>
        
        <div className="py-12 text-center border border-dashed border-border bg-muted/10">
          <Text variant="muted">No practice sessions recorded yet.</Text>
          <Text variant="small" className="mt-2">Go to the Practice page to record your first session.</Text>
        </div>
      </div>
    </HomeLayout>
  );
}
