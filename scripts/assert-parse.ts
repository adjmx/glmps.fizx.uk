/**
 * Schema-conformance guard for the frozen release.v1 contract.
 *
 * Feeds ndisc's vendored fixtures (schema/fixtures/) through parseRelease and
 * asserts the parser still honors the contract — most importantly that a
 * release missing optional tags (medium, year, …) is NOT dropped. The v1
 * `rule` guarantees only the d-tag structurally; everything else is optional.
 *
 * Run by check-schema-sync.sh. A hash pin proves the contract file is intact;
 * this proves the code still implements it.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { Event as NostrEvent } from "nostr-tools";
import { parseRelease } from "../src/lib/nostr";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "..", "schema", "fixtures");
const load = (name: string): NostrEvent =>
  JSON.parse(readFileSync(join(fixtures, name), "utf8")) as NostrEvent;

let failed = 0;
function check(label: string, ok: boolean): void {
  console.log(`  ${ok ? "ok  " : "FAIL"} ${label}`);
  if (!ok) failed += 1;
}

// F1 regression guard — the minimal release carries only d/title/artist and
// NO medium tag. A consumer that drops it because medium is absent is
// non-conformant with the v1 `rule`.
const minimal = parseRelease(load("release-31237.minimal.json"));
check("minimal release is not dropped", minimal !== null);
check("minimal release: medium absent, not required", minimal?.medium === undefined);
check("minimal release: title + artist parsed", !!minimal?.title && !!minimal?.artist);

// Titleless release — ndisc omits empty-valued tags, so a release saved with
// no title/artist yields an event carrying ONLY `d`. The v1 `rule` makes this
// VALID; parseRelease must not drop it and applies a display fallback.
const titleless = parseRelease(load("release-31237.titleless.json"));
check("titleless release is not dropped", titleless !== null);
check("titleless release: title falls back to Untitled", titleless?.title === "Untitled");
check("titleless release: artist falls back to Unknown Artist", titleless?.artist === "Unknown Artist");

// Full release — every optional tag populated.
const full = parseRelease(load("release-31237.full.json"));
check("full release is parsed", full !== null);
check("full release: medium = digital", full?.medium === "digital");
check("full release: both i-tags kept", full?.externalIds.length === 2);
check("full release: notes taken from content", full?.notes === "First three albums, remastered.");

// Negative — an event with no d-tag is not an addressable release.
const noD = parseRelease({
  id: "0", pubkey: "0", sig: "0", created_at: 0, kind: 31237,
  content: "", tags: [["title", "T"], ["artist", "A"]],
} as NostrEvent);
check("event without a d-tag is rejected", noD === null);

// release.v2 — full fixture has three ordered genre slots.
const v2full = parseRelease(load("release-31237-v2.full.json"));
check("v2 full: parsed", v2full !== null);
check("v2 full: 3 genre slots", v2full?.genres.length === 3);
check(
  "v2 full: slot order preserved (techno, dub, downtempo)",
  v2full?.genres[0] === "techno" &&
    v2full?.genres[1] === "dub" &&
    v2full?.genres[2] === "downtempo",
);
// release.v2 additive: the `tracks` tag parses to a number.
check("v2 full: tracks parsed = 12", v2full?.tracks === 12);

// release.v2 — partial fixture has only the primary slot.
const v2partial = parseRelease(load("release-31237-v2.partial.json"));
check("v2 partial: parsed", v2partial !== null);
check("v2 partial: 1 genre slot", v2partial?.genres.length === 1);
check("v2 partial: primary = electronic", v2partial?.genres[0] === "electronic");

// release.v2 — minimal fixture has no genre tags.
const v2minimal = parseRelease(load("release-31237-v2.minimal.json"));
check("v2 minimal: parsed", v2minimal !== null);
check("v2 minimal: 0 genre slots", v2minimal?.genres.length === 0);

// release.v2 invariants — synthetic events stress the normaliser.
function withGenres(slugs: string[]): NostrEvent {
  return {
    id: "0", pubkey: "0", sig: "0", created_at: 0, kind: 31237,
    content: "",
    tags: [["d", "disco-vault:0"], ...slugs.map((s) => ["genre", s])],
  } as NostrEvent;
}
const dup = parseRelease(withGenres(["techno", "techno", "jazz"]));
check("v2 invariant: duplicates collapsed", dup?.genres.join(",") === "techno,jazz");
// v2.1: parent + own-sub combos are now valid (rule dropped from the
// contract). Both slugs survive the normaliser, slot order preserved.
const parentSub = parseRelease(withGenres(["electronic", "techno"]));
check(
  "v2.1 invariant: `electronic` + sub coexist",
  parentSub?.genres.join(",") === "electronic,techno",
);
const unknown = parseRelease(withGenres(["bogus", "techno"]));
check("v2 invariant: unknown slug dropped", unknown?.genres.join(",") === "techno");
const overflow = parseRelease(
  withGenres(["techno", "jazz", "funk", "rock"]),
);
check(
  "v2 invariant: 4th slot ignored",
  overflow?.genres.length === 3 &&
    overflow?.genres.join(",") === "techno,jazz,funk",
);

if (failed > 0) {
  console.error(`\n  ${failed} conformance check(s) FAILED — parser no longer matches release.v1`);
  process.exit(1);
}
console.log("  all conformance checks passed");
