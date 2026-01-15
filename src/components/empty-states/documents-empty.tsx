import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import Link from "next/link";

export function DocumentsEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-border bg-muted/5 rounded-xl text-center space-y-4">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Upload className="w-6 h-6 text-primary" />
      </div>
      <div className="space-y-2">
        <Heading as="h3">No documents yet</Heading>
        <Text variant="muted" className="max-w-sm">
          Upload your resume to generate personalized interview answers
        </Text>
      </div>
      <Link href="/upload">
        <Button>Upload Resume</Button>
      </Link>
    </div>
  );
}
