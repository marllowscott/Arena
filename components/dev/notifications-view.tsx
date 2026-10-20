"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Compass,
  GraduationCap,
  MessageCircle,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer, PageSection } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/section-heading";
import { relativeTime } from "@/lib/format";
import { nowMs } from "@/lib/arena/clock";
import { markNotificationsRead } from "@/lib/arena/actions";
import type { NotificationRow } from "@/lib/arena/data";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<string, React.ElementType> = {
  xp: Sparkles,
  title: Sparkles,
  challenge: Bell,
  teaching: GraduationCap,
  help: MessageCircle,
  scout: Compass,
  review: UserRound,
  system: Bell,
};

const KIND_TONE: Record<string, string> = {
  xp: "border-primary-line bg-primary-tint text-primary",
  title: "border-secondary-line bg-secondary-tint text-secondary-muted",
  challenge: "border-sand-400 bg-sand-200 text-ink-500",
  teaching: "border-support/50 bg-support-tint text-support-deep",
  help: "border-support/50 bg-support-tint text-support-deep",
  scout: "border-hush-soft bg-hush-tint text-[#5c7a57]",
  review: "border-sand-400 bg-sand-200 text-ink-500",
  system: "border-sand-400 bg-sand-200 text-ink-400",
};

export function NotificationsView({
  notifications,
  unreadCount,
}: {
  notifications: NotificationRow[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function markAllRead() {
    setPending(true);
    setError(null);
    try {
      const result = await markNotificationsRead();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <PageContainer size="narrow">
      <PageHeader
        eyebrow="Notifications"
        title="What changed"
        description="Every XP award, title unlock and answer you confirmed shows up here."
        actions={
          unreadCount > 0 ? (
            <Button variant="secondary" tone="tech" onClick={markAllRead} disabled={pending}>
              <CheckCheck className="size-4" aria-hidden />
              {pending ? "Marking" : "Mark all read"}
            </Button>
          ) : (
            <Badge tone="neutral">All caught up</Badge>
          )
        }
      />

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-primary-line bg-primary-tint px-3 py-2 text-sm text-primary"
        >
          {error}
        </p>
      ) : null}

      <PageSection>
        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            eyebrow="Nothing yet"
            title="No notifications"
            body="Complete a mission, confirm a help answer or receive XP and it lands here."
            action={
              <Link
                href="/arena"
                className="inline-flex h-10 items-center rounded-md bg-primary px-4 font-mono text-[11px] uppercase tracking-[0.14em] text-sand-50 transition-colors hover:bg-primary-strong"
              >
                Open the Arena
              </Link>
            }
          />
        ) : (
          <ol className="space-y-2">
            {notifications.map((notification, index) => {
              const Icon = KIND_ICON[notification.kind] ?? Bell;
              const tone = KIND_TONE[notification.kind] ?? KIND_TONE.system;

              return (
                <li
                  key={notification.id}
                  className={cn("animate-fade-up", `stagger-${Math.min(index + 1, 5)}`)}
                >
                  <Card
                    className={cn(
                      "flex items-start gap-3.5 p-4 transition-colors",
                      notification.read ? "bg-sand-50" : "border-primary-line bg-primary-tint/30",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex size-9 shrink-0 items-center justify-center rounded-md border",
                        tone,
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">
                          {notification.headline}
                        </span>
                        {!notification.read ? (
                          <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-ink-700">{notification.body}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <time
                          dateTime={notification.created_at}
                          className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300"
                        >
                          {relativeTime(notification.created_at, nowMs())}
                        </time>
                        {notification.href ? (
                          <Link
                            href={notification.href}
                            className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary hover:underline"
                          >
                            Open
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ol>
        )}
      </PageSection>
    </PageContainer>
  );
}
