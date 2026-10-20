"use client";

import Link from "next/link";
import { Clock, HandHelping, MessageSquare, ShieldAlert, Siren } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { PathwayIcon, PATHWAY_ACCENT } from "@/components/shared/pathway-icon";
import { relativeTime } from "@/lib/format";
import { nowMs } from "@/lib/arena/clock";
import type { HelpRequestDetail } from "@/lib/services/contracts";
import { cn } from "@/lib/utils";
import { ProbeActionButton } from "@/components/dev/probe-action-button";

const STATUS: Record<
  HelpRequestDetail["status"],
  { label: string; tone: "outline" | "support" | "gold" | "primary" }
> = {
  open: { label: "Open", tone: "outline" },
  solved: { label: "Solved", tone: "support" },
  flagged: { label: "Flagged", tone: "primary" },
  closed: { label: "Closed", tone: "gold" },
};

export function ProbeCard({
  request,
  developerId,
  className,
  isMine = false,
}: {
  request: HelpRequestDetail;
  developerId: string;
  className?: string;
  isMine?: boolean;
}) {
  const icon = request.pathwayIcon ?? "lifebuoy";
  const accent = PATHWAY_ACCENT[icon];
  const status = STATUS[request.status];

  const iAccepted = request.acceptedBy === developerId;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-lg border bg-sand-50 p-5 shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:shadow-raised",
        request.acceptedBy ? "border-primary-line" : "border-sand-300 hover:border-ink-300",
        request.urgency === "blocking" && request.status === "open" && "border-primary-line",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={status.tone}>{status.label}</Badge>
          {request.urgency === "blocking" && request.status === "open" ? (
            <Badge tone="primary">
              <Siren className="size-3" aria-hidden />
              Blocking
            </Badge>
          ) : null}
          {request.flagged ? (
            <Badge tone="primary">
              <ShieldAlert className="size-3" aria-hidden />
              Restricted
            </Badge>
          ) : null}
        </div>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
          <Clock className="size-3" aria-hidden />
          {relativeTime(request.createdAt, nowMs())}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Avatar
          initials={request.developerInitials}
          name={request.developerName}
          from={request.developerAvatarFrom}
          to={request.developerAvatarTo}
          size="sm"
        />
        <span className="eyebrow">
          {isMine ? "You are stuck" : `${request.developerName} is stuck`}
        </span>
      </div>

      <h3 className="mt-2.5 font-display text-base font-semibold leading-snug tracking-tight text-ink-900">
        <Link href={`/probe/${request.id}`} className="after:absolute after:inset-0">
          {request.title}
        </Link>
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{request.body}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xs border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em]",
            accent.bg,
            accent.border,
            accent.text,
          )}
        >
          <PathwayIcon name={icon} className="size-2.5" />
          {request.pathwayShortName ?? request.pathwayId}
        </span>
        {[...request.technologies, ...request.tags].slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-xs bg-sand-200 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-400"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Ownership. A probe is either unclaimed, yours, or somebody else's — and
          the state is the point, so it sits above the actions rather than
          hiding in the button label. */}
      <div className="mt-4 rounded-md border border-sand-300 bg-sand-100 px-3 py-2.5">
        {request.acceptedBy ? (
          <div className="flex items-center gap-2">
            <Avatar
              initials={request.acceptedByInitials ?? "??"}
              name={request.acceptedByName ?? undefined}
              from={request.acceptedByAvatarFrom ?? undefined}
              to={request.acceptedByAvatarTo ?? undefined}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-ink-700">
                {iAccepted ? "You accepted this" : `${request.acceptedByName} accepted this`}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                {iAccepted
                  ? "Post your answer, then wait for the confirmation"
                  : "One helper per probe"}
              </p>
            </div>
            {iAccepted && request.status === "open" && !request.flagged ? (
              <ProbeActionButton
                action={{ kind: "release", requestId: request.id }}
                variant="ghost"
              >
                Drop
              </ProbeActionButton>
            ) : null}
          </div>
        ) : request.status === "open" && !request.flagged ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
            Unclaimed · first to accept helps
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-sand-300 pt-3.5">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
          <MessageSquare className="size-3" aria-hidden />
          {request.answers.length} {request.answers.length === 1 ? "answer" : "answers"}
        </span>

        <div className="relative z-10 flex items-center gap-2">
          <Link
            href={`/probe/${request.id}`}
            className={buttonVariants({ variant: "secondary", size: "sm", tone: "tech" })}
          >
            View
          </Link>
          {!isMine && request.status === "open" && !request.flagged ? (
            request.acceptedBy ? (
              <Badge tone="support" size="sm">
                {iAccepted ? "You are helping" : "Taken"}
              </Badge>
            ) : (
              <ProbeActionButton
                action={{ kind: "accept", requestId: request.id }}
                variant="primary"
              >
                <HandHelping className="size-3.5" aria-hidden />
                Help
              </ProbeActionButton>
            )
          ) : null}
        </div>
      </div>
    </article>
  );
}
