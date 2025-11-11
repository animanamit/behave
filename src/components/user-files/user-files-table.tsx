"use client";
import { useQuery } from "@tanstack/react-query";

import { columns } from "@/components/user-files/columns";
import { DataTable } from "@/components/user-files/data-table";
import { authClient } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

import { UserFilesSchema } from "@/lib/zod-schemas";
import z from "zod";

async function fetchUserFiles(userId: string) {
  try {
    const response = await fetch(`/api/fetch-user-files?userId=${userId}`, {
      method: "GET",
    });

    const data = await response.json();
    console.log(data);
    return UserFilesSchema.parse(data);
    // return data;
  } catch (error) {
    if (error instanceof z.ZodError) {
      toast("Error, database is returning malformed data");
    } else {
      throw error; // re-throw so React Query handles it
    }
  }
}

const UserFilesTable = () => {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;

  const tableData = useQuery({
    queryKey: queryKeys.files.byUser(userId!),
    queryFn: () => fetchUserFiles(userId!),
    enabled: !!userId, // don't query until userId exists
  });

  return (
    <div>
      {tableData.isLoading && <div>Loading...</div>}
      {tableData.isError && <div>Error: {tableData.error?.message}</div>}
      {tableData.data && <DataTable columns={columns} data={tableData.data} />}
    </div>
  );
};

export default UserFilesTable;
