import { useMemo } from "react";
import { Link } from "react-router-dom";
import Nav from "@/components/Nav";
import { useReleases } from "@/hooks/useReleases";
import { useFeed } from "@/hooks/useFeed";
import { OWNER_NPUB, RELEASE_KIND } from "@/config";
import { hostnameOf, naddrEncode, npubToHex, type Release } from "@/lib/nostr";

// A feed note's `a` reference is `31237:<ownerhex>:<release-d>`; pull the
// release-d, which is the viewer's Release.d (e.g. "disco-vault:314").
function releaseDOf(ref: string | null): string | undefined {
  if (!ref) return undefined;
  const parts = ref.split(":");
  return parts.length >= 3 ? parts.slice(2).join(":") : undefined;
}

// `current` — the live feed-note channel (kind:31239) matched against the
// discography. Read-only. Feed read + trust gate are the SHARED template
// (lib/feed.ts + useFeed); this is glmps's presentation. Each note hydrates its
// referenced release from the already-loaded 31237s.
export default function Current() {
  const { hex, npubError } = useMemo(() => {
    try {
      return { hex: npubToHex(OWNER_NPUB), npubError: null as string | null };
    } catch (e) {
      return { hex: undefined, npubError: (e as Error).message };
    }
  }, []);

  const { releases } = useReleases(hex);
  const { notes, loading } = useFeed(hex);

  const byD = useMemo(() => {
    const m = new Map<string, Release>();
    for (const r of releases) m.set(r.d, r);
    return m;
  }, [releases]);

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="container max-w-3xl py-8 sm:py-12">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h1 className="font-mono text-lg text-foreground">
            current <span className="text-muted-foreground">/ feed</span>
          </h1>
          <Link
            to="/"
            className="font-mono text-[11px] text-accent hover:text-primary transition-colors shrink-0"
          >
            ‹ back to releases
          </Link>
        </div>

        {npubError ? (
          <div className="text-sm text-red-400 font-mono">{npubError}</div>
        ) : loading && notes.length === 0 ? (
          <p className="font-mono text-[11px] text-muted-foreground">
            listening…
          </p>
        ) : notes.length === 0 ? (
          <div className="bg-card border border-border p-8 text-center">
            <p className="text-sm text-foreground/70">Nothing here yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Curated picks &amp; new releases will appear here as they're
              posted.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {notes.map((n) => {
              const rel = byD.get(releaseDOf(n.release) ?? "");
              return (
                <li
                  key={n.address}
                  className="bg-card border border-border p-4 space-y-2"
                >
                  {rel ? (
                    <Link
                      to={`/r/${naddrEncode(rel.pubkey, RELEASE_KIND, rel.d)}`}
                      className="group flex items-center gap-3"
                    >
                      <div className="w-12 h-12 rounded overflow-hidden bg-muted/50 shrink-0">
                        {rel.image && (
                          <img
                            src={rel.image}
                            alt=""
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {rel.artist}
                        </span>
                        <span className="block text-sm text-muted-foreground truncate">
                          {rel.title}
                          {rel.year ? ` (${rel.year})` : ""}
                        </span>
                      </span>
                    </Link>
                  ) : n.release ? (
                    <p className="text-[11px] text-muted-foreground">
                      references a release not in view
                    </p>
                  ) : null}

                  {n.title && (
                    <p className="text-sm font-semibold text-foreground">
                      {n.title}
                    </p>
                  )}
                  {n.images[0] && (
                    <img
                      src={n.images[0]}
                      alt=""
                      loading="lazy"
                      className="w-full rounded max-h-72 object-cover"
                    />
                  )}
                  {n.body && (
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                      {n.body}
                    </p>
                  )}

                  {(n.topics.length > 0 || n.links.length > 0) && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      {n.topics.map((t) => (
                        <span key={t} className="text-[11px] text-muted-foreground">
                          #{t}
                        </span>
                      ))}
                      {n.links.map((l) => (
                        <a
                          key={l}
                          href={l}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-accent hover:text-primary underline truncate max-w-[12rem]"
                        >
                          {hostnameOf(l) ?? l} ↗
                        </a>
                      ))}
                    </div>
                  )}
                  {n.provenance !== "owner" && (
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {n.provenance}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
