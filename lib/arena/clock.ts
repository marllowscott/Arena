/**
 * Real system clock for relative labels. Wrapped in its own
 * function so relative-time formatting stays a pure-looking
 * expression at the call site — the mock clock in lib/mock
 * is fixed and only serves the Phase-1 fixture screens.
 */
export function nowMs(): number {
  return Date.now();
}

export function nowIso(): string {
  return new Date().toISOString();
}
