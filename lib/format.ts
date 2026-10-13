import type { Difficulty } from "@/lib/types";

const numberFormat = new Intl.NumberFormat("en-GB");

export function formatXp(value: number) {
  return numberFormat.format(Math.round(value));
}

export function formatXpDelta(value: number) {
  if (value === 0) return "0 XP";
  return `${value > 0 ? "+" : "−"}${numberFormat.format(Math.abs(value))} XP`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function formatLongDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 31536000000],
  ["month", 2592000000],
  ["week", 604800000],
  ["day", 86400000],
  ["hour", 3600000],
  ["minute", 60000],
];

const relativeFormat = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/**
 * Relative time is computed against a fixed "now" so server and client renders
 * always agree. `lib/mock/clock.ts` owns that value.
 */
export function relativeTime(iso: string, now: number) {
  const diff = new Date(iso).getTime() - now;
  const absolute = Math.abs(diff);
  for (const [unit, ms] of RELATIVE_UNITS) {
    if (absolute >= ms || unit === "minute") {
      return relativeFormat.format(Math.round(diff / ms), unit);
    }
  }
  return "just now";
}

export function deadlineLabel(iso: string, now: number) {
  const diff = new Date(iso).getTime() - now;
  const days = Math.ceil(diff / 86400000);
  if (diff < 0) return { label: "Closed", tone: "closed" as const };
  if (days <= 1) return { label: "Closes today", tone: "urgent" as const };
  if (days <= 3) return { label: `${days} days left`, tone: "urgent" as const };
  if (days <= 10) return { label: `${days} days left`, tone: "soon" as const };
  return { label: `${days} days left`, tone: "open" as const };
}

export function percent(value: number) {
  return `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`;
}

export function pluralise(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Difficulty bands. The stored values are historical and shared with the
 * database enum, so only the labels here are user-facing. `builder` reads as
 * "Intermediate" because a bare "Builder" collides with the Builder pathway.
 */
export const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; range: string; order: number }
> = {
  starter: { label: "Starter", range: "10–25 XP", order: 0 },
  builder: { label: "Intermediate", range: "30–60 XP", order: 1 },
  advanced: { label: "Advanced", range: "70–130 XP", order: 2 },
  expert: { label: "Expert", range: "150–250 XP", order: 3 },
  boss: { label: "Hard", range: "300+ XP", order: 4 },
};