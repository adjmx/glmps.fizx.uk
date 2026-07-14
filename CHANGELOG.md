# Changelog

## Viewer behaviour

Read-path fixes. These are *not* contract changes — the wire format is
untouched — but they change what the viewer renders from the same events, so
they move in step across both forks.

### 2026-07-14 — surface the release.v2 `video` tag

The `video` tag has been in the vendored, SHA-pinned `release.v2.json` since the
2026-06-23 genre round (ndisc emits it, count of audio-visual files, only when
`> 0`), but `parseRelease` never read it — so a release carrying video was
indistinguishable from an audio-only one. No contract change; this is purely a
read-path catch-up.

`parseRelease` now reads `video` → `Release.video?: number` (strict-but-recoverable,
same shape as `tracks`/`discs`). The schema notes the emitter extension-detects
and may over-count, so **presence is the signal**: a plain `video` facet on the
card/row and detail subtitle (surfaced at `≥ 1`, no count), with the raw count
shown only as a richer hint in the detail `video` field. Fixture
`release-31237-v2.full.json` gains `["video","1"]`; `assert-parse.ts` pins
`video === 1`. Landed in step across both glmps forks + ndisc.view.

### 2026-07-11 — `a`-tag deletions are not permanent tombstones

A kind:5 deletion carrying an `a` tag was treated as killing the coordinate
forever: any matching kind:31237 was dropped regardless of timestamp. But the
coordinate (`kind:pubkey:d`) is **reused every time a release is republished**,
so an unpublish-then-republish cycle produced a new event that the viewer
discarded on sight.

ndisc's library was bulk-unpublished and then republished, which leaves a
deletion in the history of *every* coordinate. The consequence was not a stale
release or two — as the deletion subscription caught up, the viewer would have
dropped the **entire catalogue**.

Now strict NIP-09: keep the newest deletion timestamp per coordinate and kill
only events created at or before it. `e`-tag deletions remain permanent — they
name one content-addressed event id, which is never reused. Fixed in
`useReleases` (catalogue), `useReleaseByAddr` (release page) and `lib/feed`
(kind:31239 notes, which carried the identical bare-`Set` tombstone and would
have made any republished note invisible).

Publisher-side counterpart: **ndisc v0.1.4-beta.5**, which had the same bug in
`reconcile_published` and now also sends `e` + `a` on every deletion (see
`HANDOVER-2026-07-11.md`).

## Schema contract

The Nostr wire contract with **ndisc** (the desktop publisher) is vendored
under `schema/` and frozen. `check-schema-sync.sh` — run via
`npm run schema:check` and the `prebuild` hook — verifies the vendored
contract still matches its pinned SHA-256 and that `parseRelease` conforms
to it.

