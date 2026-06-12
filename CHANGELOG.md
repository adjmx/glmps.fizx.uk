# Changelog

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
