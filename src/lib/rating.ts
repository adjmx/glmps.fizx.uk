// Reaction → star-rating derivation.
//
// Stars are *derived* from kind:7 reactions, not picked directly by users.
// `+` = upvote, `-` = downvote, `ℹ️` = info-request (kept here only as a
// constant so other modules don't typo it).
//
// The threshold ladder is intentionally human-readable. Tweak the boundaries
// here and the whole site moves — there's no persisted star value to migrate.

export const REACTION_UP = "+";
export const REACTION_DOWN = "-";
export const REACTION_INFO = "ℹ️";

/**
 * Net upvotes (up − down) → 0-5 star count.
 * Net negative renders as 0 (same as unrated — we don't shame).
 */
export const STAR_THRESHOLDS: ReadonlyArray<{ minNet: number; stars: number }> =
  [
    { minNet: 21, stars: 5 },
    { minNet: 11, stars: 4 },
    { minNet: 6, stars: 3 },
    { minNet: 3, stars: 2 },
    { minNet: 1, stars: 1 },
  ];

export function starRating(up: number, down: number): number {
  const net = up - down;
  if (net < 1) return 0;
  for (const { minNet, stars } of STAR_THRESHOLDS) {
    if (net >= minNet) return stars;
  }
  return 0;
}

export type ReactionKind = "up" | "down" | "info" | "other";

/** Classify a kind:7 event's content into our three buckets. */
export function classifyReaction(content: string): ReactionKind {
  const c = content.trim();
  if (c === REACTION_UP) return "up";
  if (c === REACTION_DOWN) return "down";
  if (c === REACTION_INFO || c === "+info" || c === "info") return "info";
  return "other";
}

// Display ceiling: counts above this render as "<DISPLAY_CAP>+" so a single
// release never advertises a runaway count. Doesn't filter underlying data;
// just normalizes presentation so accidental spam (many sock-puppets) can't
// dominate the UI. Reactor avatar trail caps at the same number.
export const DISPLAY_CAP = 5;
export function displayCount(n: number): string {
  return n > DISPLAY_CAP ? `${DISPLAY_CAP}+` : String(n);
}
