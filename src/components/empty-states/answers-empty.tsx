import { Sparkles } from "lucide-react";
import { Heading, Text } from "@/components/ui/typography";

export function AnswersEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-border bg-muted/5 rounded-xl text-center space-y-4">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-primary" />
      </div>
      <div className="space-y-2">
        <Heading as="h3">No answers generated yet</Heading>
        <Text variant="muted" className="max-w-sm">
          Select your resume and click "Generate Answers" to get personalized
          STAR-format responses for your next interview.
        </Text>
      </div>
    </div>
  );
}
