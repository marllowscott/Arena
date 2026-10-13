import { createClient } from "@/lib/supabase/server";
import type { PathwayId } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/* Row shapes — the live database columns, mapped to the app's needs.          */
/* -------------------------------------------------------------------------- */

export interface ChallengeRow {
  id: string;
  slug: string;
  title: string;
  codename: string;
  summary: string;
  pathway_id: PathwayId;
  difficulty: string;
  xp: number;
  estimated_effort: string;
  deadline: string | null;
  status: string;
  tags: string[];
  mission: string;
  why_it_matters: string;
  requirements: string[];
  evidence: string[];
  completions: number;
  created_at: string;
}

export interface ProfileRow {
  id: string;
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

export interface ClaimRow {
  kind: "challenge" | "topic";
  activity_id: string;
  developer_id: string;
  claimed_at: string;
  handle: string | null;
  full_name: string | null;
}

export interface SubmissionRow {
  id: string;
  challenge_id: string | null;
  topic_id: string | null;
  developer_id: string;
  status: "pending" | "approved" | "adjusted" | "returned";
  solution: string;
  evidence: string[];
  explain_it: string;
  what_broke: string;
  how_fixed: string;
  suggested_xp: number;
  awarded_xp: number | null;
  reviewer_note: string | null;
  reviewer_id: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  developer_name: string | null;
  developer_handle: string | null;
  challenge_title: string | null;
  topic_title: string | null;
}

export interface TopicRow {
  id: string;
  title: string;
  pathway_id: PathwayId;
  proposed_by: string;
  summary: string;
  outcomes: string[];
  status: string;
  session_date: string | null;
  xp_reward: number;
  created_at: string;
  author_name: string | null;
  author_handle: string | null;
}

export interface OpportunityRow {
  id: string;
  organisation: string;
  role: string;
  summary: string;
  type: string;
  location: string;
  apply_url: string;
  closes_at: string | null;
  verification: string;
  xp_reward: number;
  created_at: string;
  submitted_by: string | null;
  review_status: string;
  review_note: string | null;
  reviewed_at: string | null;
  submitter_name: string | null;
  submitter_handle: string | null;
}

export interface XpEventRow {
  id: string;
  developer_id: string;
  pathway_id: PathwayId;
  source: string;
  xp: number;
  label: string;
  detail: string;
  reference_id: string | null;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  developer_id: string;
  kind: string;
  headline: string;
  body: string;
  xp: number | null;
  href: string | null;
  read: boolean;
  created_at: string;
}

export interface ActivityRow {
  id: string;
  developer_id: string;
  kind: string;
  message: string;
  xp: number | null;
  reference_id: string | null;
  created_at: string;
  developer_name: string | null;
  developer_handle: string | null;
}

export interface PathwayRow {
  id: string;
  name: string;
  short_name: string;
  icon: string;
  sort_order: number;
}

export async function listPathways(): Promise<PathwayRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pathways")
    .select("id, name, short_name, icon, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PathwayRow[];
}

/* -------------------------------------------------------------------------- */
/* Challenges (Problems)                                                       */
/* -------------------------------------------------------------------------- */

export async function listOpenChallenges(): Promise<ChallengeRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ChallengeRow[];
}

export async function listAllChallenges(): Promise<ChallengeRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ChallengeRow[];
}

export async function getChallenge(id: string): Promise<ChallengeRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return (data ?? null) as ChallengeRow | null;
}

/* -------------------------------------------------------------------------- */
/* Claims                                                                      */
/* -------------------------------------------------------------------------- */

export async function claimsFor(
  kind: "challenge" | "topic",
  activityId: string,
): Promise<ClaimRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_claims")
    .select(
      "kind, activity_id, developer_id, claimed_at, profiles:developer_id (handle, full_name)",
    )
    .eq("kind", kind)
    .eq("activity_id", activityId)
    .order("claimed_at", { ascending: false });
  if (error) throw error;

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const profile = (row.profiles ?? {}) as {
      handle: string | null;
      full_name: string | null;
    } | null;
    return {
      kind: row.kind as "challenge" | "topic",
      activity_id: row.activity_id as string,
      developer_id: row.developer_id as string,
      claimed_at: row.claimed_at as string,
      handle: profile?.handle ?? null,
      full_name: profile?.full_name ?? null,
    };
  });
}

