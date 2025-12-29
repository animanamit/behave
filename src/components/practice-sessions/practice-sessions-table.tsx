"use client";

import { useState } from "react";
import { columns } from "@/components/practice-sessions/columns";
import { DataTable } from "@/components/user-files/data-table";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc-client";
import { PracticeSessionsTableSkeleton } from "./skeleton";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

const PracticeSessionsTable = () => {
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const userId = session?.user.id;
  const hasUserId = Boolean(userId);

  const [rowSelection, setRowSelection] = useState({});

  const utils = trpc.useUtils();
  const tableData = trpc.practiceSessions.getUserPracticeSessions.useQuery(
    { userId: userId ?? "" },
    { enabled: hasUserId }
  );

  const deleteMutation = trpc.practiceSessions.deletePracticeSessions.useMutation();

  const handleDelete = async () => {
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) return;

    toast.loading("Deleting practice sessions...");

    try {
      const result = await deleteMutation.mutateAsync({ sessionIds: selectedIds });

      toast.dismiss();
      toast.success(`Deleted ${result.deletedCount} practice session(s)`);

      utils.practiceSessions.getUserPracticeSessions.invalidate();
      setRowSelection({});
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to delete sessions");
    }
  };

  const isLoading =
    isSessionPending ||
    (hasUserId && tableData.isLoading) ||
    (hasUserId && tableData.status === "pending");

  if (isLoading) {
    return <PracticeSessionsTableSkeleton />;
  }

  if (tableData.isError) {
    return (
      <div className="text-red-500">Error: {tableData.error?.message}</div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.keys(rowSelection).length > 0 && (
        <div className="flex items-center justify-between bg-muted/40 p-2 px-4 rounded-md border border-border animate-in fade-in slide-in-from-top-2">
          <span className="text-sm text-muted-foreground">
            {Object.keys(rowSelection).length} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      {tableData.data && (
        <DataTable
          columns={columns}
          data={tableData.data}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
          emptyMessage="No sessions found"
        />
      )}
    </div>
  );
};

export default PracticeSessionsTable;
