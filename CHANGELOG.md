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

### release.v2 — vendored 2026-06-10 (post v2.1.1)

- Source: [xjmzx/ndisc @ main](https://github.com/xjmzx/ndisc/blob/main/schema/release.v2.json) (converged end-state per `schema/README.md`).
- `schema/release.v2.json` SHA-256 `52ec321c4dd2daf439e73d0e8ca95915a350c398f4c9f65d301f7ac56787f2c3`.
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
