"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, PasswordInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { login, signup } from "@/lib/arena/actions";

/**
 * Real Supabase Auth: create an account or log in. The database assigns
 * access from the account email domain.
 */
export function AuthView() {
  const router = useRouter();
  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<{ kind: "error" | "info"; text: string } | null>(null);

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

  return (
    <div className="min-h-dvh bg-sand-100">
      <div className="mx-auto w-full max-w-xl px-6 py-12 sm:py-20">
        <section className="mt-10 rounded-lg border border-sand-300 bg-sand-50 p-6 shadow-subtle sm:p-8">
          <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Authentication mode">
            {(["login", "signup"] as const).map((candidate) => (
              <button
                key={candidate}
                type="button"
                role="tab"
                aria-selected={mode === candidate}
                onClick={() => {
                  setMode(candidate);
                  setMessage(null);
                }}
                className={cn(
                  "h-10 rounded-md px-3 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
                  mode === candidate
                    ? "bg-ink-900 text-sand-50"
                    : "text-ink-400 hover:bg-sand-200 hover:text-ink-700",
                )}
              >
                {candidate === "login" ? "Log in" : "Create account"}
              </button>
            ))}
          </div>

          <form action={handleSubmit} className="mt-6 space-y-4">
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

            {mode === "signup" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" name="fullName" type="text" autoComplete="name" placeholder="Ada Lovelace" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="handle">Handle (optional)</Label>
                  <Input id="handle" name="handle" type="text" autoComplete="username" placeholder="ada" />
                </div>
              </div>
            ) : null}

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
