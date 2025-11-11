"use client";

import { ColumnDef } from "@tanstack/react-table";

import { format } from "date-fns";

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
    header: "File",
  },
  {
    accessorKey: "fileSize",
    header: "Size",
    cell: ({ row }) => formatFileSize(row.getValue("fileSize")),
  },
  {
    accessorKey: "uploadedAt",
    header: "Uploaded At",
    cell: ({ row }) =>
      format(new Date(row.getValue("uploadedAt")), "MMM d, yyyy"),
  },
];
