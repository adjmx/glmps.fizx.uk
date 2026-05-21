#!/usr/bin/env bash
#
# check-schema-sync.sh — verify the vendored ndisc wire contract is intact.
#
#   1. FREEZE   schema/release.v1.json must match its pinned SHA-256. v1 is
#               frozen: a format change is a NEW release.v2.json vendored from
#               ndisc, never an edit to v1.
#   2. CONFORM  parseRelease must still honor the contract — exercised against
#               ndisc's vendored fixtures by scripts/assert-parse.ts.
#
# Both glmps repos vendor release.v1.json from the same ndisc release, so they
# pin the same hash — lockstep is transitive, no cross-repo plumbing needed.
#
# Run by `npm run schema:check` and automatically as the `prebuild` hook.
# Schema source of truth: github.com/xjmzx/ndisc — see CHANGELOG.md.
#
set -euo pipefail
cd "$(dirname "$0")"

echo "[schema] freeze check"
if ! ( cd schema && shasum -a 256 -c release.v1.json.sha256 ); then
  echo "[schema] FAIL — release.v1.json no longer matches its pinned hash."
  echo "         v1 is FROZEN. Vendor the new contract from ndisc as"
  echo "         release.v2.json instead of editing v1, then update the pin"
  echo "         and CHANGELOG.md."
  exit 1
fi

echo "[schema] parser conformance"
npx --yes tsx scripts/assert-parse.ts

echo "[schema] OK — vendored contract intact, parser conforms"
