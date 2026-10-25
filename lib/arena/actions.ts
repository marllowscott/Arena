"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isInstructor, requireInstructor, requireSession } from "./session";
import { supportsListingState, supportsProbeColumns } from "./schema";
import type { SubmissionRow } from "./data";
import type { PathwayId } from "@/lib/types";
import {
  deleteAnnouncement as deleteHubAnnouncementRecord,
  readHubAnnouncements,
  saveAnnouncement as saveHubAnnouncementRecord,
  saveHubSettings as persistHubSettings,
} from "./hub";

const PROFILE_AVATAR_BUCKET = "PROFILES";

export interface ActionResult {
  ok?: boolean;
  error?: string;
  info?: string;
}

/**
 * Turn a raw database refusal into something an instructor can act on.
 *
 * The deployed database does not yet carry every migration this app targets:
 * the probe workflow (0002) and the instructor workflows (0010) are still
 * pending. Those refusals surface as row-level security errors, missing
 * columns, check-constraint failures, or a function that is not in the
 * schema cache. Naming the missing piece beats echoing SQL.
 */
function explainDbError(
  error: { code?: string; message: string },
  context: string,
): string {
  const code = String(error.code ?? "");
  const message = error.message ?? "";

  if (code === "42501" || /row-level security/i.test(message)) {
    return `${context} is refused by this deployment's access rules. The instructor-workflows migration (0010) has to be applied before the database will allow it.`;
  }
  if (code === "42703" || /Could not find the .* column|schema cache/i.test(message)) {
    return `${context} needs the probe-workflow migration (0002) before this deployment can store it.`;
  }
  if (code === "23514") {
    return `${context} is not one of the states this deployment allows. The instructor-workflows migration (0010) extends the allowed states.`;
  }
  if (code === "PGRST202" || /Could not find the function/i.test(message)) {
    return `${context} is not available on this deployment yet. It arrives with the pending database migration.`;
  }
  return message;
}

/* -------------------------------------------------------------------------- */
/* Authentication                                                              */
/* -------------------------------------------------------------------------- */

export async function login(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const message = String(error.message).toLowerCase();
    if (message.includes("not confirmed")) {
      return { error: "Confirm your email first, then log in." };
    }
    if (message.includes("too many") || message.includes("rate limit")) {
      return { error: "Too many attempts. Wait a minute and try again." };
    }
    if (
      message.includes("invalid credentials") ||
      message.includes("invalid login")
    ) {
      return { error: "Invalid email or password." };
    }
    /* Anything else is surfaced as-is so the real cause
       (Supabase configuration, network, and so on) is
       visible instead of hidden behind a generic line. */
    return { error: `Login failed: ${String(error.message)}` };
  }

  /* Role-based redirect: instructors to /instructor, developers to / */
  const instructor = await isInstructor(data.user!.id);
  redirect(instructor ? "/instructor" : "/");
}

export async function signup(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const handle = String(formData.get("handle") ?? "").trim();

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || email.split("@")[0],
        ...(handle ? { handle } : {}),
      },
    },
  });

  if (error) {
    const message = String(error.message).toLowerCase();
    if (message.includes("already registered")) {
      return { error: "An account with this email already exists. Log in instead." };
    }
    if (message.includes("rate limit")) {
      return {
        error:
          "Supabase is rate-limiting email sends. In the Supabase dashboard go to Authentication → Settings, turn OFF 'Enable email confirmation', save, then try again.",
      };
    }
    return { error: `Signup failed: ${String(error.message)}` };
  }

  if (!data.user || !data.session) {
    return {
      info: "Check your email to confirm your account, then log in. If the email never arrives, turn off 'Enable email confirmation' in the Supabase dashboard (Authentication → Settings).",
    };
  }

  /* Role-based redirect: instructors to /instructor, developers to / */
  const instructor = await isInstructor(data.user!.id);
  redirect(instructor ? "/instructor" : "/");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const handle = String(formData.get("handle") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim();
  const focus = String(formData.get("focus") ?? "").trim();
  const primaryPathway = String(formData.get("primaryPathway") ?? "").trim();
  const skills = String(formData.get("skills") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!fullName) return { error: "Full name is required." };
  if (handle && !/^[a-z0-9-]{2,40}$/.test(handle)) {
    return { error: "Handle must be 2-40 lowercase letters, numbers, or hyphens." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      ...(handle ? { handle } : {}),
      headline,
      focus,
      skills,
      ...(primaryPathway ? { primary_pathway: primaryPathway } : {}),
    })
    .eq("id", session.userId);

  if (error) {
    if (String(error.code) === "23505") {
      return { error: "That handle is already taken." };
    }
    return { error: `Could not update profile (${error.code}): ${error.message}` };
  }

  revalidatePath("/profile");
  revalidatePath("/instructor/profile");
  return { ok: true, info: "Profile updated." };
}

/* -------------------------------------------------------------------------- */
/* Instructor-managed developer accounts                                      */
/* -------------------------------------------------------------------------- */

const DEVELOPER_PATHWAYS: PathwayId[] = [
  "builder",
  "problem-solver",
  "teacher",
  "mentor",
  "scout",
];

export async function inviteDeveloper(formData: FormData): Promise<ActionResult> {
  await requireInstructor();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const handle = String(formData.get("handle") ?? "").trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (email.split("@")[1] === "uncommon.org") {
    return { error: "That email domain is reserved for instructor accounts." };
  }
  if (!fullName || fullName.length > 100) {
    return { error: "Enter a name no longer than 100 characters." };
  }
  if (handle && !/^[a-z0-9][a-z0-9_-]{1,29}$/.test(handle)) {
    return { error: "Handle must be 2–30 characters using letters, numbers, _ or -." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName,
      ...(handle ? { handle } : {}),
    },
  });
  if (error) return { error: `Could not invite developer: ${error.message}` };

  revalidatePath("/instructor/developers");
  return {
    ok: true,
    info: `Invitation sent to ${email}. Their developer profile was created automatically.`,
  };
}

