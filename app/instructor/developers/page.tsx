import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/section-heading";
import { DeveloperManager } from "@/components/instructor/developer-manager";
import { listPathways, recentXpEvents } from "@/lib/arena/data";
import { listManagedDevelopers } from "@/lib/arena/developer-management";
import { requireInstructor } from "@/lib/arena/session";
import { hasAdminCredentials } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Developers",
  description: "Developer progress across the roster.",
};

export default async function InstructorDevelopersPage() {
  await requireInstructor();
  if (!hasAdminCredentials()) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <PageHeader
          eyebrow="Roster"
          title="Developers"
          description="Manage developer accounts and profile details."
        />
        <p
          role="alert"
          className="mt-6 rounded-md border border-secondary-line bg-secondary-tint p-4 text-sm text-ink-700"
        >
          Account management needs the server-only <code>SUPABASE_SERVICE_ROLE_KEY</code>.
          Add it to <code>.env.local</code> and your hosting environment, then restart the local
          server. Never prefix it with <code>NEXT_PUBLIC_</code> or expose it in client code.
        </p>
      </div>
    );
  }

  const [developers, pathways, xpEvents] = await Promise.all([
    listManagedDevelopers(),
    listPathways(),
    recentXpEvents(200),
  ]);

  return (
    <div className="px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Roster"
        title="Developers"
        description="Manage developer accounts, profile details, and read the XP ledger behind every balance."
      />
      <DeveloperManager developers={developers} pathways={pathways} xpEvents={xpEvents} />
    </div>
  );
}
