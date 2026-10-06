import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasSession } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Sign in — Invest Calculator",
  robots: { index: false, follow: false },
};
export default async function LoginPage() {
  if (await hasSession()) redirect("/");
  return <LoginForm />;
}
