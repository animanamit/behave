"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";

interface SignOutButtonProps {
  className?: string;
  showIcon?: boolean;
}

const SignOutButton = ({ className, showIcon = true }: SignOutButtonProps) => {
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
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      className={cn("text-muted-foreground hover:text-foreground", className)}
    >
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      Sign Out
    </Button>
  );
};

export default SignOutButton;
