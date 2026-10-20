import type { Metadata } from "next";
import { KeyRound, Trophy } from "lucide-react";
import { PageHeader } from "@/components/shared/section-heading";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { UnlockGrants } from "@/components/instructor/unlock-grants";
import { listManagedDevelopers } from "@/lib/arena/developer-management";
import {
  allDeveloperUnlocks,
  listTitles,
  listUnlockCatalogue,
  pathwayXpForDevelopers,
} from "@/lib/arena/progression";
import { hasAdminCredentials } from "@/lib/supabase/admin";
import { requireInstructor } from "@/lib/arena/session";
import { formatXp } from "@/lib/format";

export const metadata: Metadata = {
  title: "Unlocks and titles",
  description: "Grant responsibilities and watch title progression.",
};

export default async function InstructorUnlocksPage() {
  await requireInstructor();

  if (!hasAdminCredentials()) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <PageHeader
          eyebrow="Progression"
          title="Unlocks and titles"
          description="Granting a responsibility writes to developer_unlocks, which only the service-role key can reach."
        />
        <div className="mt-8">
          <EmptyState
            icon={KeyRound}
            eyebrow="Configuration"
            title="Service-role key required"
            body="Set SUPABASE_SERVICE_ROLE_KEY in .env.local to manage unlock grants. The title ladder below still reads from the database."
          />
        </div>
      </div>
    );
  }

  const [developers, catalogue, unlockRows, titles, pathwayXp] = await Promise.all([
    listManagedDevelopers(),
    listUnlockCatalogue(),
    allDeveloperUnlocks(),
    listTitles(),
    pathwayXpForDevelopers(),
  ]);

  const grants: Record<string, string[]> = {};
  for (const row of unlockRows) {
    grants[row.developer_id] = [...(grants[row.developer_id] ?? []), row.unlock_id];
  }

  const xpByDeveloper = new Map<string, Map<string, number>>();
  for (const row of pathwayXp) {
    const perPathway = xpByDeveloper.get(row.developer_id) ?? new Map<string, number>();
    perPathway.set(row.pathway_id, row.xp);
    xpByDeveloper.set(row.developer_id, perPathway);
  }

  /* Titles the developer has reached but that still need an instructor to
     confirm. There is no confirmation table, so this list is read-only. */
  const awaitingConfirmation = developers.flatMap((developer) => {
    const perPathway = xpByDeveloper.get(developer.id);
    if (!perPathway) return [];
    return titles
      .filter(
        (title) =>
          title.requires_confirmation &&
          (perPathway.get(title.pathway_id) ?? 0) >= title.xp_required &&
          !titles.some(
            (other) =>
              other.pathway_id === title.pathway_id &&
              other.tier < title.tier &&
              other.requires_confirmation &&
              (perPathway.get(other.pathway_id) ?? 0) >= other.xp_required,
          ),
      )
      .map((title) => ({ developer, title }));
  });

  return (
    <div className="px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Progression"
        title="Unlocks and titles"
        description="Unlocks are responsibilities the hub hands to a developer — review them, scout, teach, mentor. Titles come from pathway XP and rise on their own."
      />

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
          Responsibilities
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Granting a responsibility writes to the developer record. Revoking it
          removes the grant and nothing else.
        </p>
        <div className="mt-4">
          <UnlockGrants
            developers={developers.map((developer) => ({
              id: developer.id,
              full_name: developer.full_name,
              handle: developer.handle,
            }))}
            catalogue={catalogue}
            grants={grants}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
          Title ladder
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Every title with its XP threshold. A developer is on a title as soon as
          their pathway XP reaches the threshold.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {(["builder", "problem-solver", "teacher", "mentor", "scout"] as const).map(
            (pathwayId) => {
              const ladder = titles.filter((title) => title.pathway_id === pathwayId);
              return (
                <Card key={pathwayId} className="p-5">
                  <div className="flex items-center gap-2">
                    <Trophy className="size-4 text-secondary-muted" aria-hidden />
                    <h3 className="font-display text-sm font-semibold text-ink-900">
                      {pathwayId}
                    </h3>
                  </div>
                  <ul className="mt-3 divide-y divide-sand-200">
                    {ladder.map((title) => (
                      <li
                        key={title.id}
                        className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                      >
                        <span className="font-mono text-[10px] tabular-nums text-ink-300">
                          {String(title.tier).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-ink-800">{title.name}</span>
                          <span className="block text-xs leading-relaxed text-ink-400">
                            {title.motto}
                          </span>
                        </span>
                        <span className="font-mono text-[10px] tabular-nums text-ink-400">
                          {formatXp(title.xp_required)} XP
                        </span>
                        {title.requires_confirmation ? (
                          <Badge tone="outline" size="sm">
                            confirm
                          </Badge>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            },
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
          Titles awaiting confirmation
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Higher tiers are marked as needing an instructor to confirm them.
        </p>
        {awaitingConfirmation.length === 0 ? (
          <p className="mt-3 text-sm text-ink-400">
            Nobody is waiting on a title confirmation.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {awaitingConfirmation.map(({ developer, title }) => (
              <li
                key={`${developer.id}-${title.id}`}
                className="rounded-lg border border-sand-300 bg-sand-50 p-4 shadow-subtle"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-ink-800">
                    {developer.full_name}
                  </span>
                  <Badge tone="gold" size="sm">
                    {title.name}
                  </Badge>
                </div>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                  {title.pathway_id} · tier {title.tier} · {formatXp(title.xp_required)} XP
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