export async function myClaim(
  kind: "challenge" | "topic",
  activityId: string,
  userId: string,
): Promise<ClaimRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_claims")
    .select("kind, activity_id, developer_id, claimed_at")
    .eq("kind", kind)
    .eq("activity_id", activityId)
    .eq("developer_id", userId)
    .single();
  if (error) return null;
  return (data ?? null) as ClaimRow | null;
}

export async function myClaims(
  kind: "challenge" | "topic",
  userId: string,
): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_claims")
    .select("activity_id")
    .eq("kind", kind)
    .eq("developer_id", userId);
  if (error) throw error;
  return ((data ?? []) as Array<{ activity_id: string }>).map(
    (row) => row.activity_id,
  );
}

/* -------------------------------------------------------------------------- */
/* Submissions                                                                 */
/* -------------------------------------------------------------------------- */

const SUBMISSION_SELECT = `
  id, challenge_id, topic_id, developer_id, status, solution, evidence,
  explain_it, what_broke, how_fixed, suggested_xp, awarded_xp, reviewer_note,
  reviewer_id, submitted_at, reviewed_at,
  developer:profiles!submissions_developer_id_fkey (full_name, handle),
  challenge:challenges (title),
  topic:teaching_proposals (title)
`;

function mapSubmission(row: Record<string, unknown>): SubmissionRow {
  const developer = (row.developer ?? {}) as {
    full_name: string | null;
    handle: string | null;
  } | null;
  const challenge = (row.challenge ?? {}) as { title: string | null } | null;
  const topic = (row.topic ?? {}) as { title: string | null } | null;
  return {
    id: row.id as string,
    challenge_id: row.challenge_id as string | null,
    topic_id: row.topic_id as string | null,
    developer_id: row.developer_id as string,
    status: row.status as SubmissionRow["status"],
    solution: row.solution as string,
    evidence: (row.evidence as string[] | null) ?? [],
    explain_it: row.explain_it as string,
    what_broke: row.what_broke as string,
    how_fixed: row.how_fixed as string,
    suggested_xp: row.suggested_xp as number,
    awarded_xp: row.awarded_xp as number | null,
    reviewer_note: row.reviewer_note as string | null,
    reviewer_id: row.reviewer_id as string | null,
    submitted_at: row.submitted_at as string,
    reviewed_at: row.reviewed_at as string | null,
    developer_name: developer?.full_name ?? null,
    developer_handle: developer?.handle ?? null,
    challenge_title: challenge?.title ?? null,
    topic_title: topic?.title ?? null,
  };
}

export async function pendingSubmissions(): Promise<SubmissionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submissions")
    .select(SUBMISSION_SELECT)
    .eq("status", "pending")
    .order("submitted_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Array<Record<string, unknown>>).map(mapSubmission);
}

export async function mySubmissions(userId: string): Promise<SubmissionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submissions")
    .select(SUBMISSION_SELECT)
    .eq("developer_id", userId)
    .order("submitted_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return ((data ?? []) as Array<Record<string, unknown>>).map(mapSubmission);
}

export async function submissionsForChallenge(
  challengeId: string,
): Promise<SubmissionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submissions")
    .select(SUBMISSION_SELECT)
    .eq("challenge_id", challengeId)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as Array<Record<string, unknown>>).map(mapSubmission);
}

/* -------------------------------------------------------------------------- */
/* Topics (teaching proposals)                                                 */
/* -------------------------------------------------------------------------- */

const TOPIC_SELECT = `
  id, title, pathway_id, proposed_by, summary, outcomes, status, session_date,
  xp_reward, created_at,
  author:profiles!teaching_proposals_proposed_by_fkey (full_name, handle)
`;

function mapTopic(row: Record<string, unknown>): TopicRow {
  const author = (row.author ?? {}) as {
    full_name: string | null;
    handle: string | null;
  } | null;
  return {
    id: row.id as string,
    title: row.title as string,
    pathway_id: row.pathway_id as PathwayId,
    proposed_by: row.proposed_by as string,
    summary: row.summary as string,
    outcomes: (row.outcomes as string[] | null) ?? [],
    status: row.status as string,
    session_date: row.session_date as string | null,
    xp_reward: row.xp_reward as number,
    created_at: row.created_at as string,
    author_name: author?.full_name ?? null,
    author_handle: author?.handle ?? null,
  };
}

