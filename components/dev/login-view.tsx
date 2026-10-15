"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Building2, Target, Trophy } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INSTRUCTOR, services } from "@/lib/services";
import { levelForXp } from "@/lib/progression";
import { formatXp } from "@/lib/format";
import type { DeveloperRecord } from "@/lib/services/contracts";
import { useDevArena } from "@/hooks/dev-arena-provider";
import { cn } from "@/lib/utils";

/**
 * Mock login. Picks an identity from the hub roster and stores it in the
 * session. Real Supabase auth replaces this; the shape the app reads afterwards
 * does not change.
 */
export function LoginView() {
  const router = useRouter();
  const { signInAs, signOut, identity } = useDevArena();
  const [query, setQuery] = React.useState("");
  const [pending, setPending] = React.useState<string | null>(null);

  const roster = services.developers.list() as DeveloperRecord[];
  const signedIn = identity ? roster.find((developer) => developer.id === identity) ?? null : null;
  const needle = query.trim().toLowerCase();
  const visible = roster.filter((developer) =>
    needle
      ? `${developer.name} ${developer.handle}`.toLowerCase().includes(needle)
      : true,
  );

  function enter(developerId: string) {
    setPending(developerId);
    signInAs(developerId);
    router.push("/");
  }

  return (
    <div className="min-h-dvh bg-sand-100">
      <div className="mx-auto w-full max-w-2xl px-6 py-12 sm:py-20">
        <header>
          <Image src="/logo.svg" alt="" width={48} height={48} className="mb-4 size-12" />
          <span className="eyebrow">{INSTRUCTOR.hub}</span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            Dev Arena
          </h1>
          <p className="mt-3 max-w-lg text-base leading-relaxed text-ink-500">
            Complete problems, present topics, and find opportunities. You earn XP for the work,
            and XP moves you up the leaderboard.
          </p>
        </header>

        <ol className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Target, label: "Pick a problem", body: "Solve something real." },
            { icon: Trophy, label: "Earn XP", body: "Every activity pays." },
            { icon: Building2, label: "Climb", body: "Beat your last rank." },
          ].map((step, index) => (
            <li key={step.label} className="rounded-md border border-sand-400 bg-sand-50 p-4">
              <div className="flex items-center gap-2 text-primary">
                <step.icon className="size-4" aria-hidden />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
                  Step {index + 1}
                </span>
              </div>
              <div className="mt-2 font-display text-sm font-semibold text-ink-900">
                {step.label}
              </div>
              <p className="mt-1 text-xs text-ink-400">{step.body}</p>
            </li>
          ))}
        </ol>

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
                {signedIn ? `Signed in as ${signedIn.name}` : "Who are you signing in as?"}
              </h2>
              <p className="mt-1 text-sm text-ink-400">
                {signedIn
                  ? "Pick somebody else to switch, or continue where you left off."
                  : "Demo login. Pick any developer to see the app from their side."}
              </p>
            </div>
            {signedIn ? (
              <div className="flex items-center gap-3">
                <Button
                  tone="tech"
                  onClick={() => {
                    setPending(signedIn.id);
                    signInAs(signedIn.id);
                    router.push("/");
                  }}
                >
                  Continue
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
                <button
                  type="button"
                  onClick={signOut}
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300 hover:text-ink-500"
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-4">
            <label htmlFor="roster-search" className="sr-only">
              Search the roster
            </label>
            <Input
              id="roster-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the roster"
            />
          </div>

          <ul className="mt-4 space-y-2">
            {visible.map((developer) => {
              const level = levelForXp(developer.totalXp);
              const isPending = pending === developer.id;

              return (
                <li key={developer.id}>
                  <button
                    type="button"
                    onClick={() => enter(developer.id)}
                    disabled={isPending}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md border border-sand-400 bg-sand-50 p-3 text-left transition-colors",
                      "hover:border-primary hover:bg-primary-tint/30 disabled:opacity-60",
                    )}
                  >
                    <Avatar
                      initials={developer.initials}
                      name={developer.name}
                      from={developer.avatarFrom}
                      to={developer.avatarTo}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink-800">
                        {developer.name}
                      </div>
                      <div className="truncate font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                        Level {level.level} · {formatXp(developer.totalXp)} XP
                      </div>
                    </div>
                    <Badge tone="neutral" className="hidden sm:inline-flex">
                      {services.pathways.byId(developer.primaryPathway)?.shortName}
                    </Badge>
                    <ArrowRight className="size-4 shrink-0 text-ink-300" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>

          {visible.length === 0 ? (
            <p className="mt-4 text-sm text-ink-400">Nobody on the roster matches that.</p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
