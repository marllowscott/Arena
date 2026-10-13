"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, KeyRound, Target, Trophy, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { login, signup } from "@/lib/arena/actions";

/**
 * Real Supabase Auth: create an account or log in. Account creation
 * offers Developer or Instructor; instructor signup is restricted by
 * the server to the single authorized instructor email.
 */
export function AuthView() {
  const router = useRouter();
  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const [role, setRole] = React.useState<"developer" | "instructor">("developer");
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
      /* redirect() inside a server action throws an error carrying a
         framework digest. That error IS the successful navigation —
         re-throw it so the router performs the redirect instead of
         reporting a failure. */
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
        <header className="text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-md bg-primary font-display text-lg font-bold text-sand-50">
            DA
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            Dev Arena
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-ink-500">
            Solve real problems, present topics, and find opportunities.
            XP is awarded when the instructor approves your work.
          </p>
        </header>

        <ol className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Target, label: "Pick a problem", body: "Claim it, solve it." },
            { icon: Trophy, label: "Submit evidence", body: "The instructor reviews." },
            { icon: Building2, label: "Earn XP", body: "Approval pays, never a tap." },
          ].map((step) => (
            <li key={step.label} className="rounded-md border border-sand-400 bg-sand-50 p-4">
              <div className="flex items-center gap-2 text-primary">
                <step.icon className="size-4" aria-hidden />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
                  {step.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-400">{step.body}</p>
            </li>
          ))}
        </ol>

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
            {mode === "signup" ? (
              <fieldset>
                <legend className="sr-only">Account type</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: "developer", label: "Developer", icon: UserRound, body: "Solve, present, scout" },
                      { id: "instructor", label: "Instructor", icon: KeyRound, body: "The authorized account" },
                    ] as const
                  ).map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => setRole(candidate.id)}
                      aria-pressed={role === candidate.id}
                      className={cn(
                        "rounded-md border p-3 text-left transition-colors",
                        role === candidate.id
                          ? "border-primary bg-primary-tint"
                          : "border-sand-400 bg-sand-100 hover:border-ink-300",
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-ink-800">
                        <candidate.icon className="size-4" aria-hidden />
                        {candidate.label}
                      </span>
                      <span className="mt-1 block text-xs text-ink-400">{candidate.body}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : null}

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
              <Input
                id="password"
                name="password"
                type="password"
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

            <input type="hidden" name="role" value={role} />

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
                  : role === "instructor"
                    ? "Create instructor account"
                    : "Create developer account"}
              <ArrowRight className="size-4" aria-hidden />
            </Button>

{mode === "signup" && role === "instructor" ? (
              <FieldError className="text-center">
                Instructor signup is restricted to the authorized instructor email.
              </FieldError>
            ) : null}
          </form>
        </section>
      </div>
    </div>
  );
}
