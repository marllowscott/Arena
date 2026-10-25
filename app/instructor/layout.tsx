import { InstructorShell } from "@/components/layout/arena-shell";
import { initialsFor, requireInstructor } from "@/lib/arena/session";
import { listPathways, pendingSubmissions } from "@/lib/arena/data";

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireInstructor();
  const profile = session.profile!;

  if (!profile) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-sand-100 px-6">
        <div className="max-w-md rounded-lg border border-primary-line bg-primary-tint p-6">
          <h1 className="font-display text-lg font-semibold text-primary">
            Account not provisioned
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            You signed in, but this project has no profile row for your account.
            The operator needs to apply{" "}
            <code className="font-mono text-xs">supabase/migrations/0003_mvp_authorization.sql</code>{" "}
            in the Supabase SQL editor, then sign out and back in.
          </p>
        </div>
      </div>
    );
  }

  const [pathways, pending] = await Promise.all([
    listPathways(),
    pendingSubmissions().catch(() => []),
  ]);
  const pathwayName =
    pathways.find((pathway) => pathway.id === profile.primary_pathway)?.short_name ??
    "Instructor";

  return (
    <InstructorShell
      identity={{
        name: profile.full_name,
        handle: profile.handle,
        initials: initialsFor(profile.full_name),
        avatarFrom: profile.avatar_from,
        avatarTo: profile.avatar_to,
        avatarUrl: profile.avatar_url ?? undefined,
        totalXp: profile.total_xp,
        weeklyXp: profile.weekly_xp,
        unreadCount: 0,
        title: "Instructor",
        pathwayName,
        progress: 0,
        xpToNext: 0,
        profileHref: "/instructor/profile",
      }}
      navBadges={{
        "/instructor/review-queue": pending.length,
      }}
    >
      {children}
    </InstructorShell>
  );
}
