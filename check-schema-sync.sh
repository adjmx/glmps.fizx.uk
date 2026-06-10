#!/usr/bin/env bash
#
# check-schema-sync.sh — verify the vendored ndisc wire contract is intact.
#
#   1. FREEZE   schema/release.v1.json AND schema/release.v2.json each match
#               their pinned SHA-256. v1 stays in tree as the historic fixture
#               (some events on the relays predate v2); v2 is the canonical
#               parse path. Both are frozen — any format change is a NEW
#               release.vN.json vendored from ndisc, never an edit.
#   2. CONFORM  parseRelease must still honor the contract — exercised against
#               ndisc's vendored fixtures by scripts/assert-parse.ts.
#
# Both glmps repos vendor release.v{1,2}.json from the same ndisc release, so
# they pin the same hashes — lockstep is transitive, no cross-repo plumbing.
#
# Run by `npm run schema:check` and automatically as the `prebuild` hook.
# Schema source of truth: github.com/xjmzx/ndisc — see CHANGELOG.md.
#
set -euo pipefail
cd "$(dirname "$0")"

echo "[schema] freeze check"
for v in v1 v2; do
  if ! ( cd schema && shasum -a 256 -c "release.${v}.json.sha256" ); then
    echo "[schema] FAIL — release.${v}.json no longer matches its pinned hash."
    echo "         ${v} is FROZEN. Vendor the new contract from ndisc as"
    echo "         release.v<next>.json instead of editing ${v}, then update"
    echo "         the pin and CHANGELOG.md."
    exit 1
  fi
done

echo "[schema] parser conformance"
npx --yes tsx scripts/assert-parse.ts

echo "[schema] OK — vendored contracts intact, parser conforms"
