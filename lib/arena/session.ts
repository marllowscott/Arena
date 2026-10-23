import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";

export interface ArenaProfile {
  id: string;
  handle: string;
  full_name: string;
  headline: string;
  primary_pathway: string;
  total_xp: number;
  weekly_xp: number;
  streak_days: number;
  avatar_from: string;
  avatar_to: string;
  avatar_url: string | null;
  created_at: string;
  last_active_at: string;
}

export interface ArenaSession {
  userId: string;
  email: string;
  profile: ArenaProfile | null;
  profileLookupError: string | null;
}

/** The current signed-in user and their profile, or null when signed out. */
export async function getSession(): Promise<ArenaSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, handle, full_name, headline, primary_pathway, total_xp, weekly_xp, streak_days, avatar_from, avatar_to, avatar_url, created_at, last_active_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? "",
    profile,
    profileLookupError: profileError?.message ?? null,
  };
}

/** Like getSession, but redirects to the sign-in screen when signed out. */
export async function requireSession(): Promise<ArenaSession> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Check the database-assigned role used by RLS and instructor operations. */
export async function isInstructor(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = (user?.email ?? "").trim().toLowerCase();
  const instructorDomain = email.endsWith("@uncommon.org");

  if (instructorDomain && hasAdminCredentials()) {
    try {
      const admin = createAdminClient();
      await admin.from("profiles").update({ role: "instructor" }).eq("id", userId);
    } catch {
      // Best-effort repair; fall back to the domain check below.
    }
  }

  if (hasAdminCredentials()) {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      if (data?.role === "instructor") return true;
      if (instructorDomain) return true;
    } catch {
      // Fall through to the database RPC.
    }
  }

  try {
    const { data, error } = await supabase.rpc("is_instructor", {
      p_user_id: userId,
    });
    if (error) return instructorDomain;
    if (data === true) return true;
  } catch {
    return instructorDomain;
  }
  return instructorDomain;
}

/** Instructor area gate. Developers are sent back to the developer area. */
export async function requireInstructor(): Promise<ArenaSession> {
  const session = await requireSession();
  if (!(await isInstructor(session.userId))) redirect("/");
  return session;
}

/** Developer area gate. The instructor is sent to the instructor area. */
export async function requireDeveloper(): Promise<ArenaSession> {
  const session = await requireSession();
  if (await isInstructor(session.userId)) redirect("/instructor");
  return session;
}

export function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || name.slice(0, 2).toUpperCase() || "D";
}
