import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/typography";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FileText } from "lucide-react";
import type { UserFile } from "@/lib/zod-schemas";

interface RecentDocumentsProps {
  files: UserFile[];
  maxCount?: number;
}

export function RecentDocuments({ files, maxCount = 3 }: RecentDocumentsProps) {
  const recentFiles = files.slice(0, maxCount);

  return (
    <div className="space-y-2">
      {recentFiles.length > 0 ? (
        recentFiles.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <div>
                <Text className="font-medium">{file.fileName}</Text>
                <Text variant="small" className="text-muted-foreground">
                  {formatDistanceToNow(new Date(file.uploadedAt), {
                    addSuffix: true,
                  })}
                </Text>
              </div>
            </div>
            <Badge variant="outline">{file.contentType}</Badge>
          </div>
        ))
      ) : (
        <Text variant="muted" className="text-center py-4">
          No documents uploaded yet.
        </Text>
      )}
      {files.length > maxCount && (
        <div className="pt-2">
          <Link href="/upload">
            <Button variant="outline" size="sm" className="w-full">
              View All Documents ({files.length})
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
