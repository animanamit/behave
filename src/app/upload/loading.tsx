import { HomeLayout } from "@/components/layouts/home-layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <HomeLayout>
      <div className="h-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8 space-y-8 w-full max-w-5xl mx-auto">
        {/* Centered Header Skeleton */}
        <div className="w-full border-b border-border pb-4 mb-4">
           <Skeleton className="h-10 w-64" /> {/* H2 Size */}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          <Skeleton className="h-[400px] w-full rounded-none" />
          <div className="space-y-4">
             <Skeleton className="h-8 w-48" />
             <Skeleton className="h-[400px] w-full rounded-none" />
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
