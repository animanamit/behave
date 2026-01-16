import { Suspense } from "react";
import { HomeLayout } from "@/components/layouts/home-layout";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/components/navigation/breadcrumb";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/cached-auth";

// Async Server Components for each section
import { WelcomeHeader } from "./_components/welcome-header";
import { ActivitySection } from "./_components/activity-section";
import { DocumentsSection } from "./_components/documents-section";
import { SessionsSection } from "./_components/sessions-section";

// Loading skeletons for Suspense fallbacks
import {
  WelcomeHeaderSkeleton,
  ActivitySectionSkeleton,
  DocumentsSectionSkeleton,
  SessionsSectionSkeleton,
} from "./_components/skeletons";

/**
 * Home Page - Dashboard Overview
 *
 * This is a Server Component that uses Suspense boundaries to stream
 * content progressively. Each section fetches its own data and renders
 * independently.
 *
 * Benefits:
 * - Faster initial paint (skeletons show immediately)
 * - Streaming (content appears as data loads)
 * - Less JavaScript sent to browser
 *
 * See revisions.md for detailed explanation.
 */
export default async function HomePage() {
  // Check authentication on the server
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <HomeLayout>
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Overview</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Header - Streams user name */}
        <Suspense fallback={<WelcomeHeaderSkeleton />}>
          <WelcomeHeader />
        </Suspense>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Timeline (left column on large screens) */}
          <div className="lg:col-span-1">
            <Suspense fallback={<ActivitySectionSkeleton />}>
              <ActivitySection />
            </Suspense>
          </div>

          {/* Documents and Sessions (right columns) */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Suspense fallback={<DocumentsSectionSkeleton />}>
                <DocumentsSection />
              </Suspense>

              <Suspense fallback={<SessionsSectionSkeleton />}>
                <SessionsSection />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