export async function updateDeveloper(
  developerId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireInstructor();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const handle = String(formData.get("handle") ?? "").trim().toLowerCase();
  const headline = String(formData.get("headline") ?? "").trim();
  const primaryPathway = String(formData.get("primaryPathway") ?? "");

  if (!developerId) return { error: "Unknown developer." };
  if (!fullName || fullName.length > 100) {
    return { error: "Enter a name no longer than 100 characters." };
  }
  if (!/^[a-z0-9][a-z0-9_-]{1,29}$/.test(handle)) {
    return { error: "Handle must be 2–30 characters using letters, numbers, _ or -." };
  }
  if (headline.length > 160) {
    return { error: "Headline must be 160 characters or fewer." };
  }
  const pathway = DEVELOPER_PATHWAYS.find((candidate) => candidate === primaryPathway);
  if (!pathway) {
    return { error: "Choose a valid pathway." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({
      full_name: fullName,
      handle,
      headline,
      primary_pathway: pathway,
    })
    .eq("id", developerId)
    .eq("role", "developer")
    .select("id")
    .maybeSingle();

  if (error) return { error: `Could not update developer: ${error.message}` };
  if (!data) return { error: "Developer not found or no longer has developer access." };

  revalidatePath("/instructor/developers");
  revalidatePath("/");
  return { ok: true, info: "Developer profile updated." };
}

export async function deleteDeveloper(developerId: string): Promise<ActionResult> {
  const instructor = await requireInstructor();

  if (!developerId || developerId === instructor.userId) {
    return { error: "You cannot delete your own account." };
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", developerId)
    .maybeSingle();

  if (profileError) {
    return { error: `Could not verify developer account: ${profileError.message}` };
  }
  if (!profile || profile.role !== "developer") {
    return { error: "Developer not found or account is not a developer." };
  }

  const { error } = await admin.auth.admin.deleteUser(developerId);
  if (error) return { error: `Could not delete developer account: ${error.message}` };

  revalidatePath("/instructor/developers");
  revalidatePath("/");
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Claims — "I am taking responsibility for this activity"                     */
/* -------------------------------------------------------------------------- */

export async function claim(
  kind: "challenge" | "topic",
  activityId: string,
): Promise<ActionResult> {
  const session = await requireSession();
  const supabase = await createClient();

  if (await isInstructor(session.userId)) {
    return { error: "Instructor accounts cannot claim developer activities." };
  }

  const { data: claimed, error } = await supabase.rpc("claim_activity", {
    p_kind: kind,
    p_activity_id: activityId,
  });
  if (error) return { error: error.message };
  if (!claimed) return { info: "This activity has already been claimed." };
  return { ok: true };
}

export async function unclaim(
  kind: "challenge" | "topic",
  activityId: string,
): Promise<ActionResult> {
  const session = await requireSession();
  if (await isInstructor(session.userId)) {
    return { error: "Instructor accounts cannot change developer claims." };
  }
  const supabase = await createClient();

  const { error } = await supabase
    .from("activity_claims")
    .delete()
    .eq("kind", kind)
    .eq("activity_id", activityId)
    .eq("developer_id", session.userId);

  if (error) return { error: "Could not remove the claim." };
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Problem submissions — XP is suggested by the problem row, never the form    */
/* -------------------------------------------------------------------------- */

export async function submitProblem(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  if (await isInstructor(session.userId)) {
    return { error: "Instructor accounts cannot submit developer solutions." };
  }
  const challengeId = String(formData.get("challengeId") ?? "");
  const solution = String(formData.get("solution") ?? "").trim();
  const evidence = String(formData.get("evidence") ?? "");
  const explainIt = String(formData.get("explainIt") ?? "").trim();
  const whatBroke = String(formData.get("whatBroke") ?? "").trim();
  const howFixed = String(formData.get("howFixed") ?? "").trim();

  if (!challengeId) return { error: "Unknown problem." };
  if (!solution) return { error: "Describe what you discovered and changed." };
  if (!explainIt) return { error: "Explain how your solution works." };

  const supabase = await createClient();

  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .select("xp, status")
    .eq("id", challengeId)
    .single();
  if (challengeError || !challenge) return { error: "Unknown problem." };
  if (challenge.status !== "open") {
    return { error: "This problem is closed to new submissions." };
  }

  /* The claim is the smallest mechanism the schema supports: you submit
     evidence for a problem you took responsibility for. */
  const { data: existingClaim, error: claimError } = await supabase
    .from("activity_claims")
    .select("claimed_at")
    .eq("kind", "challenge")
    .eq("activity_id", challengeId)
    .eq("developer_id", session.userId)
    .single();
  if (claimError || !existingClaim) {
    return { error: "Claim this problem before submitting your solution." };
  }

  const evidenceLinks = evidence
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6);

  const { error } = await supabase.from("submissions").insert({
    challenge_id: challengeId,
    developer_id: session.userId,
    solution,
    evidence: evidenceLinks,
    explain_it: explainIt,
    what_broke: whatBroke,
    how_fixed: howFixed,
    suggested_xp: challenge.xp as number,
  });

  if (error) return { error: "Could not submit. Please try again." };
  return { ok: true, info: "Submitted. The instructor reviews it next — XP is awarded only on approval." };
}

/* -------------------------------------------------------------------------- */
/* Topic presentations — same review artifact, paid in the teacher pathway     */
/* -------------------------------------------------------------------------- */

export async function presentTopic(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  if (await isInstructor(session.userId)) {
    return { error: "Instructor accounts cannot submit developer presentations." };
  }
  const topicId = String(formData.get("topicId") ?? "");
  const solution = String(formData.get("solution") ?? "").trim();
  const evidence = String(formData.get("evidence") ?? "");

  if (!topicId) return { error: "Unknown topic." };
  if (!solution)
    return { error: "Summarise what you prepared and the key points." };

  const supabase = await createClient();

  const { data: topic, error: topicError } = await supabase
    .from("teaching_proposals")
    .select("xp_reward, status")
    .eq("id", topicId)
    .single();
  if (topicError || !topic) return { error: "Unknown topic." };
  if (topic.status === "draft" || topic.status === "archived") {
    return { error: "This topic is not currently available for presentations." };
  }

  const { data: existingClaim, error: claimError } = await supabase
    .from("activity_claims")
    .select("claimed_at")
    .eq("kind", "topic")
    .eq("activity_id", topicId)
    .eq("developer_id", session.userId)
    .single();
  if (claimError || !existingClaim) {
    return { error: "Claim this topic before presenting it." };
  }

  const { data: prior, error: priorError } = await supabase
    .from("submissions")
    .select("id, status")
    .eq("topic_id", topicId)
    .eq("developer_id", session.userId)
    .order("submitted_at", { ascending: false })
    .limit(1);
  if (!priorError && prior && prior.length > 0) {
    const latest = prior[0] as { status: string };
    if (latest.status === "pending") {
      return { info: "Your presentation is already waiting for review." };
    }
  }

  const evidenceLinks = evidence
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6);

  const { error } = await supabase.from("submissions").insert({
    topic_id: topicId,
    developer_id: session.userId,
    solution,
    evidence: evidenceLinks,
    explain_it: solution,
    suggested_xp: topic.xp_reward as number,
  });

  if (error) return { error: "Could not submit your presentation." };
  return { ok: true, info: "Presentation submitted. XP is awarded when the instructor approves it." };
}

/* -------------------------------------------------------------------------- */
/* Opportunity submissions                                                     */
/* -------------------------------------------------------------------------- */

export async function submitOpportunity(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession();
  if (await isInstructor(session.userId)) {
    return { error: "Instructor accounts cannot submit developer opportunities." };
  }
  const organisation = String(formData.get("organisation") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim();
  const type = String(formData.get("type") ?? "job").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!organisation) return { error: "Organisation is required." };
  if (!role) return { error: "The role or title is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("opportunities").insert({
    organisation,
    role,
    summary: description || `${role} at ${organisation}.`,
    type,
    apply_url: link,
    submitted_by: session.userId,
    review_status: "pending",
  });

  if (error) return { error: explainDbError(error, "Submitting an opportunity") };
  return { ok: true, info: "Submitted. The instructor verifies it before it earns XP." };
}

/* -------------------------------------------------------------------------- */
/* Persistent Probe/help                                                      */
/* -------------------------------------------------------------------------- */

const PROBE_PATHWAYS = new Set(["builder", "problem-solver", "teacher", "mentor", "scout"]);

function parseProbeTags(value: FormDataEntryValue | null): string[] {
  return [...new Set(
    String(value ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  )];
}

export async function createProbe(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  if (await isInstructor(session.userId)) {
    return { error: "Instructor accounts cannot create developer probes." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const pathwayId = String(formData.get("pathwayId") ?? "");
  const urgency = String(formData.get("urgency") ?? "normal");
  const tags = parseProbeTags(formData.get("tags"));
  const technologies = parseProbeTags(formData.get("technologies"));

  if (title.length < 5 || title.length > 120) {
    return { error: "Title must be between 5 and 120 characters." };
  }
  if (body.length < 20 || body.length > 5000) {
    return { error: "Describe the problem in 20 to 5000 characters." };
  }
  if (!PROBE_PATHWAYS.has(pathwayId)) {
    return { error: "Choose a valid pathway." };
  }
  if (urgency !== "normal" && urgency !== "blocking") {
    return { error: "Choose a valid urgency." };
  }
  if (tags.length > 8 || tags.some((tag) => tag.length > 40)) {
    return { error: "Use up to 8 tags, each no longer than 40 characters." };
  }
  if (technologies.length > 8 || technologies.some((tag) => tag.length > 40)) {
    return { error: "Use up to 8 technologies, each no longer than 40 characters." };
  }

  const supabase = await createClient();

  /* The workflow columns (urgency, tags, technologies, flagged) arrive with
     the probe migration. Write only what this deployment holds. */
  const values: Record<string, unknown> = {
    developer_id: session.userId,
    title,
    body,
    pathway_id: pathwayId,
    status: "open",
  };
  if (await supportsProbeColumns()) {
    values.urgency = urgency;
    values.tags = tags;
    values.technologies = technologies;
    values.flagged = false;
  }

  const { data, error } = await supabase
    .from("help_requests")
    .insert(values)
    .select("id")
    .single();
  if (error) return { error: explainDbError(error, "Creating a Probe") };

  revalidatePath("/probe");
  return { ok: true, info: "Problem reported." };
}

export async function acceptProbe(requestId: string): Promise<ActionResult> {
  const session = await requireSession();
  if (await isInstructor(session.userId)) {
    return { error: "Instructor accounts cannot accept developer probes." };
  }
  if (!requestId) return { error: "Probe not found." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_probe", { p_request_id: requestId });
  if (error) return { error: explainDbError(error, "Accepting a Probe") };

  revalidatePath("/probe");
  revalidatePath(`/probe/${requestId}`);
  return { ok: true, info: "You are now helping with this Probe." };
}

export async function releaseProbe(requestId: string): Promise<ActionResult> {
  const session = await requireSession();
  if (await isInstructor(session.userId)) {
    return { error: "Instructor accounts cannot release developer probes." };
  }
  if (!requestId) return { error: "Probe not found." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("release_probe", { p_request_id: requestId });
  if (error) return { error: explainDbError(error, "Releasing a Probe") };

  revalidatePath("/probe");
  revalidatePath(`/probe/${requestId}`);
  return { ok: true, info: "Probe released back to the board." };
}

export async function respondToProbe(
  requestId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession();
  if (await isInstructor(session.userId)) {
    return { error: "Instructor accounts cannot answer developer probes." };
  }
  const body = String(formData.get("body") ?? "").trim();
  if (!requestId) return { error: "Probe not found." };
  if (body.length < 20 || body.length > 5000) {
    return { error: "Answer must be between 20 and 5000 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("help_answers").insert({
    request_id: requestId,
    author_id: session.userId,
    body,
  });
  if (error) return { error: explainDbError(error, "Posting an answer") };

  revalidatePath(`/probe/${requestId}`);
  revalidatePath("/probe");
  return { ok: true, info: "Answer posted." };
}

export async function confirmProbeAnswer(
  requestId: string,
  answerId: string,
): Promise<ActionResult> {
  const session = await requireSession();
  if (await isInstructor(session.userId)) {
    return { error: "Instructor accounts cannot confirm developer probe answers." };
  }
  if (!requestId || !answerId) return { error: "Choose an answer on this Probe." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_probe_answer", {
    p_request_id: requestId,
    p_answer_id: answerId,
  });
  if (error) return { error: explainDbError(error, "Confirming an answer") };

  revalidatePath(`/probe/${requestId}`);
  revalidatePath("/probe");
  return { ok: true, info: "Answer confirmed. The helper received 8 Mentor XP." };
}

export async function flagProbe(
  requestId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession();
  if (await isInstructor(session.userId)) {
    return { error: "Instructor accounts review reports; only developers can report probes." };
  }
  const reason = String(formData.get("reason") ?? "").trim();
  if (!requestId) return { error: "Probe not found." };
  if (reason.length < 5 || reason.length > 1000) {
    return { error: "Explain the privacy concern in 5 to 1000 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("flag_probe", {
    p_request_id: requestId,
    p_reason: reason,
  });
  if (error) return { error: explainDbError(error, "Reporting a Probe") };

  revalidatePath("/probe");
  revalidatePath(`/probe/${requestId}`);
  revalidatePath("/instructor/probes");
  revalidatePath("/instructor");
  return { ok: true, info: "Reported privately to the instructor." };
}

export async function deleteProblemReport(requestId: string): Promise<ActionResult> {
  await requireInstructor();
  if (!requestId.trim()) return { error: "Unknown report." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("help_requests")
    .delete()
    .eq("id", requestId);
  if (error) {
    return { error: `Could not delete report (${error.code}): ${error.message}` };
  }

  revalidatePath("/instructor/probes");
  revalidatePath("/instructor");
  return { ok: true, info: "Report deleted." };
}

export async function moderateProbe(
  requestId: string,
  flagged: boolean,
  reason = "",
): Promise<ActionResult> {
  await requireInstructor();
  const cleanReason = reason.trim();
  if (!requestId) return { error: "Probe not found." };
  if (flagged && (cleanReason.length < 5 || cleanReason.length > 1000)) {
    return { error: "A moderation reason must be 5 to 1000 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("moderate_probe", {
    p_request_id: requestId,
    p_flagged: flagged,
    p_reason: flagged ? cleanReason : null,
  });
  if (error) return { error: explainDbError(error, "Moderating a Probe") };

  revalidatePath("/instructor/probes");
  revalidatePath("/probe");
  revalidatePath(`/probe/${requestId}`);
  revalidatePath("/instructor");
  return {
    ok: true,
    info: flagged ? "Probe remains restricted pending review." : "Probe is no longer flagged.",
  };
}

/* -------------------------------------------------------------------------- */
/* Instructor: content and review authority                                    */
/* -------------------------------------------------------------------------- */

const PROBLEM_PATHWAYS = ["builder", "problem-solver", "teacher", "mentor", "scout"];
const PROBLEM_DIFFICULTIES = ["starter", "builder", "advanced", "expert", "boss"];
const PROBLEM_STATUSES = ["open", "locked", "closed", "draft"];

function problemFromForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const slug =
    String(formData.get("slug") ?? "").trim() ||
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
  const codename = String(formData.get("codename") ?? "").trim() || title;
  const summary = String(formData.get("summary") ?? "").trim();
  const mission = String(formData.get("mission") ?? "").trim();
  const pathwayId = String(formData.get("pathwayId") ?? "builder");
  const difficulty = String(formData.get("difficulty") ?? "starter");
  const xp = Number(formData.get("xp") ?? 0);
  const effort = String(formData.get("effort") ?? "1 hour").trim();
  const deadlineInput = String(formData.get("deadline") ?? "").trim();
  const status = String(formData.get("status") ?? "open");
  const whyItMatters = String(formData.get("whyItMatters") ?? "").trim();
  const splitLines = (name: string) =>
    String(formData.get(name) ?? "")
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  let deadline: string | null = null;
  if (deadlineInput) {
    const parsedDeadline = new Date(deadlineInput);
    if (Number.isNaN(parsedDeadline.getTime())) {
      return { error: "Enter a valid deadline." } as const;
    }
    deadline = parsedDeadline.toISOString();
  }

  let rubric: unknown[] = [];
  const rubricInput = String(formData.get("rubric") ?? "").trim();
  if (rubricInput) {
    try {
      const parsedRubric: unknown = JSON.parse(rubricInput);
      if (!Array.isArray(parsedRubric)) {
        return { error: "Rubric must be a JSON array." } as const;
      }
      rubric = parsedRubric;
    } catch {
      return { error: "Rubric must be valid JSON." } as const;
    }
  }

  if (!title) return { error: "A title is required." };
  if (!summary || !mission) return { error: "Summary and mission are required." };
  if (!slug) return { error: "A URL slug is required." };
  if (!PROBLEM_PATHWAYS.includes(pathwayId)) return { error: "Choose a valid pathway." };
  if (!PROBLEM_DIFFICULTIES.includes(difficulty)) return { error: "Choose a valid difficulty." };
  if (!PROBLEM_STATUSES.includes(status)) return { error: "Choose a valid status." };
  if (!Number.isInteger(xp) || xp < 5 || xp > 1000) {
    return { error: "XP must be a whole number between 5 and 1000." };
  }

  return {
    data: {
      slug,
      title,
      codename,
      summary,
      pathway_id: pathwayId,
      difficulty,
      xp,
      estimated_effort: effort || "1 hour",
      deadline,
      status,
      tags,
      mission,
      why_it_matters: whyItMatters,
      requirements: splitLines("requirements"),
      evidence: splitLines("evidence"),
      explain_prompt: String(formData.get("explainPrompt") ?? "").trim(),
      broke_prompt: String(formData.get("brokePrompt") ?? "").trim(),
      rubric,
      recommendation_reason: String(formData.get("recommendationReason") ?? "").trim(),
      recommended: formData.get("recommended") === "on",
    },
  } as const;
}

export async function createAssignment(formData: FormData): Promise<ActionResult> {
  await requireInstructor();
  const parsed = problemFromForm(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  const { error } = await supabase.from("challenges").insert(parsed.data);

  if (error) {
    if (String(error.code) === "23505") {
      return { error: "A problem with that URL slug already exists." };
    }
    return {
      error: `Problem publication failed (${error.code}): ${error.message}`,
    };
  }
  return { ok: true, info: "Problem published to the Arena." };
}

export async function updateAssignment(id: string, formData: FormData): Promise<ActionResult> {
  await requireInstructor();
  if (!id.trim()) return { error: "Unknown problem." };
  const parsed = problemFromForm(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  const { error } = await supabase.from("challenges").update(parsed.data).eq("id", id);
  if (error) {
    if (error.code === "23505") return { error: "A problem with that URL slug already exists." };
    return { error: `Could not update problem (${error.code}): ${error.message}` };
  }

  revalidatePath("/instructor/assignments");
  revalidatePath("/arena");
  revalidatePath("/arena/[assignmentId]", "page");
  return { ok: true, info: "Problem updated." };
}

export async function deleteAssignment(id: string): Promise<ActionResult> {
  await requireInstructor();
  if (!id.trim()) return { error: "Unknown problem." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("challenges")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) {
    return { error: `Could not delete problem (${error.code}): ${error.message}` };
  }
  if (!data) {
    return {
      error:
        "Problem was not deleted. It may already be gone, or the instructor delete permission is missing in Supabase. Apply migration 0009_instructor_problem_crud.sql and try again.",
    };
  }

  revalidatePath("/instructor/assignments");
  revalidatePath("/arena");
  revalidatePath("/arena/[assignmentId]", "page");
  return { ok: true, info: "Problem deleted." };
}

export async function createTopic(formData: FormData): Promise<ActionResult> {
  const instructor = await requireInstructor();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const pathwayId = String(formData.get("pathwayId") ?? "teacher");
  const xpReward = Number(formData.get("xpReward") ?? 40);
  const status = String(formData.get("status") ?? "open");
  const pathways: PathwayId[] = ["builder", "problem-solver", "teacher", "mentor", "scout"];
  const pathway = pathways.find((candidate) => candidate === pathwayId);

  if (!title || title.length > 200) {
    return { error: "Topic title is required and must be 200 characters or fewer." };
  }
  if (!summary || summary.length > 5000) {
    return { error: "Topic summary is required and must be 5,000 characters or fewer." };
  }
  if (!pathway) {
    return { error: "Choose a valid pathway." };
  }
  if (!Number.isInteger(xpReward) || xpReward < 5 || xpReward > 500) {
    return { error: "XP reward must be a whole number between 5 and 500." };
  }
  if (status !== "open" && status !== "draft") {
    return { error: "Choose whether to publish or save this topic as a draft." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("teaching_proposals").insert({
    title,
    pathway_id: pathway,
    proposed_by: instructor.userId,
    summary,
    outcomes: ["Presentation reviewed by the instructor"],
    xp_reward: xpReward,
    status,
  });

  if (error) return { error: explainDbError(error, "Creating a topic") };
  revalidatePath("/instructor/topics");
  revalidatePath("/topics");
  return {
    ok: true,
    info:
      status === "draft"
        ? "Topic saved as a draft. Developers cannot see it until you publish it."
        : "Topic published. Developers can claim and present it.",
  };
}

export async function updateTopic(
  topicId: string,
  formData: FormData,
): Promise<ActionResult> {
  const instructor = await requireInstructor();

  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const pathwayId = String(formData.get("pathwayId") ?? "");
  const xpReward = Number(formData.get("xpReward"));
  const status = String(formData.get("status") ?? "");
  const outcomes = String(formData.get("outcomes") ?? "")
    .split("\n")
    .map((outcome) => outcome.trim())
    .filter(Boolean)
    .slice(0, 20);
  const sessionDateInput = String(formData.get("sessionDate") ?? "").trim();
  const pathways: PathwayId[] = ["builder", "problem-solver", "teacher", "mentor", "scout"];
  const pathway = pathways.find((candidate) => candidate === pathwayId);
  const statuses = ["draft", "open", "scheduled", "delivered", "archived"] as const;
  const validStatus = statuses.find((candidate) => candidate === status);
  const sessionDate = sessionDateInput ? new Date(sessionDateInput) : null;

  if (!topicId) return { error: "Unknown topic proposal." };
  if (!title || title.length > 200) {
    return { error: "Topic title is required and must be 200 characters or fewer." };
  }
  if (!summary || summary.length > 5000) {
    return { error: "Topic summary is required and must be 5,000 characters or fewer." };
  }
  if (!pathway) return { error: "Choose a valid pathway." };
  if (!Number.isInteger(xpReward) || xpReward < 5 || xpReward > 500) {
    return { error: "XP reward must be between 5 and 500." };
  }
  if (!validStatus) return { error: "Choose a valid topic status." };
  if (sessionDateInput && (!sessionDate || Number.isNaN(sessionDate.getTime()))) {
    return { error: "Enter a valid session date and time." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teaching_proposals")
    .update({
      title,
      summary,
      pathway_id: pathway,
      xp_reward: xpReward,
      status: validStatus,
      outcomes,
      session_date: sessionDate?.toISOString() ?? null,
      reviewed_by: instructor.userId,
    })
    .eq("id", topicId)
    .select("id")
    .maybeSingle();

  if (error) return { error: explainDbError(error, "Updating a topic") };
  if (!data) {
    return {
      error: "Topic was not updated. It may have been deleted or instructor edit permission is missing.",
    };
  }

  revalidatePath("/instructor/topics");
  revalidatePath("/topics");
  revalidatePath("/teach");
  return { ok: true, info: "Topic updated." };
}

export async function deleteTopic(topicId: string): Promise<ActionResult> {
  await requireInstructor();
  if (!topicId.trim()) return { error: "Unknown topic." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teaching_proposals")
    .delete()
    .eq("id", topicId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: `Could not delete topic (${error.code}): ${error.message}` };
  }
  if (!data) {
    return {
      error:
        "Topic was not deleted. It may already be gone or require migration 0010_instructor_workflows.sql for instructor delete permission.",
    };
  }

  revalidatePath("/instructor/topics");
  revalidatePath("/topics");
  revalidatePath("/teach");
  return { ok: true, info: "Topic deleted." };
}

export async function proposeTopic(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  if (await isInstructor(session.userId)) {
    return { error: "Only developer accounts can propose topics." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const pathwayId = String(formData.get("pathwayId") ?? "");
  const pathways: PathwayId[] = ["builder", "problem-solver", "teacher", "mentor", "scout"];
  const pathway = pathways.find((candidate) => candidate === pathwayId);

  if (title.length < 6 || title.length > 200) {
    return { error: "Topic title must be between 6 and 200 characters." };
  }
  if (summary.length < 20 || summary.length > 5000) {
    return { error: "Topic summary must be between 20 and 5,000 characters." };
  }
  if (!pathway) {
    return { error: "Choose a valid pathway." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("teaching_proposals")
    .insert({
      title,
      pathway_id: pathway,
      proposed_by: session.userId,
      summary,
      outcomes: [],
      status: "draft",
      xp_reward: 60,
    })
    .select("id")
    .single();

  if (error) return { error: explainDbError(error, "Submitting a topic proposal") };
  if (!data) return { error: "The topic proposal was not saved. Please try again." };

  revalidatePath("/topics");
  revalidatePath("/instructor/topics");
  return { ok: true, info: "Topic proposal sent to the instructor for review." };
}

export async function reviewSubmission(
  submissionId: string,
  status: "approved" | "adjusted" | "returned",
  awardedXp: number,
  note: string,
): Promise<ActionResult> {
  const instructor = await requireInstructor();

  if (!submissionId) return { error: "Unknown submission." };
  if (!["approved", "adjusted", "returned"].includes(status)) {
    return { error: "Choose a valid review outcome." };
  }
  const xp = Number(awardedXp);
  if (
    (status === "approved" || status === "adjusted") &&
    (!Number.isInteger(xp) || xp < 1 || xp > 1000)
  ) {
    return { error: "Approval must award between 1 and 1,000 whole XP." };
  }
  if (note.length > 1000) {
    return { error: "The reviewer note must be 1,000 characters or fewer." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("review_submission", {
    p_submission_id: submissionId,
    p_reviewer_id: instructor.userId,
    p_status: status,
    p_awarded_xp: status === "returned" ? 0 : xp,
    p_note: note.trim(),
  });

  if (error) return { error: explainDbError(error, "Reviewing a submission") };
  revalidatePath("/instructor/review-queue");
  revalidatePath("/instructor");
  revalidatePath("/");
  revalidatePath("/leaderboard");
  return {
    ok: true,
    info:
      status === "returned"
        ? "Returned for another pass. No XP awarded."
        : `Approved. ${xp} XP awarded.`,
  };
}

export async function updateInstructorSubmission(
  submissionId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireInstructor();
  if (!submissionId.trim()) return { error: "Unknown submission." };

  const solution = String(formData.get("solution") ?? "").trim();
  const evidence = String(formData.get("evidence") ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const explainIt = String(formData.get("explainIt") ?? "").trim();
  const whatBroke = String(formData.get("whatBroke") ?? "").trim();
  const howFixed = String(formData.get("howFixed") ?? "").trim();

  if (!solution || solution.length > 20000) {
    return { error: "Solution is required and must be 20,000 characters or fewer." };
  }
  if (!explainIt || explainIt.length > 10000) {
    return { error: "Explanation is required and must be 10,000 characters or fewer." };
  }
  if (evidence.length > 20 || evidence.some((item) => item.length > 2000)) {
    return { error: "Use at most 20 evidence links or notes, each 2,000 characters or fewer." };
  }
  if (whatBroke.length > 10000 || howFixed.length > 10000) {
    return { error: "Each troubleshooting field must be 10,000 characters or fewer." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("instructor_update_submission", {
    p_submission_id: submissionId,
    p_solution: solution,
    p_evidence: evidence,
    p_explain_it: explainIt,
    p_what_broke: whatBroke,
    p_how_fixed: howFixed,
  });
  if (error) return { error: explainDbError(error, "Updating a submission") };

  revalidatePath("/instructor/review-queue");
  revalidatePath("/");
  revalidatePath("/arena");
  revalidatePath("/teach");
  return { ok: true, info: "Submission updated." };
}

export async function deleteInstructorSubmission(
  submissionId: string,
): Promise<ActionResult> {
  await requireInstructor();
  if (!submissionId.trim()) return { error: "Unknown submission." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("instructor_delete_submission", {
    p_submission_id: submissionId,
  });
  if (error) return { error: explainDbError(error, "Deleting a submission") };

  revalidatePath("/instructor/review-queue");
  revalidatePath("/instructor");
  revalidatePath("/");
  revalidatePath("/arena");
  revalidatePath("/teach");
  revalidatePath("/leaderboard");
  return {
    ok: true,
    info: "Submission deleted. Any XP already awarded remains in the XP history.",
  };
}

export async function reviewOpportunity(
  opportunityId: string,
  decision: "approve" | "reject",
  awardedXp: number,
  note: string,
): Promise<ActionResult> {
  await requireInstructor();

  if (!opportunityId.trim()) return { error: "Unknown opportunity." };
  if (decision !== "approve" && decision !== "reject") {
    return { error: "Choose a valid verification decision." };
  }
  const xp = Number(awardedXp);
  if (!Number.isInteger(xp) || xp < 0 || xp > 500) {
    return { error: "Verification XP must be a whole number between 0 and 500." };
  }
  if (decision === "reject" && xp !== 0) {
    return { error: "Rejected opportunities cannot award XP." };
  }
  if (note.length > 1000) {
    return { error: "The review note must be 1,000 characters or fewer." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("review_opportunity", {
    p_opportunity_id: opportunityId,
    p_decision: decision,
    p_awarded_xp: xp,
    p_note: note.trim(),
  });
  if (error) return { error: explainDbError(error, "Verifying an opportunity") };

  revalidatePath("/instructor/opportunities");
  revalidatePath("/opportunities");
  revalidatePath("/");
  revalidatePath("/leaderboard");
  return {
    ok: true,
    info:
      decision === "approve"
        ? `Verified.${xp > 0 ? ` ${xp} XP awarded.` : ""}`
        : "Rejected. No XP awarded.",
  };
}

export async function updateStudentOpportunity(
  opportunityId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireInstructor();
  if (!opportunityId.trim()) return { error: "Unknown opportunity." };

  const organisation = String(formData.get("organisation") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const applyUrl = String(formData.get("applyUrl") ?? "").trim();
  const closesAtInput = String(formData.get("closesAt") ?? "").trim();
  const closesAt = closesAtInput ? new Date(closesAtInput) : null;

  if (!organisation || organisation.length > 160) {
    return { error: "Organisation is required and must be 160 characters or fewer." };
  }
  if (!role || role.length > 200) {
    return { error: "Role or title is required and must be 200 characters or fewer." };
  }
  if (summary.length > 5000) {
    return { error: "Description must be 5,000 characters or fewer." };
  }
  if (!type || type.length > 80) {
    return { error: "Opportunity type is required and must be 80 characters or fewer." };
  }
  if (location.length > 160 || applyUrl.length > 2000) {
    return { error: "Location or application link exceeds its allowed length." };
  }
  if (applyUrl) {
    try {
      const parsedUrl = new URL(applyUrl);
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return { error: "Apply link must use http or https." };
      }
    } catch {
      return { error: "Enter a valid apply link." };
    }
  }
  if (closesAtInput && (!closesAt || Number.isNaN(closesAt.getTime()))) {
    return { error: "Enter a valid closing date and time." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("instructor_update_student_opportunity", {
    p_opportunity_id: opportunityId,
    p_organisation: organisation,
    p_role: role,
    p_summary: summary,
    p_type: type,
    p_location: location,
    p_apply_url: applyUrl,
    p_closes_at: closesAt?.toISOString() ?? null,
  });
  if (error) return { error: explainDbError(error, "Updating a student opportunity") };

  revalidatePath("/instructor/opportunities");
  revalidatePath("/opportunities");
  return { ok: true, info: "Student-submitted opportunity updated." };
}

export async function deleteStudentOpportunity(
  opportunityId: string,
): Promise<ActionResult> {
  await requireInstructor();
  if (!opportunityId.trim()) return { error: "Unknown opportunity." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("instructor_delete_student_opportunity", {
    p_opportunity_id: opportunityId,
  });
  if (error) return { error: explainDbError(error, "Deleting a student opportunity") };

  revalidatePath("/instructor/opportunities");
  revalidatePath("/opportunities");
  revalidatePath("/");
  revalidatePath("/leaderboard");
  return {
    ok: true,
    info: "Student-submitted opportunity deleted. Any XP already awarded remains in the XP history.",
  };
}

export async function requestDevShopReward(
  rewardId: string,
  requestNote: string,
): Promise<ActionResult> {
  await requireSession();

  if (!rewardId.trim()) return { error: "Choose a reward first." };
  if (requestNote.length > 1000) {
    return { error: "Your note must be 1000 characters or fewer." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("request_dev_shop_reward", {
    p_reward_id: rewardId,
    p_request_note: requestNote.trim(),
  });

  if (error) return { error: explainDbError(error, "Requesting a reward") };
  revalidatePath("/dev-shop");
  return { ok: true, info: "Request sent to the instructor." };
}

export async function saveDevShopReward(formData: FormData): Promise<ActionResult> {
  await requireInstructor();

  const rewardId = String(formData.get("rewardId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const pointsCost = Number(formData.get("pointsCost") ?? 0);

  if (!name || !category || !description || !details) {
    return { error: "Complete all reward fields." };
  }
  if (name.length > 120 || category.length > 80) {
    return { error: "Name must be 120 characters or fewer and category 80 or fewer." };
  }
  if (description.length > 500 || details.length > 1000) {
    return { error: "Description must be 500 characters or fewer and details 1000 or fewer." };
  }
  if (!Number.isInteger(pointsCost) || pointsCost < 1 || pointsCost > 100000) {
    return { error: "Point cost must be a whole number between 1 and 100,000." };
  }

  const supabase = await createClient();
  const reward = {
    name,
    category,
    description,
    details,
    points_cost: pointsCost,
    active: formData.get("active") === "on",
  };

  const result = rewardId
    ? await supabase.from("dev_shop_rewards").update(reward).eq("id", rewardId)
    : await supabase.from("dev_shop_rewards").insert({
        ...reward,
        id:
          name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
            .slice(0, 48) || `reward-${Math.floor(Date.now() / 1000)}`,
        sort_order: Math.floor(Date.now() / 1000),
      });

  if (result.error) {
    if (result.error.code === "23505") {
      return { error: "A reward with that name already exists. Edit the existing reward instead." };
    }
    return { error: explainDbError(result.error, "Saving a reward") };
  }

  revalidatePath("/instructor/dev-shop");
  revalidatePath("/dev-shop");
  return { ok: true, info: rewardId ? "Reward updated." : "Reward added to the Dev Shop." };
}

export async function setDevShopRewardActive(
  rewardId: string,
  active: boolean,
): Promise<ActionResult> {
  await requireInstructor();
  if (!rewardId.trim()) return { error: "Choose a reward first." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("dev_shop_rewards")
    .update({ active })
    .eq("id", rewardId);

  if (error) {
    return { error: `Could not update reward (${error.code}): ${error.message}` };
  }

  revalidatePath("/instructor/dev-shop");
  revalidatePath("/dev-shop");
  return { ok: true };
}

export async function reviewDevShopRedemption(
  redemptionId: string,
  status: "approved" | "fulfilled" | "declined",
  instructorNote: string,
): Promise<ActionResult> {
  await requireInstructor();

  if (!redemptionId.trim()) return { error: "Unknown shop request." };
  if (instructorNote.length > 1000) {
    return { error: "The instructor note must be 1000 characters or fewer." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("review_dev_shop_redemption", {
    p_redemption_id: redemptionId,
    p_status: status,
    p_instructor_note: instructorNote.trim(),
  });

  if (error) return { error: explainDbError(error, "Reviewing a Dev Shop request") };
  revalidatePath("/instructor/dev-shop");
  revalidatePath("/dev-shop");
  return { ok: true, info: "Shop request updated." };
}

export async function markNotificationsRead(): Promise<ActionResult> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("developer_id", session.userId)
    .eq("read", false);
  if (error) return { error: "Could not update notifications." };
  return { ok: true };
}

/** Used by the instructor "developers" view — one submission row shape. */
export type { SubmissionRow };

/* -------------------------------------------------------------------------- */
/* Profile image upload                                                         */
/* -------------------------------------------------------------------------- */

export async function uploadProfileImage(
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();
  const supabase = await createClient();

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) {
    return { error: "No file selected." };
  }

  if (file.size > 2 * 1024 * 1024) {
    return { error: "Image must be smaller than 2 MB." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const allowedTypes: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    avif: "image/avif",
  };
  if (!allowedTypes[ext] || file.type !== allowedTypes[ext]) {
    return { error: "Unsupported image format. Use PNG, JPG, WebP, or AVIF." };
  }

  const fileName = `${session.userId}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .upload(fileName, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const { data: urlData } = supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .getPublicUrl(fileName);

  const avatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", session.userId);

  if (updateError) {
    return { error: `Could not update profile: ${updateError.message}` };
  }

  return { ok: true, info: "Profile image updated." };
}

export async function deleteProfileImage(): Promise<ActionResult> {
  const session = await requireSession();
  const supabase = await createClient();

  const { error: listError, data: files } = await supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .list("", { search: `${session.userId}.` });

  if (listError) {
    return { error: `Could not find profile image: ${listError.message}` };
  }

  if (files?.length) {
    const { error: removeError } = await supabase.storage
      .from(PROFILE_AVATAR_BUCKET)
      .remove(files.map((f) => f.name));
    if (removeError) {
      return { error: `Could not remove profile image: ${removeError.message}` };
    }
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", session.userId);

  if (updateError) {
    return { error: `Could not clear profile: ${updateError.message}` };
  }

  return { ok: true, info: "Profile image removed." };
}

/* -------------------------------------------------------------------------- */
/* Topic interest                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Interest in a topic proposal. `proposal_votes` already exists with the
 * "vote once" and "retract own vote" policies, so the write needs no schema
 * change — the client may only ever write its own row.
 */
export async function voteTopicProposal(proposalId: string): Promise<ActionResult> {
  const session = await requireSession();
  if (!proposalId.trim()) return { error: "Unknown topic proposal." };

  const supabase = await createClient();
  const { error } = await supabase.from("proposal_votes").insert({
    proposal_id: proposalId,
    voter_id: session.userId,
  });

  if (error) {
    if (String(error.code) === "23505") {
      return { info: "You have already shown interest in this topic." };
    }
    return { error: `Could not record your interest: ${error.message}` };
  }

  revalidatePath("/topics");
  revalidatePath("/instructor/topics");
  return { ok: true, info: "Interest recorded. The instructor sees the count." };
}

export async function retractTopicVote(proposalId: string): Promise<ActionResult> {
  const session = await requireSession();
  if (!proposalId.trim()) return { error: "Unknown topic proposal." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("proposal_votes")
    .delete()
    .eq("proposal_id", proposalId)
    .eq("voter_id", session.userId);

  if (error) return { error: `Could not withdraw your interest: ${error.message}` };

  revalidatePath("/topics");
  revalidatePath("/instructor/topics");
  return { ok: true, info: "Interest withdrawn." };
}

/* -------------------------------------------------------------------------- */
/* Inline lifecycle actions                                                     */
/* -------------------------------------------------------------------------- */

const PROBLEM_STATUS_VALUES = ["open", "locked", "closed", "draft"] as const;
type ProblemStatus = (typeof PROBLEM_STATUS_VALUES)[number];

/**
 * Change a problem's visibility without opening the full editor. The
 * instructor policy on `challenges` is the boundary; the browser cannot
 * change anything else about the row.
 */
export async function setAssignmentStatus(
  id: string,
  status: string,
): Promise<ActionResult> {
  await requireInstructor();
  if (!id.trim()) return { error: "Unknown problem." };
  if (!PROBLEM_STATUS_VALUES.includes(status as ProblemStatus)) {
    return { error: "Choose a valid problem status." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("challenges").update({ status }).eq("id", id);
  if (error) {
    return { error: explainDbError(error, "Changing the problem status") };
  }

  revalidatePath("/instructor/assignments");
  revalidatePath("/arena");
  revalidatePath("/arena/[assignmentId]", "page");
  return { ok: true, info: `Problem is now ${status}.` };
}

const TOPIC_STATUSES = ["draft", "open", "scheduled", "delivered", "archived"] as const;
type TopicStatus = (typeof TOPIC_STATUSES)[number];

/**
 * Publish, schedule or archive a topic. This is also how a developer proposal
 * becomes a topic the team can claim: the instructor moves it out of `draft`.
 */
export async function setTopicStatus(
  topicId: string,
  status: string,
): Promise<ActionResult> {
  const instructor = await requireInstructor();
  if (!topicId.trim()) return { error: "Unknown topic." };
  if (!TOPIC_STATUSES.includes(status as TopicStatus)) {
    return { error: "Choose a valid topic status." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teaching_proposals")
    .update({ status, reviewed_by: instructor.userId })
    .eq("id", topicId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: explainDbError(error, "Changing the topic status") };
  }
  if (!data) return { error: "Topic not found, or it is not yours to change." };

  revalidatePath("/instructor/topics");
  revalidatePath("/topics");
  revalidatePath("/teach");
  return {
    ok: true,
    info:
      status === "archived"
        ? "Topic archived. It no longer appears on the topics board."
        : `Topic is now ${status}.`,
  };
}

/* -------------------------------------------------------------------------- */
/* Unlock grants                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Grants a responsibility. `developer_unlocks` has no instructor write
 * policy, so this runs through the service-role client — the same privileged
 * path the developer roster uses. The catalogue itself stays read-only.
 */
export async function grantUnlock(
  developerId: string,
  unlockId: string,
): Promise<ActionResult> {
  await requireInstructor();
  if (!developerId.trim()) return { error: "Unknown developer." };
  if (!unlockId.trim()) return { error: "Unknown unlock." };

  const admin = createAdminClient();

  const { data: unlock, error: unlockError } = await admin
    .from("unlocks")
    .select("id")
    .eq("id", unlockId)
    .maybeSingle();
  if (unlockError) {
    return { error: `Could not verify the unlock: ${unlockError.message}` };
  }
  if (!unlock) return { error: "That unlock does not exist." };

  const { data: developer, error: developerError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", developerId)
    .maybeSingle();
  if (developerError) {
    return { error: `Could not verify the developer: ${developerError.message}` };
  }
  if (!developer) return { error: "That developer does not exist." };

  const { error } = await admin
    .from("developer_unlocks")
    .upsert(
      { developer_id: developerId, unlock_id: unlockId },
      { onConflict: "developer_id,unlock_id" },
    );
  if (error) {
    return { error: `Could not grant the unlock (${error.code}): ${error.message}` };
  }

  revalidatePath("/instructor/unlocks");
  revalidatePath("/instructor/developers");
  revalidatePath("/profile");
  return { ok: true, info: "Unlock granted." };
}

export async function revokeUnlock(
  developerId: string,
  unlockId: string,
): Promise<ActionResult> {
  await requireInstructor();
  if (!developerId.trim()) return { error: "Unknown developer." };
  if (!unlockId.trim()) return { error: "Unknown unlock." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("developer_unlocks")
    .delete()
    .eq("developer_id", developerId)
    .eq("unlock_id", unlockId);

  if (error) {
    return { error: `Could not revoke the unlock (${error.code}): ${error.message}` };
  }

  revalidatePath("/instructor/unlocks");
  revalidatePath("/instructor/developers");
  revalidatePath("/profile");
  return { ok: true, info: "Unlock revoked." };
}

/* -------------------------------------------------------------------------- */
/* Hub settings and announcements                                              */
/* -------------------------------------------------------------------------- */

export async function saveHubSettingsAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireInstructor();

  const name = String(formData.get("hubName") ?? "").trim();
  const reviewWindowDays = Number(formData.get("reviewWindowDays") ?? 0);
  const sessionLengthMinutes = Number(formData.get("sessionLengthMinutes") ?? 0);

  if (!name || name.length > 120) {
    return { error: "Hub name is required and must be 120 characters or fewer." };
  }
  if (!Number.isInteger(reviewWindowDays) || reviewWindowDays < 1 || reviewWindowDays > 90) {
    return { error: "The review window must be a whole number of days between 1 and 90." };
  }
  if (
    !Number.isInteger(sessionLengthMinutes) ||
    sessionLengthMinutes < 15 ||
    sessionLengthMinutes > 480
  ) {
    return { error: "The session length must be a whole number of minutes between 15 and 480." };
  }

  try {
    await persistHubSettings({
      name,
      reviewWindowDays,
      sessionLengthMinutes,
    });
  } catch (cause) {
    return {
      error: `Could not save hub settings: ${
        cause instanceof Error ? cause.message : "unknown error"
      }`,
    };
  }

  revalidatePath("/instructor/settings");
  revalidatePath("/");
  return { ok: true, info: "Hub settings saved." };
}

export async function saveHubAnnouncement(
  formData: FormData,
): Promise<ActionResult> {
  await requireInstructor();

  const id = String(formData.get("announcementId") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!headline || headline.length > 140) {
    return { error: "A headline of up to 140 characters is required." };
  }
  if (!body || body.length > 2000) {
    return { error: "An announcement body of up to 2,000 characters is required." };
  }

  const existing = await readHubAnnouncements();
  const previous = id ? existing.find((entry) => entry.id === id) : undefined;

  try {
    await saveHubAnnouncementRecord({
      id: previous?.id ?? `ann-${Date.now().toString(36)}`,
      headline,
      body,
      publishedAt: previous?.publishedAt ?? new Date().toISOString(),
    });
  } catch (cause) {
    return {
      error: `Could not save the announcement: ${
        cause instanceof Error ? cause.message : "unknown error"
      }`,
    };
  }

  revalidatePath("/instructor/settings");
  revalidatePath("/");
  return { ok: true, info: previous ? "Announcement updated." : "Announcement published." };
}

export async function deleteHubAnnouncement(
  id: string,
): Promise<ActionResult> {
  await requireInstructor();
  if (!id.trim()) return { error: "Unknown announcement." };

  try {
    await deleteHubAnnouncementRecord(id);
  } catch (cause) {
    return {
      error: `Could not delete the announcement: ${
        cause instanceof Error ? cause.message : "unknown error"
      }`,
    };
  }

  revalidatePath("/instructor/settings");
  revalidatePath("/");
  return { ok: true, info: "Announcement removed." };
}
