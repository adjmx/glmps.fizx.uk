/**
 * release.v2 genre slug constants + helpers.
 *
 * Source of truth: schema/release.v2.json — keep this file in sync with
 * `genreSlugs.mains` and `genreSlugs.electronicSubs`. Validation policy
 * matches the schema's strict-but-recoverable posture: unknown slugs are
 * dropped silently, never thrown.
 */

export const GENRE_MAINS = [
  "classical",
  "downtempo",
  "electronic",
  "experimental",
  "funk",
  "jazz",
  "pop",
  "reggae",
  "rock",
  "soundtrack",
] as const;

export const GENRE_ELECTRONIC_SUBS = [
  "acid",
  "breaks",
  "dnb-jungle",
  "drone-noise",
  "dub",
  "electro",
  "footwork-trap",
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
 * Wire-to-display rule for compound slugs: `dnb-jungle` → `dnb/jungle`,
 * `drone-noise` → `drone/noise`, `footwork-trap` → `footwork/trap`. Flat
 * slugs (including `dub` post-v2.1.1 rename) pass through unchanged.
 */
export function genreLabel(slug: string): string {
  return slug.replace(/-/g, "/");
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
