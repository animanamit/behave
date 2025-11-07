import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const handleSignOut = async () => {
  try {
    await authClient.signOut();
  } catch (error) {
    console.log(error);
  }
};

const SignOutButton = () => {
  return <Button onClick={handleSignOut}>Sign Out</Button>;
};

export default SignOutButton;
