import Link from "next/link";
import * as React from "react";
import { Avatar } from "@/components/ui/avatar";
import { XPChip } from "./xp-progress-bar";
import { relativeTime } from "@/lib/format";
import { NOW_MS, services } from "@/lib/services";
import type { ActivityEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<ActivityEvent["kind"], string> = {
  challenge: "Challenge",
  help: "Help",
  teaching: "Teaching",
  scout: "Scout",
  title: "Title",
  unlock: "Unlock",
};

const LINK_FOR: Partial<Record<ActivityEvent["kind"], string>> = {
  challenge: "/arena",
  help: "/probe",
  teaching: "/teach",
  scout: "/scout",
  title: "/profile",
  unlock: "/profile",
};

/**
 * Compact feed. `dense` drops the avatars for sidebar and mobile use.
 */
export function ActivityFeed({
  events,
  dense = false,
  limit,
  showNames = true,
  className,
}: {
  events: ActivityEvent[];
  dense?: boolean;
  limit?: number;
  showNames?: boolean;
  className?: string;
}) {
  const items = typeof limit === "number" ? events.slice(0, limit) : events;

  if (items.length === 0) {
    return (
      <p className={cn("text-sm text-ink-400", className)}>
        Nothing here yet. Your first mission will show up in this feed.
      </p>
    );
  }

  return (
    <ol className={cn("space-y-1", className)}>
      {items.map((event) => {
        const developer = services.developers.byId(event.developerId);
        const href = LINK_FOR[event.kind];
        const body = (
          <>
            {!dense ? (
              <Avatar
                initials={developer?.initials ?? "??"}
                name={developer?.name}
                from={developer?.avatarFrom}
                to={developer?.avatarTo}
                size="sm"
                className="mt-0.5"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug text-ink-600">
                {showNames && developer ? (
                  <span className="font-medium text-ink-800">{developer.name} </span>
                ) : null}
                <span className="text-ink-500">{event.message}</span>
              </p>
              <div className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                <span>{KIND_LABEL[event.kind]}</span>
                <span aria-hidden>·</span>
                <time dateTime={event.createdAt}>{relativeTime(event.createdAt, NOW_MS)}</time>
              </div>
            </div>
            {event.xp ? <XPChip value={event.xp} size="sm" /> : null}
          </>
        );

        return (
          <li key={event.id}>
            {href ? (
              <Link
                href={href}
                className="flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-sand-200/70"
              >
                {body}
              </Link>
            ) : (
              <div className="flex items-start gap-3 px-2 py-2">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}