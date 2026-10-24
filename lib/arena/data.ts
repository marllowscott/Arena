import { createClient } from "@/lib/supabase/server";
import {
  supportsHelperEmbed,
  supportsListingState,
  supportsProbeColumns,
} from "./schema";
import type { HelpStatus, PathwayIconName, PathwayId } from "@/lib/types";
import type { HelpRequestDetail } from "@/lib/services/contracts";

/* -------------------------------------------------------------------------- */
/* Row shapes â€” the live database columns, mapped to the app's needs.          */
/* -------------------------------------------------------------------------- */

export interface AssignmentRow {
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
  explain_prompt: string;
  broke_prompt: string;
  rubric: unknown[];
  recommendation_reason: string;
  recommended: boolean;
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
   focus: string;
   skills: string[];
   avatar_from: string;
   avatar_to: string;
   avatar_url: string | null;
   role: string;
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
  reviewer_name: string | null;
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
  listing_state: "draft" | "published" | "archived";
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

export interface InstructorXpAuditRow extends XpEventRow {
  developer_name: string | null;
  developer_handle: string | null;
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
  id: PathwayId;
  name: string;
  short_name: string;
  tagline: string;
  description: string;
  icon: PathwayIconName;
  sort_order: number;
  promise: string;
}

export async function listPathways(): Promise<PathwayRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pathways")
    .select("id, name, short_name, tagline, description, icon, sort_order, promise")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PathwayRow[];
}

export async function profileFor(userId: string): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, handle, full_name, headline, primary_pathway, total_xp, weekly_xp, streak_days, focus, skills, avatar_from, avatar_to, avatar_url, role, created_at, last_active_at",
    )
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as ProfileRow | null;
}

/* -------------------------------------------------------------------------- */
/* Challenges (Problems)                                                       */
/* -------------------------------------------------------------------------- */

export async function listOpenChallenges(): Promise<AssignmentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AssignmentRow[];
}

export async function listAllAssignments(): Promise<AssignmentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AssignmentRow[];
}

export async function getChallenge(id: string): Promise<AssignmentRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return (data ?? null) as AssignmentRow | null;
}

/**
 * The Arena links to problems by slug, so the detail route receives a slug
 * rather than the row id.
 */
export async function getChallengeBySlug(slug: string): Promise<AssignmentRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return null;
  return (data ?? null) as AssignmentRow | null;
}

