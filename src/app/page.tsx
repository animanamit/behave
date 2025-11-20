import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Heading } from "@/components/ui/typography";
import { AuthLayout } from "@/components/layouts/auth-layout";

export default function Home() {
  return (
    <AuthLayout>
      <div className="space-y-8 w-full max-w-sm mx-auto flex flex-col items-center">
        <Heading as="h1" className="text-6xl font-medium text-center lowercase tracking-tight">
          behave
        </Heading>
        <div className="w-full">
          <GoogleSignInButton />
        </div>
      </div>
    </AuthLayout>
  );
}