Source of truth: [xjmzx/ndisc](https://github.com/xjmzx/ndisc). glmps vendors
the contract verbatim; ndisc wins on any discrepancy. A change to the emitted
event format is a coordinated `release.vN+1.json` bump — never an edit to a
shipped version.

### feed.v1 — feed-note channel (kind:31239), vendored 2026-06-23

**Feed contract:** `feed.v1` @ `077fe7a6f70831ccf7c9640185c29e0b9c289ea22a1e4283064a1803ed1ea50c`

- Source: [xjmzx/ndisc](https://github.com/xjmzx/ndisc) `schema/feed.v1.json`, frozen 2026-06-23. Pinned by `schema/feed.v1.json.sha256` and verified by `check-schema-sync.sh` (same freeze rule as `release.vN`).
- Adds the **feed-note channel**: kind:31239 notes (`d=glmps:<id>`, optional `a` release reference, repeatable `image`/`r`/`t`, `alt` fallback, body in `content`), the NIP-51 contributor registry (kind:30000, `d=glmps:contributors`), the NIP-72 per-note sign-off (kind:4550), and the client-side trust gate + NIP-09 kind:5 deletes. All authority roots on the single owner key.
- Shared read template `src/lib/feed.ts` (`parseFeedNote`/`resolveFeed`/`releaseIdFromRef`) is byte-identical across ndisc / ndisc.view / glmps.
- Surfaced as the **/current** view — kind:31239 notes matched against the discography; a note's `a` hydrates artist/title/cover from the local kind:31237, linking to the release. Owner-only in v1.
- Coordinated wave with ndisc.view + the other glmps fork — all consumers + ndisc cite the same SHA.

### release.v2 — 2026-06b genre round, re-vendored 2026-06-23

- Source: [xjmzx/ndisc @ 28cc116](https://github.com/xjmzx/ndisc). `schema/release.v2.json` SHA-256 `179fd563…` → `91e16cf1…` (re-pinned + freeze-checked). Additive, **not** a v3 bump.
- Genre vocabulary 35 → **38 active slugs**. Two 1:1 renames done additively (new slug active, old retired to `deprecated`, kept valid for legacy reads): **`poetry` → `spoken`**, **`spiritual` → `conscious`**. New slugs: **`disco`** + **`spoken`** (acoustic), **`garage`** (electronic), **`conscious`** + **`turntablism`** (tertiary).
- `genre.ts` slug arrays updated (viewer helpers `genreLabel`/`genreColor`/`normaliseGenres` unchanged); `index.css` gains `--c-g-{disco,spoken,garage,conscious,turntablism}` hue vars (disco orchid, spoken lavender, garage sky-blue, conscious gold-olive, turntablism graphite). `poetry`/`spiritual` colours retained for legacy rendering.

### release.v2 — `discs` tag amendment, re-vendored 2026-06-20

- Source: [xjmzx/ndisc @ 018eb34](https://github.com/xjmzx/ndisc/blob/018eb34/schema/release.v2.json).
- `schema/release.v2.json` SHA-256 `179fd5631454aa6c8feac5b20a27257f96b73413953e663c52ae7516f6a843fd` (was `99a9b269…`, the 2026-06 genre restructure).
- Adds the `discs` tag — optional, integer-as-string: the release's **total disc count**. A release property like `tracks`, NOT a per-device count. ndisc derives it from the Discogs format breakdown (2x LP → 2; digital folder imports carry no disc count), so it is present only on Discogs-enriched releases. Additive + backward-compatible (old consumers ignore it); a tolerated additive amendment to v2, **not** a v3 bump — `changePolicy` now blesses both the `tracks` and `discs` optional tags.
- Parser: `parseRelease` reads `discs` → `Release.discs?: number` (strict-but-recoverable — a non-positive/garbage value drops out). Surfaced only for genuine multi-disc releases (`> 1`): an "N discs" facet on the card/row + a `discs` field on the detail page. ndisc emits when `> 0`; single-disc is kept off the UI.
- Fixture `release-31237-v2.full.json` gains `["discs","2"]`; `assert-parse.ts` pins `discs === 2`.

### release.v2 — `tracks` tag amendment, re-vendored 2026-06-18

- Source: [xjmzx/ndisc @ main](https://github.com/xjmzx/ndisc/blob/main/schema/release.v2.json).
- `schema/release.v2.json` SHA-256 `bd76512c7d6bdce91e2cc55ba3f24f70e51cfef031a843a7a5a8aa84e312c322` (was `dac8a702…` at v2.1.4).
- Adds the `tracks` tag — optional, integer-as-string: the release's **expected total track count** (from the source `TRACKTOTAL` metadata). A release property, NOT a per-device present-file count. Additive + backward-compatible (old consumers ignore it); a tolerated additive amendment to v2 (like the genre-slug additions), **not** a v3 bump — ndisc's `changePolicy` was updated to bless additive optional tags.
- Parser: `parseRelease` reads `tracks` → `Release.tracks?: number` (strict-but-recoverable — a non-positive/garbage value drops out). Shown as an "N tracks" facet on the card/row + a `tracks` field on the detail page.
- Fixture `release-31237-v2.full.json` gains `["tracks","12"]`; `assert-parse.ts` pins `tracks === 12`.

### release.v2 — re-vendored 2026-06-14 (post v2.1.4) + v2.1.3 palette amendment + v2.1.2 catch-up

- v2.1.4 amendment (2026-06-14): four new genre slugs — `ambient` and `hip-hop` to mains, `bass` and `house` to electronic subs. Slug count goes 18 → 22. All slugs remain pure peers. Palette triplets added: `--c-g-ambient: 176 199 209`, `--c-g-hip-hop: 158 104 66`, `--c-g-bass: 120 40 108`, `--c-g-house: 190 80 188`. SHA re-pin: `dac8a702…` (was `82c97da7…`).
- **`genreLabel` fix:** the previous blind `slug.replace(/-/g, "/")` mangled `hip-hop` into `hip/hop`. Switched to a set-gated helper — `SLASH_DISPLAY_SLUGS` enumerates the four legitimate compound slugs (`classical-folk`, `dnb-jungle`, `drone-noise`, `footwork-trap`); all other slugs pass through verbatim. `hip-hop` and `bass`/`house`/`ambient` render unchanged.
- No migration. Existing releases untouched; new slugs simply available.
- Aggregation unchanged — any-slot counts everywhere per `visualisations.md`.

### release.v2 — re-vendored 2026-06-12 (post v2.1.2) + v2.1.3 palette amendment

- Source: [xjmzx/ndisc @ main](https://github.com/xjmzx/ndisc/blob/main/schema/release.v2.json) (converged end-state per `schema/README.md`, heading "v2.1.3, 2026-06-12").
- `schema/release.v2.json` SHA-256 `82c97da7d20c6af29aa0af2222bcce51f74faaf1985f5121a78cf491db0a56f3` (was `52ec321c…` at v2.1.1; unchanged at v2.1.3 since the palette amendment is doc-only).
- v2.1.2 amendment: single-slug rename `classical` → `classical-folk` (symmetric to v2.1.1's `dub-techno` → `dub`). Palette triplet unchanged (`232 220 195`). The slug is now compound and renders as `classical/folk` via the existing `genreLabel` slash rule — no new code path. No invariant change.
- v2.1.3 amendment: `electronic` palette triplet changed from magenta (`255 95 186`) to neutral grey (`140 140 140`). Slug name unchanged on the wire; no JSON re-vendor, no SHA bump — only the `--c-g-electronic` CSS var swapped. Rationale: dominant slug recedes so tail genres' colours read more clearly in the GenreBar.
- v2.1 / v2.1.x aggregation pivot (per `schema/visualisations.md`): library-stats charts that previously counted primary-only now count any-slot, matching v2.1's pure-peer model. A release with N distinct slugs contributes N tallies. Slot order on the wire stays emission priority — not aggregation weight. Affects `GenreBar` (`genre-distribution`) and `LabelCycler` top-3 dots (`genre-dominant-of-set`). Filter predicates were already any-slot.
- Adds the `genre` tag — optional, repeatable 0–3, ordered. Slot 0 = primary, slot 1 = secondary, slot 2 = tertiary.
- 18 valid slugs across 10 mains + 8 electronic subs (palette grouping only, no semantic constraint after v2.1's flatten).
- Three invariants enforced strict-but-recoverable on read (`src/lib/genre.ts` → `normaliseGenres`): distinct slugs, slot cap of 3, dense ordering. Unknown slugs silently dropped.
- v1 stays in tree as historic fixture; `check-schema-sync.sh` now dual-freezes v1 + v2 and the parser-conformance suite covers both wire shapes.
- Fixtures under `schema/fixtures/release-31237-v2.{full,partial,minimal}.json` vendored alongside.

### release.v1 — vendored 2026-05-22

- Source: [xjmzx/ndisc @ v0.1.1-beta.20](https://github.com/xjmzx/ndisc/blob/v0.1.1-beta.20/schema/release.v1.json)
- `schema/release.v1.json` SHA-256 `a22fb5cd02b864d3aacff6804607722b308740e0caf083787e79c16a313005fb`
- Covers kind:31237 release events and kind:5 (NIP-09) deletions; documents the
  read-only kind:0 profile usage.
- Fixtures under `schema/fixtures/` (vendored from the same ndisc release) drive
  the parser-conformance check.
- Replaces an earlier reverse-engineered draft of this file.
