import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client"; //import the auth client

const signIn = async () => {
  const data = await authClient.signIn.social({
    provider: "google",
  });
};

const SignUp = () => {
  return (
    <div>
      SignUp
      <Button onClick={() => signUp()}>Sign Up</Button>
    </div>
  );
};

export default SignUp;
