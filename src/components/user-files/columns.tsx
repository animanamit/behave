"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { FileIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Text, Caption } from "@/components/ui/typography";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
type userFile = {
  id: string;
  userId: string;
  s3Key: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedAt: Date;
};

// Helper to format bytes to KB/MB
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

export const columns: ColumnDef<userFile>[] = [
  {
    accessorKey: "fileName",
    header: "File Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="p-2 bg-muted/30 rounded-sm border border-border">
          <FileIcon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex flex-col">
          <Text variant="small" className="font-normal">{row.getValue("fileName")}</Text>
          <Caption className="hidden md:block">{row.original.contentType}</Caption>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "fileSize",
    header: "Size",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {formatFileSize(row.getValue("fileSize"))}
      </span>
    ),
  },
  {
    accessorKey: "uploadedAt",
    header: "Uploaded",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {format(new Date(row.getValue("uploadedAt")), "MMM d, yyyy")}
      </span>
    ),
  },
  // Add actions column for delete if needed
];
