"use client";

import { useState } from "react";
import { columns } from "@/components/user-files/columns";
import { DataTable } from "@/components/user-files/data-table";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export function UserFilesTableSkeleton() {
  return (
    <div className="rounded-md border">
      <div className="p-4">
        <Skeleton className="h-[250px] w-full rounded-md" />
      </div>
    </div>
  );
}

const UserFilesTable = () => {
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const userId = session?.user.id;
  const hasUserId = Boolean(userId);

  // 1. State for selection
  const [rowSelection, setRowSelection] = useState({});

  const utils = trpc.useUtils();
  const tableData = trpc.files.getUserFiles.useQuery(
    { userId: userId ?? "" },
    { enabled: hasUserId }
  );

  // 2. Delete Mutation
  const deleteMutation = trpc.files.deleteFile.useMutation();

  // 3. Handle Deletion
  const handleDelete = async () => {
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) return;

    const confirm = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} file(s)?`
    );
    if (!confirm) return;

    toast.loading("Deleting files...");

    try {
      // Since the backend expects one ID at a time, we loop (or Promise.all)
      // Ideally, add a 'deleteFiles' (plural) endpoint later for efficiency
      await Promise.all(
        selectedIds.map((id) => deleteMutation.mutateAsync({ id }))
      );

      toast.dismiss();
      toast.success("Files deleted successfully");

      // Refresh table and clear selection
      utils.files.getUserFiles.invalidate();
      setRowSelection({});
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to delete some files");
    }
  };

  // Show skeleton if:
  // 1. Session is being fetched
  // 2. User ID exists but query is loading
  // 3. User ID exists but query hasn't started yet (idle/pending state)
  const isLoading =
    isSessionPending ||
    (hasUserId && tableData.isLoading) ||
    (hasUserId && tableData.status === "pending");

  if (isLoading) {
    return <UserFilesTableSkeleton />;
  }

  if (tableData.isError) {
    return (
      <div className="text-red-500">Error: {tableData.error?.message}</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Bar: Only shows when items are selected */}
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
        />
      )}
    </div>
  );
};

export default UserFilesTable;
