"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession, isInstructor, requireInstructor, requireSession } from "./session";
import type { SubmissionRow } from "./data";

const PROFILE_AVATAR_BUCKET = "PROFILES";

export interface ActionResult {
  ok?: boolean;
  info?: string;
  error?: string;
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

/* -------------------------------------------------------------------------- */
/* Claims — "I am taking responsibility for this activity"                     */
/* -------------------------------------------------------------------------- */

export async function claim(
  kind: "challenge" | "topic",
  activityId: string,
): Promise<ActionResult> {
  const session = await requireSession();
  const supabase = await createClient();

  const { error } = await supabase.from("activity_claims").insert({
    kind,
    activity_id: activityId,
    developer_id: session.userId,
  });

  if (error) {
    if (String(error.code) === "23505") {
      return { info: "You already have this one." };
    }
    return { error: "Could not record the claim." };
  }
  return { ok: true };
}

export async function unclaim(
  kind: "challenge" | "topic",
  activityId: string,
): Promise<ActionResult> {
  const session = await requireSession();
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

  if (error) return { error: "Could not submit the opportunity." };
  return { ok: true, info: "Submitted. The instructor verifies it before it earns XP." };
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

export async function createProblem(formData: FormData): Promise<ActionResult> {
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

export async function updateProblem(id: string, formData: FormData): Promise<ActionResult> {
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

  revalidatePath("/instructor/challenges");
  revalidatePath("/arena");
  revalidatePath(`/arena/${id}`);
  return { ok: true, info: "Problem updated." };
}

export async function deleteProblem(id: string): Promise<ActionResult> {
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

  revalidatePath("/instructor/challenges");
  revalidatePath("/arena");
  revalidatePath(`/arena/${id}`);
  return { ok: true, info: "Problem deleted." };
}

export async function createTopic(formData: FormData): Promise<ActionResult> {
  await requireInstructor();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const pathwayId = String(formData.get("pathwayId") ?? "teacher");
  const xpReward = Number(formData.get("xpReward") ?? 40);

  if (!title) return { error: "A title is required." };
  if (!summary) return { error: "A summary is required." };
  if (!Number.isFinite(xpReward) || xpReward < 5 || xpReward > 500) {
    return { error: "XP reward must be between 5 and 500." };
  }

  const session = await getSession();
  const supabase = await createClient();
  const { error } = await supabase.from("teaching_proposals").insert({
    title,
    pathway_id: pathwayId,
    proposed_by: session?.userId ?? "",
    summary,
    outcomes: ["Presentation reviewed by the instructor"],
    xp_reward: xpReward,
    status: "open",
  });

  if (error) return { error: "Could not create the topic." };
  return { ok: true, info: "Topic published. Developers can claim and present it." };
}

export async function reviewSubmission(
  submissionId: string,
  status: "approved" | "adjusted" | "returned",
  awardedXp: number,
  note: string,
): Promise<ActionResult> {
  await requireInstructor();

  if (!submissionId) return { error: "Unknown submission." };
  const xp = Math.max(0, Math.floor(Number(awardedXp) || 0));
  if ((status === "approved" || status === "adjusted") && xp <= 0) {
    return { error: "Approval must award at least 1 XP." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("review_submission", {
    p_submission_id: submissionId,
    p_reviewer_id: (await getSession())?.userId ?? "",
    p_status: status,
    p_awarded_xp: status === "returned" ? 0 : xp,
    p_note: note.trim(),
  });

  if (error) return { error: error.message };
  return {
    ok: true,
    info:
      status === "returned"
        ? "Returned for another pass. No XP awarded."
        : `Approved. ${xp} XP awarded.`,
  };
}

export async function reviewOpportunity(
  opportunityId: string,
  decision: "approve" | "reject",
  awardedXp: number,
  note: string,
): Promise<ActionResult> {
  await requireInstructor();

  const supabase = await createClient();
  const { data: opportunity, error: opportunityError } = await supabase
    .from("opportunities")
    .select("id, submitted_by, review_status")
    .eq("id", opportunityId)
    .single();

  if (opportunityError || !opportunity || opportunity.review_status !== "pending") {
    return { error: "This opportunity is no longer pending." };
  }

  const xp = Math.max(0, Math.floor(Number(awardedXp) || 0));
  const session = await getSession();

  const { error: updateError } = await supabase
    .from("opportunities")
    .update({
      review_status: decision === "approve" ? "approved" : "rejected",
      verification: decision === "approve" ? "verified" : "unverified",
      review_note: note.trim(),
      reviewed_by: session?.userId ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", opportunityId);

  if (updateError) return { error: "Could not record the decision." };

  /* XP flows through the instructor-gated engine — never a direct write. */
  if (decision === "approve" && xp > 0 && opportunity.submitted_by) {
    const { error: xpError } = await supabase.rpc("award_xp", {
      p_developer_id: opportunity.submitted_by,
      p_pathway_id: "scout",
      p_source: "scout",
      p_xp: xp,
      p_label: "Opportunity verified",
      p_detail: note.trim() || "Your opportunity submission was verified.",
      p_reference_id: opportunityId,
    });
    if (xpError) return { error: xpError.message };
  }

  return {
    ok: true,
    info:
      decision === "approve"
        ? `Verified.${xp > 0 ? ` ${xp} XP awarded.` : ""}`
        : "Rejected. No XP awarded.",
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

  if (error) return { error: error.message };
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
            .slice(0, 48) || `reward-${Date.now()}`,
        sort_order: Date.now(),
      });

  if (result.error) {
    if (result.error.code === "23505") {
      return { error: "A reward with that name already exists. Edit the existing reward instead." };
    }
    return { error: `Could not save reward (${result.error.code}): ${result.error.message}` };
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

  if (error) return { error: error.message };
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
