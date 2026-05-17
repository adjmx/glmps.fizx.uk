# glmps.fizx.uk

> Public Nostr discography — releases as kind:31237 events.

**Live**: <https://glmps.fizx.uk>

## Stack

- [Vite](https://vitejs.dev/) + React 18 + TypeScript
- Tailwind CSS
- [nostr-tools](https://github.com/nbd-wtf/nostr-tools)
- lucide-react

## Nostr

- **Login**: NIP-07 (browser extension) + NIP-55 (Amber callback URI)
- `kind:31237` — release event (NIP-replaceable parameterized; owner-only publish)
- `kind:7` — reactions on releases (any signed-in user)
- `kind:0` — profile metadata

Owner = `nurture@fizx.uk` (`OWNER_NPUB` in `src/config.ts`). Only the owner sees edit/publish UI; any other signed-in user can react. Reads from `wss://relay.fizx.uk`, `wss://nos.lol`, `wss://relay.primal.net`. **nginx vhost needs SPA fallback** (`try_files $uri $uri/ /index.html;`) so `/r/<naddr>` deep links resolve.

## Develop

```bash
npm install
npm run dev
```

## Build + deploy

```bash
npm run build
rsync -avz --delete -e "ssh -p 2121" dist/ root@88.218.206.187:/var/www/glmps.fizx.uk/
```

> nginx vhost for this site uses an SPA fallback:
> `location / { try_files $uri $uri/ /index.html; }`
> so client-side routes resolve.

VPS: `88.218.206.187`. Full server / nginx / SSL / DNS notes for the wider deployment live in the local `code_vibe/CLAUDE.md` (not pushed; this README is the public-facing summary).

---

_Sister repo on the other side: <https://github.com/macos-node/glmps.upleb.uk>_
