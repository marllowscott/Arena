import { DeveloperShell } from "@/components/layout/arena-shell";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/arena/actions";
import { initialsFor, requireDeveloper } from "@/lib/arena/session";
import { listPathways, unreadCount } from "@/lib/arena/data";

export default async function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireDeveloper();
  const profile = session.profile;

  if (!profile) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-sand-100 px-6">
        <div className="max-w-md rounded-lg border border-primary-line bg-primary-tint p-6">
          <h1 className="font-display text-lg font-semibold text-primary">
            {session.profileLookupError ? "Could not load your profile" : "Profile not found"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            {session.profileLookupError
              ? "The app encountered a database error while looking up your profile:"
              : "You are signed in, but no profile row matched this user ID. Compare it with the ID in Authentication → Users in the same Supabase project your app uses."}
          </p>
          {session.profileLookupError ? (
            <pre className="mt-3 overflow-x-auto rounded-md bg-sand-50 p-3 font-mono text-xs text-ink-700">
              {session.profileLookupError}
            </pre>
          ) : null}
          <p className="mt-3 break-all font-mono text-xs text-ink-600">
            Signed-in user ID: {session.userId}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-ink-500">
            In Supabase SQL Editor, check whether this exact ID exists in{" "}
            <code className="font-mono">public.profiles.id</code>. If the Auth user ID and profile
            ID differ, the profile was created for a different account.
          </p>
          <form action={logout} className="mt-5">
            <Button type="submit" variant="secondary" className="w-full">
              Sign out and return to login
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const [unread, pathways] = await Promise.all([
    unreadCount(profile.id).catch(() => 0),
    listPathways(),
  ]);
  const pathwayName =
    pathways.find((pathway) => pathway.id === profile.primary_pathway)?.short_name ??
    "Developer";

  return (
    <DeveloperShell
      identity={{
        name: profile.full_name,
        handle: profile.handle,
        initials: initialsFor(profile.full_name),
        avatarFrom: profile.avatar_from,
        avatarTo: profile.avatar_to,
        avatarUrl: profile.avatar_url ?? undefined,
        totalXp: profile.total_xp,
        weeklyXp: profile.weekly_xp,
        unreadCount: unread,
        title: "Developer",
        pathwayName,
        progress: 0,
        xpToNext: 0,
        profileHref: "/leaderboard",
      }}
    >
      {children}
    </DeveloperShell>
  );
}
