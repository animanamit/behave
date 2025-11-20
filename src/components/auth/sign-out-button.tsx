"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const SignOutButton = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/");
          },
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Button variant="default" size="sm" onClick={handleSignOut} className="w-full justify-start">
      Sign Out
    </Button>
  );
};

export default SignOutButton;
