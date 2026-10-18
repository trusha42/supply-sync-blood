import { createFileRoute } from "@tanstack/react-router";
import AuthForm from "@/components/auth/AuthForm";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Login – BloodBridge AI" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  return <AuthForm mode="login" />;
}