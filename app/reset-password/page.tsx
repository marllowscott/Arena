"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, PasswordInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

/**
 * Password reset page. Reached from the reset link in the recovery email.
 * Supabase exchanges the recovery token automatically on load, establishing a
 * session. The user then sets a new password via updateUser.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    // Supabase exchanges the recovery token from the URL on load.
    // No action needed here; updateUser works once the session is established.
  }, []);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setMessage(null);
    try {
      const password = String(formData.get("password") ?? "");
      const confirm = String(formData.get("confirmPassword") ?? "");

      if (!password) {
        setMessage({ kind: "error", text: "New password is required." });
        return;
      }
      if (password.length < 6) {
        setMessage({ kind: "error", text: "Password must be at least 6 characters." });
        return;
      }
      if (password !== confirm) {
        setMessage({ kind: "error", text: "Passwords do not match." });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage({ kind: "error", text: error.message });
        return;
      }

      setDone(true);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      setMessage({ kind: "error", text: `Something went wrong: ${detail || "Unknown error"}` });
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-dvh bg-sand-100">
        <div className="mx-auto w-full max-w-md px-6 py-12 sm:py-20">
          <div className="text-center">
            <Lock className="mx-auto size-12 text-primary mb-4" aria-hidden />
            <h2 className="font-display text-xl font-bold tracking-tight text-ink-900">
              Password reset
            </h2>
            <p className="mt-2 text-base leading-relaxed text-ink-500">
              Your password has been updated. You can sign in now.
            </p>
            <div className="mt-6">
              <Button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full"
              >
                Sign in
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-sand-100">
      <div className="mx-auto w-full max-w-md px-6 py-12 sm:py-20">
        <header className="mb-8 flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push("/login")}
            className="text-ink-400 hover:text-ink-600"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to sign in
          </Button>
        </header>

        <section className="rounded-lg border border-sand-300 bg-sand-50 p-6 shadow-subtle sm:p-8">
          <h2 className="font-display text-lg font-bold tracking-tight text-ink-900 mb-1">
            Set new password
          </h2>
          <p className="text-xs font-mono text-ink-400 mb-6">
            Enter a new password for your account.
          </p>

          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="At least 6 characters"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Type it again"
              />
            </div>

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
              {pending ? "Resetting…" : "Reset password"}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
