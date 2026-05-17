import { useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import AnimatedTitle from "@/components/AnimatedTitle";
import ProfileHeader from "@/components/ProfileHeader";
import StatsSummary from "@/components/StatsSummary";
import ReleaseCard from "@/components/ReleaseCard";
import ReleaseRow from "@/components/ReleaseRow";
import FilterBar from "@/components/FilterBar";
import ViewToggle, { type ViewMode } from "@/components/ViewToggle";
import RelayStats from "@/components/RelayStats";
import NewReleaseFab from "@/components/NewReleaseFab";
import NostrHandshake from "@/components/NostrHandshake";
import { useOwnerProfile } from "@/hooks/useOwnerProfile";
import { useReleases } from "@/hooks/useReleases";
import { DEFAULT_RELAYS, OWNER_NPUB, RELEASE_KIND } from "@/config";
import {
  applyFilters,
  emptyFilters,
  npubToHex,
  type FilterState,
} from "@/lib/nostr";

const PAGE_SIZE = 60;
const VIEW_STORAGE_KEY = "glmps_view_mode";

export default function Index() {
  const { hex, npubError } = useMemo(() => {
    try {
      return { hex: npubToHex(OWNER_NPUB), npubError: null as string | null };
    } catch (e) {
      return { hex: undefined, npubError: (e as Error).message };
    }
  }, []);

  const { profile } = useOwnerProfile();
  const { releases, loading, eose } = useReleases(hex);

  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [view, setView] = useState<ViewMode>(() => {
    try {
      const v = localStorage.getItem(VIEW_STORAGE_KEY);
      if (v === "list" || v === "grid-sm" || v === "grid") return v;
      return "grid";
    } catch {
      return "grid";
    }
  });
  const [shown, setShown] = useState(PAGE_SIZE);

  // Persist view-mode preference.
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch {
      /* ignore */
    }
  }, [view]);

  // Reset pagination whenever the filter or result set changes — otherwise
  // shrinking results to <shown leaves a dead "load more" button.
  useEffect(() => {
    setShown(PAGE_SIZE);
  }, [filters, releases.length]);

  const visible = useMemo(
    () => applyFilters(releases, filters),
    [releases, filters],
  );
  const paged = useMemo(() => visible.slice(0, shown), [visible, shown]);
  const hasMore = visible.length > paged.length;

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="container max-w-5xl py-8 sm:py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3">
            <AnimatedTitle
              accent="glmps"
              rest="²"
              from="#34d399"
              to="#a78bfa"
              suffixRgba="rgba(52,211,153,0.55)"
            />
            <NostrHandshake />
          </div>
          <p className="text-[11px] text-foreground/75 mt-2">
            A public discography — releases published as signed Nostr events.{" "}
            <span className="inline-block rounded-full bg-accent text-accent-foreground font-mono text-[10px] px-2 py-0.5 align-middle">
              kind 31237
            </span>
          </p>
          {hex && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1.5fr] gap-3 items-start">
              <div className="rounded-lg border border-border/60 bg-card/30 p-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-mono mb-2">
                  relays
                </div>
                <RelayStats
                  urls={DEFAULT_RELAYS}
                  filter={{ kinds: [RELEASE_KIND], authors: [hex] }}
                />
              </div>
              <StatsSummary releases={releases} />
              <ProfileHeader profile={profile} npub={OWNER_NPUB} />
            </div>
          )}
        </div>

        {npubError ? (
          <div className="text-sm text-red-400 font-mono">
            Invalid OWNER_NPUB in src/config.ts: {npubError}
          </div>
        ) : (
          <>

            <FilterBar
              releases={releases}
              value={filters}
              onChange={setFilters}
            />

            {/* Result count + view toggle */}
            {releases.length > 0 && (
              <div className="flex items-center justify-between mb-4 text-[11px] font-mono text-muted-foreground/70">
                <span>
                  {visible.length.toLocaleString()}{" "}
                  {visible.length === 1 ? "release" : "releases"}
                  {visible.length !== releases.length && (
                    <span className="opacity-50">
                      {" "}
                      / {releases.length.toLocaleString()}
                    </span>
                  )}
                </span>
                <ViewToggle value={view} onChange={setView} />
              </div>
            )}

            {loading && !eose && (
              <div className="text-xs text-muted-foreground/60 font-mono">
                loading from relays…
              </div>
            )}

            {!loading && eose && releases.length === 0 && (
              <div className="text-sm text-muted-foreground/70 font-mono py-8">
                no releases published yet
              </div>
            )}

            {paged.length > 0 &&
              (view === "list" ? (
                <div className="rounded border border-border/60 divide-y divide-border/40 overflow-hidden">
                  {paged.map((r) => (
                    <ReleaseRow key={`${r.pubkey}:${r.d}`} release={r} />
                  ))}
                </div>
              ) : view === "grid-sm" ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                  {paged.map((r) => (
                    <ReleaseCard
                      key={`${r.pubkey}:${r.d}`}
                      release={r}
                      density="sm"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {paged.map((r) => (
                    <ReleaseCard key={`${r.pubkey}:${r.d}`} release={r} />
                  ))}
                </div>
              ))}

            {hasMore && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    setShown((s) =>
                      Math.min(s + PAGE_SIZE, visible.length),
                    )
                  }
                  className="font-mono text-[11px] px-4 py-2 border border-border rounded hover:border-primary/50 hover:text-primary transition-colors"
                >
                  load {Math.min(PAGE_SIZE, visible.length - paged.length)}{" "}
                  more
                  <span className="text-muted-foreground/40 ml-2">
                    ({paged.length.toLocaleString()} /{" "}
                    {visible.length.toLocaleString()})
                  </span>
                </button>
              </div>
            )}

            {eose && releases.length > 0 && visible.length === 0 && (
              <div className="text-sm text-muted-foreground/70 font-mono py-4">
                no releases match current filters
              </div>
            )}
          </>
        )}

        <footer className="mt-16 pt-6 border-t border-border/40 text-[10px] text-muted-foreground/40 font-mono">
          a public nostr discography · kind 31237
        </footer>
      </main>
      <NewReleaseFab />
    </div>
  );
}
