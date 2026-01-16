import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/cached-auth";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

/**
 * Root landing page.
 *
 * - Authenticated users are redirected to the dashboard
 * - Unauthenticated users see the sign-in page
 */
export default async function LandingPage() {
  const user = await getCurrentUser();

  // Redirect authenticated users to dashboard
  if (user) {
    redirect("/home");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Logo */}
        <div className="space-y-2">
          <h1 className="text-5xl font-semibold tracking-tight">behave</h1>
          <p className="text-muted-foreground text-lg">
            Practice interviews. Build confidence.
          </p>
        </div>

        {/* Sign in */}
        <div className="pt-4">
          <GoogleSignInButton />
        </div>

        {/* Tagline */}
        <p className="text-sm text-muted-foreground pt-8">
          The only way to get better at interviews is to practice them.
        </p>
      </div>
    </div>
  );
}
