import { HomeLayout } from "@/components/layouts/home-layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <HomeLayout>
      <div className="h-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8 space-y-8 w-full max-w-5xl mx-auto">
         <div className="w-full border-b border-border pb-4 flex justify-between items-center">
            <Skeleton className="h-10 w-64" /> {/* H2 Size */}
         </div>
         
         <div className="w-full flex flex-col items-center justify-center text-center space-y-4 py-12 bg-muted/10 border border-dashed border-border">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-4 w-96" />
         </div>
      </div>
    </HomeLayout>
  );
}
