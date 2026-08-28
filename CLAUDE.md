# glmps — notes for Claude

Public Nostr discography viewer. Reads `kind:31237` release events for one
owner npub and renders them as a browsable library. React + Vite + Tailwind.

## Read SUITE.md first

[`ndisc/SUITE.md`](https://github.com/xjmzx/ndisc/blob/main/SUITE.md) is
authoritative for shared conventions — the wire contract, contract governance,
the palette and top-bar grammar, and the `CLAUDE.md` tiering. Read it **before
making a platform-sensitive or contract-sensitive choice**; it records
constraints that are invisible from inside this repo.

## This file is deliberately identical in both forks

glmps exists twice — `glmps.upleb.uk` and `glmps.fizx.uk` — and this file is
byte-identical in both. It therefore never says "this fork is the upleb one".
It cannot: a file that differed per fork would be one more thing to drift, and
drift between the forks is the failure this repo keeps having.

**To tell which fork you are in, read `index.html`.** The `theme-<x>` class on
`<html>` is the fork identity, and `package.json`'s `name` agrees with it.

## Build and verify

```
npm run dev        # vite
npm run build      # runs the schema gate, then tsc -b && vite build
npm test           # vitest — master-key conformance vectors
npm run typecheck  # tsc -b --noEmit
```

**Verify with `npm run build`, never a bare `tsc --noEmit`.** This repo uses a
solution-style tsconfig, so plain `tsc --noEmit` checks nothing and exits 0. A
type error shipped that way once. Only `tsc -b` walks the project references.

`prebuild` runs `check-schema-sync.sh`, which compares the vendored contracts
in `schema/` against their `.sha256` sidecars. A failing build here usually
means a vendored schema was edited in place instead of re-vendored from ndisc.

## The lockstep contract

Any change to a shared pattern — nav, hero, components, hooks, deploy script,
vendored schema — **must land in both forks in the same session.** Committing
to one and stopping is the recurring bug this section exists to prevent.
`diff -rq` the two `src/` trees before finishing.

### What is allowed to differ, verified

Seven files, and no others:

| File | Legitimate difference |
|---|---|
| `index.html` | `theme-<x>` class on `<html>`, `<title>`, `og:title` |
| `package.json` | `name` |
| `src/components/Nav.tsx` | sibling hostnames and brand href |
| `src/pages/Index.tsx` | footer-chip hex literals and hostnames |
| `src/components/NostrHandshake.tsx` | shaka fill — **see the asymmetry below** |
| `src/components/AnimatedTitle.tsx` | *comment only — drift, reconcile* |
| `src/hooks/useRelayStats.ts` | *comment only — drift, reconcile* |

`src/index.css` is **fully byte-identical**: all three themes
(`.theme-fizx` / `.theme-upleb` / `.theme-mono`) ship in both forks. The
default is set by the class in `index.html`, not by which rules exist. Do not
"reconcile" that class away — it *is* the divergence. `src/hooks/useTheme.tsx`,
`App.tsx` and the title wiring are shared verbatim. `mono` ships in both and is
never a fork default.

**Two of those seven are pure drift.** `AnimatedTitle.tsx` and
`useRelayStats.ts` differ only in a provenance comment naming a sibling site.
Nothing functional. They should be made identical the next time either is
touched; they are listed here so the difference is not mistaken for intent.

**One is a real asymmetry, not a palette literal.** In `NostrHandshake.tsx` one
fork fills the shaka with a flat colour and the other with an SVG
`linearGradient` plus its `<defs>`. That is a structural difference wearing a
palette difference's clothes. Decide it deliberately — either both get the
gradient with per-fork stops, or both go flat — rather than carrying it
forward as though it were sanctioned.

## Traps specific to this repo

- **NIP-09 deletions are not tombstones.** Filtering `kind:5` by `a` tag into a
  bare `Set` empties the catalogue after any bulk republish. The strict-NIP-09
  reading is required; all readers were fixed for this in 2026-07. If the
  library renders empty, suspect this before suspecting the relays.
- **The relay list must be a superset of what the publisher uses**, or releases
  present on one relay and not another disappear intermittently. Some relays
  stay sparse and that is expected, not a bug to chase.
- **Vendored schemas are copies, pinned by SHA.** Change them in ndisc and
  re-vendor; never edit `schema/*.json` here. The sidecar exists to make that
  mistake loud at build time.
- **`masterKey.ts` is Phase 1 and unused.** It computes content-derived keys
  byte-identical to ndisc's Rust reference and is proven by the vitest vectors,
  but nothing reads or writes a Nostr tag with it yet, so it tree-shakes out of
  the bundle. Its contract is unfrozen and therefore deliberately outside the
  frozen schema gate — the conformance test is its gate. Do not wire it to the
  wire until the contract is frozen.
- **`glmps` is the canonical copy of the shared `lib/` core**, which `nview`
  ports *from*. Fix a lib bug here first, then port. `DISPLAY_CAP` divergence
  between them is intentional.
- **This is the only site whose nginx vhost uses SPA fallback**
  (`try_files $uri $uri/ /index.html;`) so `/r/<naddr>` deep links resolve. The
  vhost lives in the repo. A deploy that drops it breaks every shared link.

## Not here

Server addresses, SSH users and ports, key paths, webroot and `/etc` paths, and
anything under `~/.claude/` belong in the machine-local `~/code_gh/CLAUDE.md`,
never in this file. Refer to them by role — "the deploy host" — and stop.
**This repo is public.** See the `CLAUDE.md` tiering in `SUITE.md`.
