# Changelog

## Schema contract

The Nostr wire contract with **ndisc** (the desktop publisher) is vendored
under `schema/` and frozen. `check-schema-sync.sh` — run via
`npm run schema:check` and the `prebuild` hook — verifies the vendored
contract still matches its pinned SHA-256 and that `parseRelease` conforms
to it.

Source of truth: [xjmzx/ndisc](https://github.com/xjmzx/ndisc). glmps vendors
the contract verbatim; ndisc wins on any discrepancy. A change to the emitted
event format is a coordinated `release.v2.json` bump — never an edit to v1.

### release.v1 — vendored 2026-05-22

- Source: [xjmzx/ndisc @ v0.1.1-beta.20](https://github.com/xjmzx/ndisc/blob/v0.1.1-beta.20/schema/release.v1.json)
- `schema/release.v1.json` SHA-256 `a22fb5cd02b864d3aacff6804607722b308740e0caf083787e79c16a313005fb`
- Covers kind:31237 release events and kind:5 (NIP-09) deletions; documents the
  read-only kind:0 profile usage.
- Fixtures under `schema/fixtures/` (vendored from the same ndisc release) drive
  the parser-conformance check.
- Replaces an earlier reverse-engineered draft of this file.
