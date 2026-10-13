/**
 * The mock clock. Every relative label in the app resolves against this value so
 * server and client renders can never disagree. Phase 2 replaces it with the
 * real system time once the database is authoritative.
 */
export const NOW = new Date("2026-10-05T09:20:00.000Z");

export const NOW_MS = NOW.getTime();

const DAY = 86400000;
const HOUR = 3600000;

export function daysFromNow(days: number) {
  return new Date(NOW_MS + days * DAY).toISOString();
}

export function hoursAgo(hours: number) {
  return new Date(NOW_MS - hours * HOUR).toISOString();
}

export function daysAgo(days: number) {
  return new Date(NOW_MS - days * DAY).toISOString();
}