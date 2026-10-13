"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { services } from "@/lib/services";
import { useDevArena } from "@/hooks/dev-arena-provider";

/**
 * The title reveal. Deliberately quiet: one panel, one line of copy, one button.
 */
export function TitleUnlockOverlay() {
  const { pendingReveal, dismissReveal } = useDevArena();
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!pendingReveal) return;
    buttonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismissReveal();
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [pendingReveal, dismissReveal]);

  if (!pendingReveal) return null;

  const pathway = services.pathways.list().find(
    (item) => item.id === pendingReveal.pathwayId,
  );

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-ink-950/80 px-4 backdrop-blur-sm animate-fade-in"
      onClick={dismissReveal}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Title unlocked"
        className="relative w-full max-w-md overflow-hidden rounded-xl border border-ink-600 bg-ink-900 px-8 py-10 text-center shadow-deep animate-scale-in"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="arena-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px animate-sheen bg-gradient-to-r from-transparent via-secondary to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full bg-secondary/20 blur-3xl"
          aria-hidden
        />

        <div className="relative">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-secondary-soft">
            Level up
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-secondary/50" aria-hidden />
            <span className="text-secondary" aria-hidden>
              ⚔
            </span>
            <h2 className="font-display text-3xl font-bold uppercase tracking-[0.08em] text-sand-50">
              {pendingReveal.name}
            </h2>
            <span className="text-secondary" aria-hidden>
              ⚔
            </span>
            <span className="h-px w-8 bg-secondary/50" aria-hidden />
          </div>

          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-sand-400">
            {pathway?.name} · Tier {pendingReveal.tier}
          </p>

          <p className="mx-auto mt-6 max-w-xs font-display text-base italic leading-relaxed text-sand-200">
            “{pendingReveal.motto}”
          </p>

          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
            {pendingReveal.xpRequired} pathway XP
          </p>

          <Button
            ref={buttonRef}
            variant="gold"
            tone="tech"
            size="lg"
            className="mt-8 w-full"
            onClick={dismissReveal}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}