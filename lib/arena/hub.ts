import "server-only";

import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";

/**
 * Hub settings and announcements.
 *
 * Both live in `public.app_config`, the key/value table that already ships in
 * migration 0003. That table is locked away from `anon` and `authenticated`
 * on purpose, so every read and write here goes through the service-role
 * client — the same privileged path the instructor developer roster already
 * uses. Nothing about the schema changes; only the row contents do.
 */

const KEY_NAME = "hub.name";
const KEY_REVIEW_WINDOW = "hub.review_window_days";
const KEY_SESSION_LENGTH = "hub.session_length_minutes";
const KEY_ANNOUNCEMENTS = "hub.announcements";

export interface HubSettings {
  name: string;
  reviewWindowDays: number;
  sessionLengthMinutes: number;
}

export interface HubAnnouncement {
  id: string;
  headline: string;
  body: string;
  publishedAt: string;
}

export const DEFAULT_HUB_SETTINGS: HubSettings = {
  name: "Mufakose Innovation Hub",
  reviewWindowDays: 7,
  sessionLengthMinutes: 60,
};

function parseAnnouncements(value: string | undefined): HubAnnouncement[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      if (typeof entry !== "object" || entry === null) return [];
      const candidate = entry as Partial<HubAnnouncement>;
      if (
        typeof candidate.id !== "string" ||
        typeof candidate.headline !== "string" ||
        typeof candidate.body !== "string"
      ) {
        return [];
      }
      return [
        {
          id: candidate.id,
          headline: candidate.headline,
          body: candidate.body,
          publishedAt:
            typeof candidate.publishedAt === "string" ? candidate.publishedAt : "",
        },
      ];
    });
  } catch {
    /* A corrupt value must not take the settings page down. */
    return [];
  }
}

async function readConfig(): Promise<Map<string, string>> {
  if (!hasAdminCredentials()) return new Map();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("app_config")
    .select("key, value")
    .like("key", "hub.%");
  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.key as string, row.value as string]));
}

export async function readHubSettings(): Promise<HubSettings> {
  try {
    const config = await readConfig();
    const name = config.get(KEY_NAME);
    const window = Number(config.get(KEY_REVIEW_WINDOW));
    const session = Number(config.get(KEY_SESSION_LENGTH));
    return {
      name: name && name.trim() ? name.trim() : DEFAULT_HUB_SETTINGS.name,
      reviewWindowDays:
        Number.isFinite(window) && window > 0
          ? Math.round(window)
          : DEFAULT_HUB_SETTINGS.reviewWindowDays,
      sessionLengthMinutes:
        Number.isFinite(session) && session > 0
          ? Math.round(session)
          : DEFAULT_HUB_SETTINGS.sessionLengthMinutes,
    };
  } catch {
    return DEFAULT_HUB_SETTINGS;
  }
}

export async function readHubAnnouncements(): Promise<HubAnnouncement[]> {
  try {
    const config = await readConfig();
    return parseAnnouncements(config.get(KEY_ANNOUNCEMENTS)).sort((a, b) =>
      b.publishedAt.localeCompare(a.publishedAt),
    );
  } catch {
    return [];
  }
}

async function writeConfig(entries: Record<string, string>) {
  const admin = createAdminClient();
  const rows = Object.entries(entries).map(([key, value]) => ({ key, value }));
  const { error } = await admin
    .from("app_config")
    .upsert(rows, { onConflict: "key" });
  if (error) throw error;
}

export async function saveHubSettings(settings: HubSettings): Promise<void> {
  await writeConfig({
    [KEY_NAME]: settings.name,
    [KEY_REVIEW_WINDOW]: String(settings.reviewWindowDays),
    [KEY_SESSION_LENGTH]: String(settings.sessionLengthMinutes),
  });
}

export async function saveAnnouncement(
  announcement: HubAnnouncement,
): Promise<HubAnnouncement[]> {
  const existing = await readHubAnnouncements();
  const index = existing.findIndex((entry) => entry.id === announcement.id);
  const next =
    index >= 0
      ? existing.map((entry) => (entry.id === announcement.id ? announcement : entry))
      : [announcement, ...existing];

  await writeConfig({ [KEY_ANNOUNCEMENTS]: JSON.stringify(next) });
  return next;
}

export async function deleteAnnouncement(id: string): Promise<HubAnnouncement[]> {
  const existing = await readHubAnnouncements();
  const next = existing.filter((entry) => entry.id !== id);
  await writeConfig({ [KEY_ANNOUNCEMENTS]: JSON.stringify(next) });
  return next;
}
