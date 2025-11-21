import { HomeLayout } from "@/components/layouts/home-layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <HomeLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8 w-full">
        <div className="w-full max-w-5xl grid lg:grid-cols-3 gap-6 h-full max-h-[800px]">
          <div className="lg:col-span-2 flex flex-col gap-4 h-full">
            <Skeleton className="flex-1 w-full h-full rounded-none min-h-[400px]" />
            <div className="h-20 flex items-center justify-center gap-4 shrink-0">
              <Skeleton className="h-14 w-14 rounded-full" />
            </div>
          </div>

          <div className="lg:col-span-1 h-full flex flex-col gap-4">
            <Skeleton className="w-full h-full rounded-none min-h-[400px]" />
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
