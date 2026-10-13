"use client";

import Link from "next/link";
import * as React from "react";
import { Bell, CheckCheck, Sparkles, MessageCircle, GraduationCap, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/format";
import { NOW_MS } from "@/lib/services";
import type { NotificationKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDevArena } from "@/hooks/dev-arena-provider";

const KIND_ICON: Record<NotificationKind, typeof Bell> = {
  xp: Sparkles,
  title: Sparkles,
  challenge: Bell,
  teaching: GraduationCap,
  help: MessageCircle,
  scout: Compass,
  review: CheckCheck,
  system: Bell,
};

export function NotificationBell() {
  const { notifications, unreadCount, markNotificationsRead } = useDevArena();
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) markNotificationsRead();
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications, none unread"
        }
        className={cn(
          "relative inline-flex size-9 items-center justify-center rounded-md border transition-colors",
          open
            ? "border-secondary bg-secondary-tint text-secondary-muted"
            : "border-sand-400 bg-sand-50 text-ink-500 hover:border-ink-300 hover:text-ink-800",
        )}
      >
        <Bell className="size-4" aria-hidden />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[9px] font-semibold leading-4 text-sand-50 animate-tick">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] animate-scale-in overflow-hidden rounded-lg border border-sand-400 bg-sand-50 shadow-deep"
        >
          <div className="flex items-center justify-between border-b border-sand-300 px-4 py-3">
            <span className="eyebrow">Notifications</span>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          <ul className="max-h-80 divide-y divide-sand-200 overflow-y-auto">
            {notifications.slice(0, 5).map((notification) => {
              const Icon = KIND_ICON[notification.kind];
              const body = (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-sm bg-sand-200 text-ink-500">
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">
                      {notification.headline}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-600">{notification.body}</p>
                    <time
                      dateTime={notification.createdAt}
                      className="mt-1 block font-mono text-[9px] uppercase tracking-[0.1em] text-ink-300"
                    >
                      {relativeTime(notification.createdAt, NOW_MS)}
                    </time>
                  </div>
                </div>
              );

              return (
                <li key={notification.id} className="px-4 py-3 transition-colors hover:bg-sand-100">
                  {notification.href ? (
                    <Link href={notification.href} onClick={() => setOpen(false)}>
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ul>

          <div className="border-t border-sand-300 bg-sand-100/70 px-4 py-2.5">
            <Button variant="ghost" size="sm" className="w-full" onClick={markNotificationsRead}>
              <CheckCheck className="size-3.5" aria-hidden />
              Mark everything read
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}