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

if (failed > 0) {
  console.error(`\n  ${failed} conformance check(s) FAILED — parser no longer matches release.v1`);
  process.exit(1);
}
console.log("  all conformance checks passed");
