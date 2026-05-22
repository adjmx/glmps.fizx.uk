import type { Event as NostrEvent } from "nostr-tools";
import { nip19 } from "nostr-tools";

export type Release = {
  id: string;
  pubkey: string;
  createdAt: number;
  d: string;
  title: string;
  artist: string;
  medium?: string;
  format?: string; // raw Discogs descriptor, e.g. `12", EP, Ltd, Num, Cle`
  formatGroup?: string; // collapsed bucket from FORMAT_GROUP_ORDER
  year?: string;
  label?: string;
  catalog?: string;
  country?: string;
  condition?: string;
  type?: string; // music | sample | stem | field-recording | message | other
  category?: string; // album | ep | single | compilation | mix | live | soundtrack | bootleg | miscellaneous
  source?: string; // outbound http(s) URL: Discogs release, Bandcamp, label store, etc.
  externalIds: string[];
  tags: string[];
  image?: string;
  notes: string;
  event: NostrEvent;
};

export type Profile = {
  name?: string;
  display_name?: string;
  picture?: string;
  about?: string;
  nip05?: string;
  website?: string;
  lud16?: string;
};

export function getTag(event: NostrEvent, name: string): string | undefined {
  const tag = event.tags.find((t) => t[0] === name);
  return tag?.[1] || undefined;
}

function sourceUrlOf(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return undefined;
    return u.toString();
  } catch {
    return undefined;
  }
}

export function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function getAllTags(event: NostrEvent, name: string): string[] {
  return event.tags
    .filter((t) => t[0] === name)
    .map((t) => t[1])
    .filter((v): v is string => Boolean(v));
}

// Discogs descriptor tokens that mark a pressing as non-standard — colored
// vinyl, limited/numbered, gatefold, flexi, white-label, etc. Matched as whole
// comma/plus-delimited tokens (lowercased). Best-effort superset: an
// unrecognized future token just leaves a 12" in the plain bucket.
const FORMAT_SPECIAL_TOKENS = new Set([
  "ltd", "num", "gat", "flexi", "minialbum", "w/lbl", "s/sided", "pic", "pin",
  "etch", "shape", "cle", "whi", "blu", "gre", "grn", "yel", "red", "ora",
  "pur", "pnk", "mar", "gld", "sil", "tri", "smo", "spl", "col",
]);

// Canonical display order for the collapsed `format` facet — physical sizes
// first (small to large, special variants adjacent), then digital by quality.
export const FORMAT_GROUP_ORDER = [
  '7"',
  '7" Colored/Limited',
  '10"',
  '12"',
  '12" Colored/Limited',
  '12" Reissue',
  '12" Promo',
  '2x12"',
  "3x+ LP",
  "Vinyl Box-set",
  "CD",
  "Cassette",
  "Lossless (FLAC/AIFF)",
  "MP3 320",
  "MP3 (Lossy)",
];

/**
 * Collapse a raw Discogs format descriptor (`12", EP, Ltd, Num, Cle`) into one
 * of the ~15 canonical buckets in FORMAT_GROUP_ORDER. Returns undefined for an
 * empty/unrecognized descriptor so it drops out of the facet entirely.
 *
 * 12"/LP family precedence: Promo > Reissue > Colored/Limited > plain — a
 * release carrying several qualifiers lands in the first match.
 */
