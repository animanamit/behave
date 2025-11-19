"use client";

import { columns } from "@/components/user-files/columns";
import { DataTable } from "@/components/user-files/data-table";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc-client";

const UserFilesTable = () => {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;

  const tableData = trpc.files.getUserFiles.useQuery(
    { userId: userId! },
    {
      enabled: !!userId,
    }
  );

  return (
    <div>
      {tableData.isLoading && <div>Loading...</div>}
      {tableData.isError && <div>Error: {tableData.error?.message}</div>}
      {tableData.data && <DataTable columns={columns} data={tableData.data} />}
    </div>
  );
};

export default UserFilesTable;
