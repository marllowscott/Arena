import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PathwayId, Title } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/* Titles — the seeded ladder. Public reference data, readable by everyone.     */
/* -------------------------------------------------------------------------- */

export interface TitleRow {
  id: string;
  pathway_id: PathwayId;
  name: string;
  tier: number;
  xp_required: number;
  motto: string;
  /** Tiers at and above the confirmation line need an instructor to confirm. */
  requires_confirmation: boolean;
}

export async function listTitles(): Promise<TitleRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("titles")
    .select("id, pathway_id, name, tier, xp_required, motto, requires_confirmation")
    .order("pathway_id")
    .order("tier");
  if (error) throw error;
  return (data ?? []) as TitleRow[];
}

/** Database title rows to the shape the progression helpers expect. */
export function titlesFor(rows: TitleRow[], pathwayId: PathwayId): Title[] {
  return rows
    .filter((row) => row.pathway_id === pathwayId)
    .map((row) => ({
      id: row.id,
      pathwayId: row.pathway_id,
      name: row.name,
      tier: row.tier,
      xpRequired: row.xp_required,
      motto: row.motto,
      requiresConfirmation: row.requires_confirmation,
    }));
}

/* -------------------------------------------------------------------------- */
/* Unlocks — responsibilities, not trophies                                     */
/* -------------------------------------------------------------------------- */

export interface UnlockRow {
  id: string;
  title: string;
  description: string;
  scope: string;
  requirements: string[];
}

export interface DeveloperUnlockRow {
  developer_id: string;
  unlock_id: string;
  granted_at: string;
}

export async function listUnlockCatalogue(): Promise<UnlockRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("unlocks")
    .select("id, title, description, scope, requirements")
    .order("id");
  if (error) throw error;
  return (data ?? []) as UnlockRow[];
}

/**
 * Unlocks held by one developer.
 *
 * `developer_unlocks` is readable by the owner only, so the instructor view
 * goes through the service-role client, the same way developer management
 * does. The owner view below uses the ordinary session client so RLS still
 * applies to a developer looking at their own record.
 */
export async function unlocksForDeveloper(
  developerId: string,
): Promise<DeveloperUnlockRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("developer_unlocks")
    .select("developer_id, unlock_id, granted_at")
    .eq("developer_id", developerId)
    .order("granted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DeveloperUnlockRow[];
}

/** A developer's own unlocks, read through the session client so RLS applies. */
export async function ownUnlocks(userId: string): Promise<DeveloperUnlockRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("developer_unlocks")
    .select("developer_id, unlock_id, granted_at")
    .eq("developer_id", userId)
    .order("granted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DeveloperUnlockRow[];
}

/** Unlock grants for every developer, for the instructor roster. */
export async function allDeveloperUnlocks(): Promise<DeveloperUnlockRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("developer_unlocks")
    .select("developer_id, unlock_id, granted_at")
    .order("granted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DeveloperUnlockRow[];
}

/* -------------------------------------------------------------------------- */
/* Pathway XP — the per-ladder totals that decide titles                       */
/* -------------------------------------------------------------------------- */

export interface PathwayXpRow {
  developer_id: string;
  pathway_id: PathwayId;
  xp: number;
}

export async function pathwayXpFor(userId: string): Promise<PathwayXpRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pathway_xp")
    .select("developer_id, pathway_id, xp")
    .eq("developer_id", userId);
  if (error) throw error;
  return (data ?? []) as PathwayXpRow[];
}

export async function pathwayXpForDevelopers(): Promise<PathwayXpRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pathway_xp")
    .select("developer_id, pathway_id, xp");
  if (error) throw error;
  return (data ?? []) as PathwayXpRow[];
}

/* -------------------------------------------------------------------------- */
/* Achievements — the append-only record of graded work                         */
/* -------------------------------------------------------------------------- */

export interface AchievementRow {
  id: string;
  developer_id: string;
  kind: string;
  title: string;
  detail: string;
  xp: number;
  icon: string;
  reference_id: string | null;
  earned_at: string;
}

export async function achievementsFor(userId: string): Promise<AchievementRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .eq("developer_id", userId)
    .order("earned_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as AchievementRow[];
}

/* -------------------------------------------------------------------------- */
/* Teaching-proposal interest                                                  */
/* -------------------------------------------------------------------------- */

export interface ProposalVoteRow {
  proposal_id: string;
  voter_id: string;
  created_at: string;
}

export async function listProposalVotes(): Promise<ProposalVoteRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proposal_votes")
    .select("proposal_id, voter_id, created_at");
  if (error) throw error;
  return (data ?? []) as ProposalVoteRow[];
}
