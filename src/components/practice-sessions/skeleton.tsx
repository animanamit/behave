"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function PracticeSessionsTableSkeleton() {
  return (
    <div className="rounded-md border">
      <div className="p-4">
        <Skeleton className="h-[250px] w-full rounded-md" />
      </div>
    </div>
  );
}
