"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, PasswordInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { login, signup } from "@/lib/arena/actions";
import { createClient } from "@/lib/supabase/client";

/**
 * Real Supabase Auth: create an account, log in, or request a password reset.
 * The database assigns access from the account email domain.
 */
export function AuthView() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = React.useState<"login" | "signup" | "forgot">("login");
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [resetSent, setResetSent] = React.useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setMessage(null);
    try {
      const result = await (mode === "login" ? login(formData) : signup(formData));
      if (result.error) {
        setMessage({ kind: "error", text: result.error });
      } else if (result.info) {
        setMessage({ kind: "info", text: result.info });
      }
      router.refresh();
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "digest" in error &&
        (error as { digest?: unknown }).digest
      ) {
        throw error;
      }
      const detail = error instanceof Error ? error.message : String(error);
      setMessage({
        kind: "error",
        text: detail
          ? `Something went wrong: ${detail}`
          : "Something went wrong. Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  async function sendResetLink(formData: FormData) {
    setPending(true);
    setMessage(null);
    try {
      const email = String(formData.get("email") ?? "").trim();
      if (!email) {
        setMessage({ kind: "error", text: "Email is required." });
        return;
      }
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
      });
      if (error) {
        setMessage({ kind: "error", text: error.message });
        return;
      }
      setResetSent(true);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      setMessage({ kind: "error", text: `Something went wrong: ${detail || "Unknown error"}` });
    } finally {
      setPending(false);
    }
  }

  if (resetSent) {
    return (
      <div className="min-h-dvh bg-sand-100">
        <div className="mx-auto w-full max-w-md px-6 py-12 sm:py-20">
          <div className="text-center">
            <Lock className="mx-auto size-12 text-primary mb-4" aria-hidden />
            <h2 className="font-display text-xl font-bold tracking-tight text-ink-900">
              Reset link sent
            </h2>
            <p className="mt-2 text-base leading-relaxed text-ink-500">
              Check your inbox for a link to set a new password. It will take you
              back here to finish.
            </p>
            <div className="mt-6">
              <Button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full"
              >
                Back to sign in
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-sand-100">
      <div className="mx-auto w-full max-w-xl px-6 py-12 sm:py-20">
        <header className="mb-8">
          {(mode === "login" || mode === "signup") && (
            <>
              <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-ink-500">
                Sign in to your account to claim problems, present topics, and earn XP.
              </p>
            </>
          )}
          {mode === "forgot" && (
            <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-ink-500">
              Enter your email and we&apos;ll send a link to reset your password.
            </p>
          )}
        </header>

        <section className="rounded-lg border border-sand-300 bg-sand-50 p-6 shadow-subtle sm:p-8">
          <form
            action={
              mode === "forgot" ? sendResetLink : handleSubmit
            }
            className="mt-6 space-y-4"
          >
            {mode === "forgot" ? (
              <div className="space-y-1.5">
                <Label htmlFor="resetEmail">Email</Label>
                <Input
                  id="resetEmail"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                />
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput
                    id="password"
                    name="password"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-ink-400 cursor-pointer select-none">
                    {mode === "login" ? "Don't have an account?" : "Already have an account?"}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === "login" ? "signup" : "login");
                      setMessage(null);
                    }}
                    className="text-xs font-mono text-primary underline-offset-4 hover:underline"
                  >
                    {mode === "login" ? "Create account" : "Log in"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setMessage(null);
                  }}
                  className="text-[10px] font-mono text-ink-400 underline-offset-4 hover:text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </>
            )}

            {message ? (
              <div
                role={message.kind === "error" ? "alert" : "status"}
                className={cn(
                  "rounded-md border px-3 py-2 text-sm",
                  message.kind === "error"
                    ? "border-primary-line bg-primary-tint text-primary"
                    : "border-support/50 bg-support-tint text-support-deep",
                )}
              >
                {message.text}
              </div>
            ) : null}

            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending
                ? "Please wait"
                : mode === "forgot"
                  ? "Send reset link"
                  : mode === "login"
                    ? "Log in"
                    : "Create account"}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