/** Accepts either the row id or the URL slug. */
export async function findChallenge(idOrSlug: string): Promise<AssignmentRow | null> {
  const byId = await getChallenge(idOrSlug);
  if (byId) return byId;
  return getChallengeBySlug(idOrSlug);
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
  reviewer:profiles!submissions_reviewer_id_fkey (full_name),
  challenge:challenges (title),
  topic:teaching_proposals (title)
`;

function mapSubmission(row: Record<string, unknown>): SubmissionRow {
  const developer = (row.developer ?? {}) as {
    full_name: string | null;
    handle: string | null;
  } | null;
  const reviewer = (row.reviewer ?? {}) as { full_name: string | null } | null;
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
    reviewer_name: reviewer?.full_name ?? null,
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

export async function reviewedSubmissions(limit = 50): Promise<SubmissionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submissions")
    .select(SUBMISSION_SELECT)
    .neq("status", "pending")
    .order("reviewed_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as Array<Record<string, unknown>>).map(mapSubmission);
}

export async function mySubmissions(userId: string, limit = 20): Promise<SubmissionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submissions")
    .select(SUBMISSION_SELECT)
    .eq("developer_id", userId)
    .order("submitted_at", { ascending: false })
    .limit(limit);
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

const OPPORTUNITY_SELECT_BASE = `
  id, organisation, role, summary, type, location, apply_url, closes_at,
  verification, xp_reward, created_at, submitted_by, review_status,
  review_note, reviewed_at,
  submitter:profiles!opportunities_submitted_by_fkey (full_name, handle)
`;

const OPPORTUNITY_SELECT_WITH_STATE = `
  id, organisation, role, summary, type, location, apply_url, closes_at,
  verification, xp_reward, created_at, submitted_by, review_status,
  review_note, reviewed_at, listing_state,
  submitter:profiles!opportunities_submitted_by_fkey (full_name, handle)
`;

/** The widest select the deployment accepts for opportunities. */
export async function opportunitySelect(): Promise<string> {
  return (await supportsListingState())
    ? OPPORTUNITY_SELECT_WITH_STATE
    : OPPORTUNITY_SELECT_BASE;
}

/** Typed view of the select, so the query keeps its row shape. */
export type OpportunitySelect = typeof OPPORTUNITY_SELECT_WITH_STATE;

export async function opportunitySelectTyped(): Promise<OpportunitySelect> {
  return (await opportunitySelect()) as OpportunitySelect;
}

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
    listing_state: (row.listing_state as OpportunityRow["listing_state"] | null) ?? "published",
    submitter_name: submitter?.full_name ?? null,
    submitter_handle: submitter?.handle ?? null,
  };
}

export async function listOpportunities(): Promise<OpportunityRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select(await opportunitySelectTyped())
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return ((data ?? []) as Array<Record<string, unknown>>).map(mapOpportunity);
}

export async function pendingOpportunities(): Promise<OpportunityRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select(await opportunitySelectTyped())
    .eq("review_status", "pending")
    .not("submitted_by", "is", null)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Array<Record<string, unknown>>).map(mapOpportunity);
}

/* -------------------------------------------------------------------------- */
/* Persistent Probe/help                                                      */
/* -------------------------------------------------------------------------- */

interface HelpProfile {
  id: string;
  full_name: string | null;
  avatar_from: string | null;
  avatar_to: string | null;
}

interface HelpAnswerDbRow {
  id: string;
  author_id: string;
  body: string;
  confirmed: boolean;
  helpful_count: number;
  created_at: string;
  author: HelpProfile | HelpProfile[] | null;
}

interface HelpRequestDbRow {
  id: string;
  developer_id: string;
  title: string;
  body: string;
  status: HelpStatus;
  pathway_id: PathwayId | null;
  tags?: string[];
  technologies?: string[];
  urgency?: "normal" | "blocking";
  flagged?: boolean;
  flag_reason?: string | null;
  accepted_by?: string | null;
  accepted_at?: string | null;
  confirmed_answer_id?: string | null;
  created_at: string;
  asker: HelpProfile | HelpProfile[] | null;
  helper?: HelpProfile | HelpProfile[] | null;
  answers: HelpAnswerDbRow[] | null;
}

const HELP_REQUEST_BASE_COLUMNS = `
  id, developer_id, title, body, status, pathway_id, confirmed_answer_id, created_at
`;

const HELP_REQUEST_WORKFLOW_COLUMNS = `
  id, developer_id, title, body, status, pathway_id, tags, technologies,
  urgency, flagged, flag_reason, accepted_by, accepted_at, confirmed_answer_id,
  created_at
`;

const HELP_REQUEST_ASKER_EMBED =
  "asker:profiles!help_requests_developer_id_fkey (id, full_name, avatar_from, avatar_to)";

const HELP_REQUEST_HELPER_EMBED =
  "helper:profiles!help_requests_accepted_by_fkey (id, full_name, avatar_from, avatar_to)";

const HELP_REQUEST_ANSWERS_EMBED = `
  answers:help_answers (
    id, author_id, body, confirmed, helpful_count, created_at,
    author:profiles!help_answers_author_id_fkey (id, full_name, avatar_from, avatar_to)
  )
`;

/** The widest select the deployment accepts for help requests. */
export async function helpRequestSelect(): Promise<string> {
  const [hasWorkflowColumns, hasHelperEmbed] = await Promise.all([
    supportsProbeColumns(),
    supportsHelperEmbed(),
  ]);

  const columns = hasWorkflowColumns
    ? HELP_REQUEST_WORKFLOW_COLUMNS
    : HELP_REQUEST_BASE_COLUMNS;
  const helper = hasHelperEmbed ? `, ${HELP_REQUEST_HELPER_EMBED}` : "";

  return `${columns}, ${HELP_REQUEST_ASKER_EMBED}${helper}, ${HELP_REQUEST_ANSWERS_EMBED}`;
}

function firstRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function initialsForHelp(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "D";
}

function mapHelpRequest(
  row: HelpRequestDbRow,
  pathways: Map<string, PathwayRow>,
): HelpRequestDetail {
  const asker = firstRelation(row.asker);
  const helper = firstRelation(row.helper ?? null);
  const pathway = pathways.get(row.pathway_id ?? "");
  const developerName = asker?.full_name ?? "A developer";

  return {
    id: row.id,
    developerId: row.developer_id,
    developerName,
    developerInitials: initialsForHelp(developerName),
    developerAvatarFrom: asker?.avatar_from ?? "#241B12",
    developerAvatarTo: asker?.avatar_to ?? "#97A87A",
    title: row.title,
    body: row.body,
    status: row.status,
    pathwayId: row.pathway_id ?? pathway?.id ?? "builder",
    pathwayName: pathway?.name ?? row.pathway_id ?? "Builder",
    pathwayShortName: pathway?.short_name ?? row.pathway_id ?? "builder",
    pathwayIcon: pathway?.icon ?? "lifebuoy",
    mentorXpAwarded: false,
    tags: row.tags ?? [],
    technologies: row.technologies ?? [],
    urgency: row.urgency ?? "normal",
    createdAt: row.created_at,
    acceptedBy: row.accepted_by ?? null,
    acceptedAt: row.accepted_at ?? null,
    acceptedByName: helper?.full_name ?? null,
    acceptedByInitials: helper?.full_name ? initialsForHelp(helper.full_name) : null,
    acceptedByAvatarFrom: helper?.avatar_from ?? null,
    acceptedByAvatarTo: helper?.avatar_to ?? null,
    answers: (row.answers ?? [])
      .map((answer) => {
        const author = firstRelation(answer.author);
        const authorName = author?.full_name ?? "A developer";
        return {
          id: answer.id,
          authorId: answer.author_id,
          authorName,
          authorInitials: initialsForHelp(authorName),
          authorAvatarFrom: author?.avatar_from ?? "#241B12",
          authorAvatarTo: author?.avatar_to ?? "#97A87A",
          body: answer.body,
          confirmed: answer.confirmed,
          helpfulCount: answer.helpful_count,
          createdAt: answer.created_at,
        };
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    confirmedAnswerId: row.confirmed_answer_id ?? null,
    flagged: row.flagged ?? false,
    flagReason: row.flag_reason ?? null,
  };
}

export async function listHelpRequests(): Promise<HelpRequestDetail[]> {
  const supabase = await createClient();
  const pathwayRows = await listPathways();
  const pathways = new Map(pathwayRows.map((pathway) => [pathway.id, pathway]));
  const rows: HelpRequestDbRow[] = [];
  const pageSize = 250;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("help_requests")
      .select(await helpRequestSelect())
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    const page = (data ?? []) as unknown as HelpRequestDbRow[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  const requests = rows.map((row) => mapHelpRequest(row, pathways));
  if (requests.length === 0) return requests;

  const { data: awards, error: awardsError } = await supabase
    .from("xp_events")
    .select("reference_id")
    .eq("source", "help")
    .in("reference_id", requests.map((request) => request.id));
  if (awardsError) throw awardsError;
  const awardedIds = new Set(
    (awards ?? []).map((award) => award.reference_id).filter((id): id is string => id !== null),
  );
  return requests.map((request) => ({
    ...request,
    mentorXpAwarded: awardedIds.has(request.id),
  }));
}

export async function listFlaggedHelpRequests(): Promise<HelpRequestDetail[]> {
  /* Flagging arrives with the probe workflow migration. Without it there is
     nothing to moderate, and the moderation queue stays empty. */
  if (!(await supportsProbeColumns())) return [];

  const supabase = await createClient();
  const pathways = new Map((await listPathways()).map((pathway) => [pathway.id, pathway]));
  const { data, error } = await supabase
    .from("help_requests")
    .select(await helpRequestSelect())
    .eq("flagged", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown as HelpRequestDbRow[]).map((row) =>
    mapHelpRequest(row, pathways),
  );
}

export async function flaggedProbeCount(): Promise<number> {
  if (!(await supportsProbeColumns())) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("help_requests")
    .select("id", { count: "exact", head: true })
    .eq("flagged", true);
  if (error) throw error;
  return count ?? 0;
}

export async function getHelpRequest(id: string): Promise<HelpRequestDetail | null> {
  const supabase = await createClient();
  const pathways = new Map((await listPathways()).map((pathway) => [pathway.id, pathway]));
  const { data, error } = await supabase
    .from("help_requests")
    .select(await helpRequestSelect())
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { data: award, error: awardError } = await supabase
    .from("xp_events")
    .select("id")
    .eq("source", "help")
    .eq("reference_id", id)
    .maybeSingle();
  if (awardError) throw awardError;
  return {
    ...mapHelpRequest(data as unknown as HelpRequestDbRow, pathways),
    mentorXpAwarded: award !== null,
  };
}

export async function mentorXpFor(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pathway_xp")
    .select("xp")
    .eq("developer_id", userId)
    .eq("pathway_id", "mentor")
    .maybeSingle();
  if (error) throw error;
  return data?.xp ?? 0;
}

export async function getOpportunity(
  id: string,
): Promise<OpportunityRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select(await opportunitySelectTyped())
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
      "id, handle, full_name, headline, primary_pathway, total_xp, weekly_xp, streak_days, avatar_from, avatar_to, role, created_at, last_active_at",
    )
    .eq('role', 'developer')
    .gt('total_xp', 0)
    .order("total_xp", { ascending: false })
    .order("weekly_xp", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as ProfileRow[];
}

export interface BoardClaimRow {
  kind: string;
  activity_id: string;
  developer_id: string;
  claimed_at: string;
}

/** Every claim on the board. `activity_claims` is readable by everyone. */
export async function allClaims(): Promise<BoardClaimRow[]> {  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_claims")
    .select("kind, activity_id, developer_id, claimed_at")
    .order("claimed_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as BoardClaimRow[];
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

export async function recentXpEvents(limit = 50): Promise<InstructorXpAuditRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("xp_events")
    .select("id, developer_id, pathway_id, source, xp, label, detail, reference_id, created_at, developer:profiles!xp_events_developer_id_fkey (full_name, handle)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const developer = (row.developer ?? {}) as {
      full_name: string | null;
      handle: string | null;
    } | null;
    return {
      id: row.id as string,
      developer_id: row.developer_id as string,
      pathway_id: row.pathway_id as PathwayId,
      source: row.source as string,
      xp: row.xp as number,
      label: row.label as string,
      detail: row.detail as string,
      reference_id: row.reference_id as string | null,
      created_at: row.created_at as string,
      developer_name: developer?.full_name ?? null,
      developer_handle: developer?.handle ?? null,
    };
  });
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

/* -------------------------------------------------------------------------- */
/* Developer record counts                                                      */
/* -------------------------------------------------------------------------- */

/** Probe answers this developer wrote that the asker confirmed. */
export async function confirmedHelpAnswersBy(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("help_answers")
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId)
    .eq("confirmed", true);
  if (error) throw error;
  return count ?? 0;
}

/** Topic proposals this developer submitted to the instructor. */
export async function topicsProposedBy(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("teaching_proposals")
    .select("id", { count: "exact", head: true })
    .eq("proposed_by", userId);
  if (error) throw error;
  return count ?? 0;
}

/** Probe answers written by this developer, confirmed or not. */
export async function helpAnswersBy(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("help_answers")
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId);
  if (error) throw error;
  return count ?? 0;
}
