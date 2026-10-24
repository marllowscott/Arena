import type { Metadata } from "next";
import { LifeBuoy, Flag } from "lucide-react";
import { PageHeader } from "@/components/shared/section-heading";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { listHelpRequests } from "@/lib/arena/data";
import { requireInstructor } from "@/lib/arena/session";
import { relativeTime } from "@/lib/format";
import { nowMs } from "@/lib/arena/clock";

export const metadata: Metadata = {
  title: "Problem reports",
  description: "Problems developers have reported. Read them and turn the useful ones into assignments.",
};

export default async function InstructorProbesPage() {
  await requireInstructor();
  const reports = await listHelpRequests();

  return (
    <div className="px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Problem inbox"
        title="Reported problems"
        description="Problems developers have hit in the wild. Read them, then turn the useful ones into assignments from the Assignments page."
      />

      {reports.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={LifeBuoy}
            title="No reported problems yet"
            body="When a developer posts a problem they're stuck on, it lands here."
          />
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {reports.map((report) => (
            <li
              key={report.id}
              className="rounded-lg border border-sand-300 bg-sand-50 p-4 shadow-subtle"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={report.flagged ? "primary" : "neutral"}>
                  {report.flagged ? "Flagged" : report.status}
                </Badge>
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                  {report.pathwayShortName ?? report.pathwayId} · {relativeTime(report.createdAt, nowMs())}
                </span>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
                  by {report.developerName}
                </span>
              </div>
              <h2 className="mt-2 font-display text-base font-semibold tracking-tight text-ink-900">
                {report.title}
              </h2>
              <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-ink-500">
                {report.body}
              </p>
              {report.flagReason ? (
                <div className="mt-3 rounded-md border border-primary-line bg-primary-tint px-3 py-2 text-xs text-primary-deep">
                  <Flag className="mr-1 inline size-3" aria-hidden />
                  Flag reason: {report.flagReason}
                </div>
              ) : null}
              {report.technologies.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {report.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-md border border-sand-300 bg-sand-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}