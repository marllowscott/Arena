import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { PathwayId } from "@/lib/types";

export interface ManagedDeveloper {
  id: string;
  email: string;
  handle: string;
  full_name: string;
  headline: string;
  primary_pathway: PathwayId;
  total_xp: number;
  weekly_xp: number;
  streak_days: number;
  avatar_from: string;
  avatar_to: string;
  avatar_url: string | null;
  created_at: string;
  last_active_at: string;
}

export async function listManagedDevelopers(): Promise<ManagedDeveloper[]> {
  const supabase = createAdminClient();
  const users: Array<{ id: string; email: string }> = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw new Error(`Could not load Auth users: ${error.message}`);

    users.push(
      ...data.users.flatMap((user) =>
        user.email ? [{ id: user.id, email: user.email }] : [],
      ),
    );
    if (data.users.length < 1000) break;
    page += 1;
  }

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      "id, handle, full_name, headline, primary_pathway, total_xp, weekly_xp, streak_days, avatar_from, avatar_to, avatar_url, created_at, last_active_at, role",
    )
    .eq("role", "developer")
    .order("full_name", { ascending: true });
  if (error) throw new Error(`Could not load developer profiles: ${error.message}`);

  const emailsById = new Map(users.map((user) => [user.id, user.email]));
  return (profiles ?? [])
    .flatMap((profile) => {
      const email = emailsById.get(profile.id);
      if (!email) return [];
      const developer: ManagedDeveloper = {
        id: profile.id,
        email,
        handle: profile.handle,
        full_name: profile.full_name,
        headline: profile.headline,
        primary_pathway: profile.primary_pathway,
        total_xp: profile.total_xp,
        weekly_xp: profile.weekly_xp,
        streak_days: profile.streak_days,
        avatar_from: profile.avatar_from,
        avatar_to: profile.avatar_to,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        last_active_at: profile.last_active_at,
      };
      return [developer];
    });
}
