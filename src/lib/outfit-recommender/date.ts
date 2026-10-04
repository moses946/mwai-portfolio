// Vendored from moses946/fitweek lib/outfit-recommender/src/date.ts (same author). Keep in sync by copying, not editing.
export function toISODate(date: Date = new Date()): string {
  return date.toISOString().split("T")[0]!;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}