export async function listTopics(): Promise<TopicRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teaching_proposals")
    .select(TOPIC_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as Array<Record<string, unknown>>).map(mapTopic);
}

export async function getTopic(id: string): Promise<TopicRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teaching_proposals")
    .select(TOPIC_SELECT)
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return mapTopic(data as unknown as Record<string, unknown>);
}

/* -------------------------------------------------------------------------- */
/* Opportunities                                                               */
/* -------------------------------------------------------------------------- */

const OPPORTUNITY_SELECT = `
  id, organisation, role, summary, type, location, apply_url, closes_at,
  verification, xp_reward, created_at, submitted_by, review_status,
  review_note, reviewed_at,
  submitter:profiles!opportunities_submitted_by_fkey (full_name, handle)
`;

function mapOpportunity(row: Record<string, unknown>): OpportunityRow {
  const submitter = (row.submitter ?? {}) as {
    full_name: string | null;
    handle: string | null;
  } | null;
  return {
    id: row.id as string,
    organisation: row.organisation as string,
    role: row.role as string,
    summary: row.summary as string,
    type: row.type as string,
    location: (row.location as string | null) ?? "",
    apply_url: (row.apply_url as string | null) ?? "",
    closes_at: row.closes_at as string | null,
    verification: row.verification as string,
    xp_reward: row.xp_reward as number,
    created_at: row.created_at as string,
    submitted_by: row.submitted_by as string | null,
    review_status: row.review_status as string,
    review_note: row.review_note as string | null,
    reviewed_at: row.reviewed_at as string | null,
    submitter_name: submitter?.full_name ?? null,
    submitter_handle: submitter?.handle ?? null,
  };
}

export async function listOpportunities(): Promise<OpportunityRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select(OPPORTUNITY_SELECT)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return ((data ?? []) as Array<Record<string, unknown>>).map(mapOpportunity);
}

export async function pendingOpportunities(): Promise<OpportunityRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select(OPPORTUNITY_SELECT)
    .eq("review_status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Array<Record<string, unknown>>).map(mapOpportunity);
}

export async function getOpportunity(
  id: string,
): Promise<OpportunityRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select(OPPORTUNITY_SELECT)
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return mapOpportunity(data as unknown as Record<string, unknown>);
}

/* -------------------------------------------------------------------------- */
/* Progress streams                                                            */
/* -------------------------------------------------------------------------- */

export async function leaderboard(): Promise<ProfileRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, handle, full_name, headline, primary_pathway, total_xp, weekly_xp, streak_days, avatar_from, avatar_to, created_at, last_active_at",
    )
    .order("total_xp", { ascending: false })
    .order("weekly_xp", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as ProfileRow[];
}

export async function xpEventsFor(
  userId: string,
  limit = 12,
): Promise<XpEventRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("xp_events")
    .select("*")
    .eq("developer_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as XpEventRow[];
}

export async function notificationsFor(
  userId: string,
  limit = 8,
): Promise<NotificationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("developer_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as NotificationRow[];
}

export async function unreadCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("developer_id", userId)
    .eq("read", false);
  if (error) throw error;
  return count ?? 0;
}

export async function hubActivity(limit = 12): Promise<ActivityRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_events")
    .select(
      "id, developer_id, kind, message, xp, reference_id, created_at, profiles:developer_id (full_name, handle)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const profile = (row.profiles ?? {}) as {
      full_name: string | null;
      handle: string | null;
    } | null;
    return {
      id: row.id as string,
      developer_id: row.developer_id as string,
      kind: row.kind as string,
      message: row.message as string,
      xp: row.xp as number | null,
      reference_id: row.reference_id as string | null,
      created_at: row.created_at as string,
      developer_name: profile?.full_name ?? null,
      developer_handle: profile?.handle ?? null,
    };
  });
}

export async function rankOf(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data: mine } = await supabase
    .from("profiles")
    .select("total_xp")
    .eq("id", userId)
    .single();
  if (!mine) return 0;
  const { count, error } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gt("total_xp", mine.total_xp as number);
  if (error) throw error;
  return (count ?? 0) + 1;
}