export function formatGroup(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim();
  if (!s) return undefined;
  const lower = s.toLowerCase();

  // Digital — keyed off the codec name, not the medium tag.
  if (/\b(?:flac|aiff|wav)\b/.test(lower)) return "Lossless (FLAC/AIFF)";
  if (/\bmp3\b/.test(lower)) {
    const kbps = lower.match(/mp3\s+(\d+)/);
    return kbps && Number(kbps[1]) >= 320 ? "MP3 320" : "MP3 (Lossy)";
  }

  // Physical — split the descriptor into whole tokens.
  const tokens = s
    .split(/[,+]/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const has = (...needles: string[]) =>
    tokens.some((t) => needles.includes(t));

  if (has("box")) return "Vinyl Box-set";
  if (has("cass")) return "Cassette";
  if (has("cd")) return "CD";

  // Disc count — highest `Nx<size>` multiplier wins; a bare size token is 1.
  let mult = 0;
  for (const t of tokens) {
    const m = t.match(/^(\d+)x(?:12"|lp|10"|7")$/);
    if (m) mult = Math.max(mult, Number(m[1]));
    else if (t === '12"' || t === "lp" || t === '10"' || t === '7"')
      mult = Math.max(mult, 1);
  }
  if (mult >= 3) return "3x+ LP";
  if (mult === 2) return '2x12"';

  const special = tokens.some((t) => FORMAT_SPECIAL_TOKENS.has(t));

  if (has('7"')) return special ? '7" Colored/Limited' : '7"';
  if (has('10"')) return '10"';
  if (has('12"') || has("lp")) {
    if (has("promo")) return '12" Promo';
    if (has("re")) return '12" Reissue';
    if (special) return '12" Colored/Limited';
    return '12"';
  }

  return undefined;
}

export function parseRelease(event: NostrEvent): Release | null {
  const d = getTag(event, "d");
  if (!d) return null;
  return {
    id: event.id,
    pubkey: event.pubkey,
    createdAt: event.created_at,
    d,
    // v1 `rule`: only `d` is structurally guaranteed. ndisc omits any
    // empty-valued tag, so title/artist may be absent — fall back for display.
    title: getTag(event, "title") || "Untitled",
    artist: getTag(event, "artist") || "Unknown Artist",
    medium: getTag(event, "medium"),
    format: getTag(event, "format"),
    formatGroup: formatGroup(getTag(event, "format")),
    year: getTag(event, "year"),
    label: getTag(event, "label"),
    catalog: getTag(event, "catalog"),
    country: getTag(event, "country"),
    condition: getTag(event, "condition"),
    type: getTag(event, "type"),
    category: getTag(event, "category"),
    source: sourceUrlOf(getTag(event, "source")),
    externalIds: getAllTags(event, "i"),
    tags: getAllTags(event, "t"),
    image: getTag(event, "image"),
    notes: event.content,
    event,
  };
}

export function parseProfile(event: NostrEvent): Profile {
  try {
    const parsed = JSON.parse(event.content);
    return parsed && typeof parsed === "object" ? (parsed as Profile) : {};
  } catch {
    return {};
  }
}

/**
 * NIP-01 replaceable winner rule: higher created_at wins; tie-break to lower
 * lexicographic event id. Returns true iff `next` should replace `current`.
 */
export function isNewerReplaceable(
  current: NostrEvent | undefined,
  next: NostrEvent,
): boolean {
  if (!current) return true;
  if (next.created_at !== current.created_at)
    return next.created_at > current.created_at;
  return next.id < current.id;
}

export function npubToHex(npub: string): string {
  const decoded = nip19.decode(npub);
  if (decoded.type !== "npub") throw new Error("Not an npub");
  return decoded.data;
}

export function naddrEncode(
  pubkey: string,
  kind: number,
  identifier: string,
  relays?: string[],
): string {
  return nip19.naddrEncode({ pubkey, kind, identifier, relays });
}

export function naddrDecode(naddr: string): {
  pubkey: string;
  kind: number;
  identifier: string;
  relays?: string[];
} {
  const decoded = nip19.decode(naddr);
  if (decoded.type !== "naddr") throw new Error("Not an naddr");
  return decoded.data;
}

/**
 * Bucket a 4-digit year into a decade label ("1980s", "1990s", …).
 * Pre-1970 collapses to "pre-1970s". Returns null on malformed input.
 */
export function decadeOf(year: string | undefined): string | null {
  if (!year) return null;
  const n = parseInt(year, 10);
  if (!Number.isFinite(n)) return null;
  if (n < 1970) return "pre-1970s";
  const base = Math.floor(n / 10) * 10;
  return `${base}s`;
}

export type FilterState = {
  search: string;
  medium: Set<string>;
  format: Set<string>;
  decade: Set<string>;
  genre: Set<string>;
  type: Set<string>;
  category: Set<string>;
  condition: Set<string>;
  label: Set<string>;
};

// Sentinel option for releases that have no label tag. Rendered as-is in the
// popover; applyFilters treats this entry as "match where !r.label".
export const NO_LABEL_SENTINEL = "(no label)";

export function emptyFilters(): FilterState {
  return {
    search: "",
    medium: new Set(),
    format: new Set(),
    decade: new Set(),
    genre: new Set(),
    type: new Set(),
    category: new Set(),
    condition: new Set(),
    label: new Set(),
  };
}

export function isAnyFilterActive(f: FilterState): boolean {
  return (
    f.search.trim().length > 0 ||
    f.medium.size > 0 ||
    f.format.size > 0 ||
    f.decade.size > 0 ||
    f.genre.size > 0 ||
    f.type.size > 0 ||
    f.category.size > 0 ||
    f.condition.size > 0 ||
    f.label.size > 0
  );
}

// Case-insensitive word-prefix match so a selected label also catches its
// sub-labels: "Warp" matches "Warp Records" + "Warp Records Cheese"; "Clone"
// matches "Clone x series". Requires a word boundary after the prefix so
// "Warp" doesn't also match "Warping Sounds".
function labelMatches(releaseLabel: string, selected: string): boolean {
  const r = releaseLabel.toLowerCase();
  const s = selected.toLowerCase();
  if (r === s) return true;
  if (!r.startsWith(s)) return false;
  const next = r.charCodeAt(s.length);
  // word boundary: any non-alphanumeric char
  return !((next >= 48 && next <= 57) || (next >= 97 && next <= 122));
}

function matchesAnyLabel(releaseLabel: string, selected: Set<string>): boolean {
  for (const s of selected) {
    if (s === NO_LABEL_SENTINEL) continue;
    if (labelMatches(releaseLabel, s)) return true;
  }
  return false;
}

function matchesSearch(r: Release, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  // Substring across the freetext fields the user can usefully search.
  const hay = [
    r.title,
    r.artist,
    r.label,
    r.country,
    r.catalog,
    r.notes,
    r.format,
    r.formatGroup,
    r.year,
    r.type,
    r.category,
    r.condition,
    ...r.tags,
  ]
    .filter(Boolean)
    .join("  ")
    .toLowerCase();
  return hay.includes(needle);
}

export function applyFilters(releases: Release[], f: FilterState): Release[] {
  const q = f.search.trim();
  return releases.filter((r) => {
    if (f.medium.size > 0 && (!r.medium || !f.medium.has(r.medium))) return false;
    if (
      f.format.size > 0 &&
      (!r.formatGroup || !f.format.has(r.formatGroup))
    )
      return false;
    if (f.type.size > 0 && (!r.type || !f.type.has(r.type))) return false;
    if (f.category.size > 0 && (!r.category || !f.category.has(r.category)))
      return false;
    if (
      f.condition.size > 0 &&
      (!r.condition || !f.condition.has(r.condition))
    )
      return false;
    if (f.label.size > 0) {
      const labelMatch = r.label
        ? matchesAnyLabel(r.label, f.label)
        : f.label.has(NO_LABEL_SENTINEL);
      if (!labelMatch) return false;
    }
    if (f.decade.size > 0) {
      const d = decadeOf(r.year);
      if (!d || !f.decade.has(d)) return false;
    }
    if (f.genre.size > 0) {
      let any = false;
      for (const g of r.tags) {
        if (f.genre.has(g)) {
          any = true;
          break;
        }
      }
      if (!any) return false;
    }
    if (q && !matchesSearch(r, q)) return false;
    return true;
  });
}

/**
 * artist → year → title; missing year sorts last.
 */
export function compareReleases(a: Release, b: Release): number {
  const byArtist = a.artist.localeCompare(b.artist, undefined, {
    sensitivity: "base",
  });
  if (byArtist !== 0) return byArtist;
  const ya = a.year ?? "￿";
  const yb = b.year ?? "￿";
  const byYear = ya.localeCompare(yb);
  if (byYear !== 0) return byYear;
  return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
}
