import { createFileRoute } from "@tanstack/react-router";
import AuthForm from "@/components/auth/AuthForm";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [{ title: "Sign Up – BloodBridge AI" }],
  }),
  component: SignupPage,
});

function SignupPage() {
  return <AuthForm mode="signup" />;
}