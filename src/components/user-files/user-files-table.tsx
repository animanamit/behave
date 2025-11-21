"use client";

import { columns } from "@/components/user-files/columns";
import { DataTable } from "@/components/user-files/data-table";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc-client";
import { Skeleton } from "@/components/ui/skeleton";

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

  const tableData = trpc.files.getUserFiles.useQuery(
    { userId: userId ?? "" },
    {
      enabled: hasUserId,
    }
  );

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
    <div>
      {tableData.data && <DataTable columns={columns} data={tableData.data} />}
    </div>
  );
};

export default UserFilesTable;
