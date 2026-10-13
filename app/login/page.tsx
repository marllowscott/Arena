import type { Metadata } from "next";
import { AuthView } from "@/components/auth/auth-view";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Create an account or log in to Dev Arena.",
};

export default function LoginPage() {
  return <AuthView />;
}
