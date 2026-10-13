"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { formatXp } from "@/lib/format";
import { useDevArena, type XpGain } from "@/hooks/dev-arena-provider";

function GainToast({ gain, onDone }: { gain: XpGain; onDone: () => void }) {
  React.useEffect(() => {
    const timer = window.setTimeout(onDone, 4200);
    return () => window.clearTimeout(timer);
  }, [gain.id, onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none flex animate-scale-in items-center gap-3 rounded-lg border border-ink-700 bg-ink-900 px-4 py-3 shadow-deep"
    >
      <span className="inline-flex size-8 items-center justify-center rounded-sm bg-secondary/20 text-secondary">
        <Sparkles className="size-4" aria-hidden />
      </span>
      <div>
        <div className="font-display text-sm font-bold tabular-nums text-secondary">
          +{formatXp(gain.xp)} XP
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-sand-300">
          {gain.label}
        </div>
      </div>
    </div>
  );
}

/**
 * XP gains get acknowledged once, briefly. No fireworks.
 *
 * The visible list is derived from the provider's gain queue minus whatever has
 * already been dismissed, so an award is never re-shown by a later render.
 */
export function XpToasts() {
  const { xpGains } = useDevArena();
  const [dismissed, setDismissed] = React.useState<number[]>([]);

  const visible = xpGains.filter((gain) => !dismissed.includes(gain.id));
  if (visible.length === 0) return null;

  function dismiss(id: number) {
    setDismissed((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-60 flex flex-col items-end gap-2">
      {visible.map((gain) => (
        <GainToast
          key={gain.id}
          gain={gain}
          onDone={() => dismiss(gain.id)}
        />
      ))}
    </div>
  );
}
