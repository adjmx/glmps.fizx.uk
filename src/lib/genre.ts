/**
 * release.v2 genre slug constants + helpers.
 *
 * Source of truth: schema/release.v2.json — keep this file in sync with
 * `genreSlugs.mains` and `genreSlugs.electronicSubs`. Validation policy
 * matches the schema's strict-but-recoverable posture: unknown slugs are
 * dropped silently, never thrown.
 */

export const GENRE_MAINS = [
  "ambient",
  "classical-folk",
  "downtempo",
  "electronic",
  "experimental",
  "funk",
  "hip-hop",
  "jazz",
  "pop",
  "reggae",
  "rock",
  "soundtrack",
] as const;

export const GENRE_ELECTRONIC_SUBS = [
  "acid",
  "bass",
  "breaks",
  "dnb-jungle",
  "drone-noise",
  "dub",
  "electro",
  "footwork-trap",
  "house",
  "techno",
] as const;

export type GenreMain = (typeof GENRE_MAINS)[number];
export type GenreElectronicSub = (typeof GENRE_ELECTRONIC_SUBS)[number];
export type GenreSlug = GenreMain | GenreElectronicSub;

const KNOWN: ReadonlySet<string> = new Set<string>([
  ...GENRE_MAINS,
  ...GENRE_ELECTRONIC_SUBS,
]);
const SUBS: ReadonlySet<string> = new Set<string>(GENRE_ELECTRONIC_SUBS);

export function isGenreSlug(s: string): s is GenreSlug {
  return KNOWN.has(s);
}

export function isElectronicSub(s: string): s is GenreElectronicSub {
  return SUBS.has(s);
}

/**
 * Wire-to-display rule for human-facing UI.
 *
 * 1. Per-slug overrides (rare): the wire keeps the schema-canonical slug;
 *    only the displayed label changes. Used here so `soundtrack` reads as
 *    "film" — the slug stays `soundtrack` on the contract, so this is
 *    glmps-side cosmetic only and doesn't affect filter matching.
 * 2. Slash-display: an explicit set of compound slugs renders with a slash
 *    (`classical-folk` → `classical/folk`, `dnb-jungle` → `dnb/jungle`,
 *    `drone-noise` → `drone/noise`, `footwork-trap` → `footwork/trap`).
 *    Set-gated rather than a blind regex because `hip-hop` (v2.1.4) is a
 *    single genre name that contains a hyphen and must render verbatim.
 * 3. Everything else passes through unchanged.
 */
const DISPLAY_OVERRIDES: Record<string, string> = {
  soundtrack: "film",
};

const SLASH_DISPLAY_SLUGS = new Set<string>([
  "classical-folk",
  "dnb-jungle",
  "drone-noise",
  "footwork-trap",
]);

export function genreLabel(slug: string): string {
  const override = DISPLAY_OVERRIDES[slug];
  if (override) return override;
  return SLASH_DISPLAY_SLUGS.has(slug) ? slug.replace(/-/g, "/") : slug;
}

/**
 * Apply release.v2 §"Slot semantics + invariants" on read. Strict-but-
 * recoverable — unknown slugs dropped, duplicates collapsed to first
 * occurrence, capped at 3 slots, slot order preserved.
 *
 * v2.1 update: the cross-slot `noParentWithOwnSub` rule was removed from
 * the contract. All 18 slugs are pure peers — `electronic` + a sub may
 * coexist on the same event. We no longer drop one for the other.
 */
export function normaliseGenres(raw: readonly string[]): GenreSlug[] {
  const out: GenreSlug[] = [];
  const seen = new Set<string>();
  for (const s of raw) {
    if (out.length >= 3) break;
    if (!isGenreSlug(s)) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}
