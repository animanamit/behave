"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Clock, FileText, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Text, Caption } from "@/components/ui/typography";
import { PracticeSessionWithFeedback } from "@/lib/zod-schemas";

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

const getStatusBadgeVariant = (status: string): "destructive" | "default" | "secondary" => {
  if (status === "failed") return "destructive";
  if (status === "completed") return "default";
  return "secondary";
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: "Pending",
    transcribing: "Transcribing",
    analyzing: "Analyzing",
    completed: "Completed",
    failed: "Failed",
  };
  return labels[status] || status;
};

export const columns: ColumnDef<PracticeSessionWithFeedback>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "recordedAt",
    header: "Date",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {format(new Date(row.getValue("recordedAt")), "dd/MM/yy")}
      </span>
    ),
  },
  {
    accessorKey: "question",
    header: "Question",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <Text variant="small" className="font-normal line-clamp-2">
          {row.original.answer.question}
        </Text>
        <Caption className="hidden md:block text-muted-foreground">
          {row.original.answer.competency}
        </Caption>
      </div>
    ),
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono text-xs text-muted-foreground">
          {formatDuration(row.getValue("duration"))}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "transcript",
    header: "Transcription",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">
          {row.getValue("transcript") ? "✓" : "—"}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "aiReview",
    header: "AI Review",
    cell: ({ row }) => {
      const hasReview = row.original.analysisStatus === "completed" && row.original.feedback;
      return (
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {hasReview ? "✓" : "—"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "analysisStatus",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("analysisStatus") as string;
      return (
        <Badge variant={getStatusBadgeVariant(status)}>
          {getStatusLabel(status)}
        </Badge>
      );
    },
  },
];
