"use client";

import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { TeachView } from "@/components/dev/teach-view";

/**
 * Teaching proposals. This used to be a two-tab page shared with help requests,
 * but Probe now owns asking and helping, so this page has a single job and is
 * reached from a profile and the instructor side rather than the main nav.
 */
export function TopicsView() {
  return (
    <div>
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand-300 pb-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-400">
            Propose a session
          </p>
          <Link
            href="/probe"
            className={buttonVariants({ variant: "ghost", size: "sm", tone: "tech" })}
          >
            <HelpCircle className="size-3.5" aria-hidden />
            Stuck on something? Post a Probe
          </Link>
        </div>
      </div>

      <TeachView embedded />
    </div>
  );
}
