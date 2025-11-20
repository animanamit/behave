import { HomeLayout } from "@/components/layouts/home-layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <HomeLayout>
      <div className="h-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8 space-y-8 w-full max-w-5xl mx-auto">
        {/* Centered Header Skeleton - Matching H1 Size */}
        <div className="space-y-4 text-center w-full flex flex-col items-center">
          <Skeleton className="h-12 w-64" /> {/* H1 Size */}
          <Skeleton className="h-5 w-80" />
        </div>

        {/* Centered Content Skeleton */}
        <div className="w-full space-y-12">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-[250px] w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-[350px] w-full" />
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
