"use client";

import * as React from "react";
import {
  FileCode2,
  FileText,
  GitBranch,
  ImageIcon,
  Link2,
  MonitorPlay,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/input";
import { FieldError, FieldHint } from "@/components/ui/input";
import type { EvidenceItem, EvidenceRequirement } from "@/lib/types";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<EvidenceRequirement["kind"], LucideIcon> = {
  repository: GitBranch,
  demo: MonitorPlay,
  screenshot: ImageIcon,
  video: MonitorPlay,
  file: FileCode2,
};

const PLACEHOLDER: Record<EvidenceRequirement["kind"], string> = {
  repository: "github.com/org/repo (branch: fix/session-refresh)",
  demo: "https://your-demo.example.com or recordings/demo.mp4",
  screenshot: "docs/evidence/before-after.png",
  video: "recordings/session.mp4",
  file: "docs/notes/architecture.md",
};

/**
 * Evidence is a list of links, not an upload form. Each requirement is tied to
 * the mission so a developer cannot submit something that was never asked for.
 */
export function EvidenceInput({
  requirements,
  value,
  onChange,
  errors = {},
}: {
  requirements: EvidenceRequirement[];
  value: EvidenceItem[];
  onChange: (items: EvidenceItem[]) => void;
  errors?: Record<string, string>;
}) {
  function setItem(requirement: EvidenceRequirement, next: string) {
    const existing = value.find((item) => item.label === requirement.label);
    const others = value.filter((item) => item.label !== requirement.label);
    if (!next.trim()) {
      onChange(others);
      return;
    }
    onChange([
      ...others,
      {
        id: existing?.id ?? `${requirement.id}-${requirement.kind}`,
        kind: requirement.kind,
        label: requirement.label,
        value: next.trim(),
      },
    ]);
  }

  return (
    <div className="space-y-4">
      {requirements.map((requirement) => {
        const Icon = KIND_ICON[requirement.kind];
        const current = value.find((item) => item.label === requirement.label)?.value ?? "";
        const error = errors[requirement.id];

        return (
          <div key={requirement.id}>
            <Label htmlFor={requirement.id}>
              <span className="flex items-center gap-2">
                <Icon className="size-3.5 text-ink-400" aria-hidden />
                {requirement.label}
                <span
                  className={cn(
                    "font-sans text-[10px] normal-case tracking-normal",
                    requirement.required ? "text-primary" : "text-ink-300",
                  )}
                >
                  {requirement.required ? "required" : "optional"}
                </span>
              </span>
            </Label>
            <div className="relative">
              <Link2
                className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-300"
                aria-hidden
              />
              <Input
                id={requirement.id}
                value={current}
                onChange={(event) => setItem(requirement, event.target.value)}
                placeholder={PLACEHOLDER[requirement.kind]}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${requirement.id}-error` : undefined}
                className={cn("pl-9 font-mono text-xs", error && "border-primary")}
              />
            </div>
            {error ? (
              <FieldError id={`${requirement.id}-error`}>{error}</FieldError>
            ) : (
              <FieldHint>{requirement.hint}</FieldHint>
            )}
          </div>
        );
      })}

      <p className="flex items-start gap-2 border-t border-sand-300 pt-3 text-xs leading-relaxed text-ink-400">
        <FileText className="mt-0.5 size-3.5 shrink-0 text-ink-300" aria-hidden />
        Evidence is linked, not uploaded, in this phase. File storage arrives with the backend.
      </p>
    </div>
  );
}