"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/arena/actions";
import { cn } from "@/lib/utils";

export function SignOutButton({
  variant = "sidebar",
}: {
  variant?: "sidebar" | "collapsed" | "menu";
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const styles = {
    sidebar:
      "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-ink-700 bg-ink-850 px-3 text-xs text-sand-300 transition-colors hover:border-ink-600 hover:text-sand-100",
    collapsed:
      "inline-flex size-10 items-center justify-center rounded-md border border-ink-700 bg-ink-850 text-sand-300 transition-colors hover:border-ink-600 hover:text-sand-100",
    menu:
      "flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-xs text-ink-700 hover:bg-sand-200 disabled:opacity-50",
  } satisfies Record<"sidebar" | "collapsed" | "menu", string>;

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={variant === "collapsed" ? "Sign out" : undefined}
      onClick={async () => {
        setPending(true);
        await logout();
        router.refresh();
      }}
      className={cn(styles[variant], "disabled:opacity-50")}
    >
      {variant !== "collapsed" && (
        <span className={variant === "sidebar" ? "font-mono text-[10px] uppercase tracking-[0.12em]" : ""}>
          {pending ? "Signing out…" : "Sign out"}
        </span>
      )}
      <LogOut className="size-3.5 shrink-0" aria-hidden />
    </button>
  );
}
