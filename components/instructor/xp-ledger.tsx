"use client";

import { useState } from "react";
import { formatXp, relativeTime } from "@/lib/format";
import { nowMs } from "@/lib/arena/clock";

type XpEvent = {
  id: string;
  developer_name: string | null;
  developer_handle: string | null;
  pathway_id: string;
  source: string;
  xp: number;
  label: string;
  detail: string;
  reference_id: string | null;
  created_at: string;
};

export function XpLedger({ events }: { events: XpEvent[] }) {
  const [limit, setLimit] = useState(3);
  const visible = events.slice(0, limit);
  const hasMore = limit < events.length;
  const canCollapse = limit > 3;

  if (events.length === 0) {
    return <p className="mt-3 text-sm text-ink-400">No XP events have been recorded yet.</p>;
  }

  return (
    <>
      <ul className="mt-4 divide-y divide-sand-300 rounded-md border border-sand-300 bg-sand-50">
        {visible.map((event) => (
          <li key={event.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
            <span className="min-w-16 font-mono text-sm font-semibold tabular-nums text-primary">
              {event.xp > 0 ? "+" : ""}
              {formatXp(event.xp)} XP
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-ink-800">
                {event.developer_name ?? "Unknown developer"}
                {event.developer_handle ? ` · @${event.developer_handle}` : ""}
                <span className="font-normal text-ink-500"> · {event.label}</span>
              </div>
              <p className="mt-0.5 text-xs text-ink-500">
                {event.source} · {event.pathway_id}
                {event.detail ? ` · ${event.detail}` : ""}
              </p>
              {event.reference_id ? (
                <p className="mt-0.5 font-mono text-[10px] text-ink-300">
                  Reference: {event.reference_id}
                </p>
              ) : null}
            </div>
            <time
              className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300"
              dateTime={event.created_at}
            >
              {relativeTime(event.created_at, nowMs())}
            </time>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        {hasMore ? (
          <button
            type="button"
            onClick={() => setLimit((n) => Math.min(n + 10, events.length))}
            className="text-sm font-medium text-primary hover:underline"
          >
            Show more ({events.length - limit} remaining)
          </button>
        ) : null}
        {canCollapse ? (
          <button
            type="button"
            onClick={() => setLimit(3)}
            className="text-sm font-medium text-ink-400 hover:underline"
          >
            Show less
          </button>
        ) : null}
      </div>
    </>
  );
}