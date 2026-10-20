"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, KeyRound, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { grantUnlock, revokeUnlock } from "@/lib/arena/actions";
import type { UnlockRow } from "@/lib/arena/progression";
import { cn } from "@/lib/utils";

export interface UnlockDeveloper {
  id: string;
  full_name: string;
  handle: string;
}

/**
 * Grant or revoke a responsibility. `developer_unlocks` has no instructor
 * write policy, so the server action uses the service-role client; this
 * component only chooses which grant to write.
 */
export function UnlockGrants({
  developers,
  catalogue,
  grants,
}: {
  developers: UnlockDeveloper[];
  catalogue: UnlockRow[];
  grants: Record<string, string[]>;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = React.useState(developers[0]?.id ?? "");
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  const selected = developers.find((developer) => developer.id === selectedId) ?? null;
  const held = new Set(grants[selectedId] ?? []);

  async function toggle(unlockId: string, isHeld: boolean) {
    if (!selected) return;
    setPendingId(unlockId);
    setError(null);
    setInfo(null);
    try {
      const result = isHeld
        ? await revokeUnlock(selected.id, unlockId)
        : await grantUnlock(selected.id, unlockId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setInfo(result.info ?? "Saved.");
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  if (developers.length === 0) {
    return (
      <p className="rounded-md border border-sand-300 bg-sand-50 p-4 text-sm text-ink-500">
        No developer accounts yet, so there is nobody to grant a responsibility to.
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
      <div className="rounded-lg border border-sand-300 bg-sand-50 p-4 shadow-subtle">
        <div className="eyebrow mb-3">Developer</div>
        <ul className="max-h-96 space-y-1 overflow-y-auto">
          {developers.map((developer) => {
            const isSelected = developer.id === selectedId;
            const count = (grants[developer.id] ?? []).length;
            return (
              <li key={developer.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(developer.id);
                    setError(null);
                    setInfo(null);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors",
                    isSelected
                      ? "border-primary bg-primary-tint"
                      : "border-transparent hover:border-sand-400 hover:bg-sand-100",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink-800">
                      {developer.full_name}
                    </span>
                    <span className="block truncate font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                      @{developer.handle}
                    </span>
                  </span>
                  {count > 0 ? (
                    <Badge tone="gold" size="sm">
                      {count}
                    </Badge>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-lg border border-sand-300 bg-sand-50 p-5 shadow-subtle">
        {selected ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <KeyRound className="size-4 text-primary" aria-hidden />
              <h3 className="font-display text-base font-semibold tracking-tight text-ink-900">
                {selected.full_name}
              </h3>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                {held.size} of {catalogue.length} granted
              </span>
            </div>

            {error ? <FieldError className="mt-2">{error}</FieldError> : null}
            {info ? (
              <p role="status" className="mt-2 text-sm text-support-deep">
                {info}
              </p>
            ) : null}

            <ul className="mt-4 divide-y divide-sand-300">
              {catalogue.map((unlock) => {
                const isHeld = held.has(unlock.id);
                const isPending = pendingId === unlock.id;
                return (
                  <li
                    key={unlock.id}
                    className="flex flex-wrap items-start gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-medium text-ink-800">{unlock.title}</h4>
                        <Badge tone={isHeld ? "gold" : "neutral"} size="sm">
                          {isHeld ? "Granted" : "Not granted"}
                        </Badge>
                        <Badge tone="outline" size="sm">
                          {unlock.scope}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-ink-500">
                        {unlock.description}
                      </p>
                      {unlock.requirements.length > 0 ? (
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-300">
                          {unlock.requirements.join(" · ")}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={isHeld ? "danger" : "secondary"}
                      disabled={isPending}
                      onClick={() => toggle(unlock.id, isHeld)}
                    >
                      {isHeld ? (
                        <>
                          <Minus className="size-3.5" aria-hidden />
                          Revoke
                        </>
                      ) : (
                        <>
                          <Check className="size-3.5" aria-hidden />
                          Grant
                        </>
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}
