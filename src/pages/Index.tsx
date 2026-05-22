import { useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import AnimatedTitle from "@/components/AnimatedTitle";
import StatsSummary from "@/components/StatsSummary";
import ReleaseCard from "@/components/ReleaseCard";
import ReleaseRow from "@/components/ReleaseRow";
import FilterBar from "@/components/FilterBar";
import ViewToggle, { type ViewMode } from "@/components/ViewToggle";
import RelayStats from "@/components/RelayStats";
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

  const labelCount = useMemo(
    () => new Set(releases.map((r) => r.label).filter(Boolean)).size,
    [releases],
  );

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="container max-w-5xl py-8 sm:py-12">
        <div className="mb-8">
          {/* Header — hero card: title | relays | discography | labels */}
          <div className="bg-card border border-border min-h-[110px] grid grid-cols-1 sm:grid-cols-[auto_1fr_0.96fr_7rem] divide-y sm:divide-y-0 sm:divide-x divide-border">
            <div className="px-4 py-3 min-w-0 flex flex-col">
              <div className="flex items-start gap-1.5">
                <AnimatedTitle
                  accent="glmps"
                  rest=""
                  from="#34d399"
                  to="#a78bfa"
                  suffixRgba="rgba(52,211,153,0.55)"
                  fontSize="clamp(28px, 5vw, 40px)"
                />
                <span className="mt-2.5 inline-block rounded-full border border-accent text-accent font-mono text-[10px] px-2 py-0.5 shrink-0">
                  31237
                </span>
              </div>
            </div>
            {hex && (
              <div className="px-4 py-3 flex flex-col gap-1.5 font-mono">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  relays
                </div>
                <RelayStats
                  urls={DEFAULT_RELAYS}
                  filter={{ kinds: [RELEASE_KIND], authors: [hex] }}
                />
              </div>
            )}
            {hex && (
              <div className="px-4 py-3 flex flex-col">
                <StatsSummary releases={releases} bare />
              </div>
            )}
            {hex && (
              <div className="px-4 py-3 flex flex-col gap-1.5 font-mono">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  labels
                </div>
                <div className="text-primary font-semibold text-[12px] tabular-nums">
                  {labelCount.toLocaleString()}
                </div>
              </div>
            )}
          </div>
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

      </main>
      {/* Footer — cross-site chips */}
      <footer className="border-t border-border px-6 py-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs font-mono">
          <div className="flex items-center gap-4">
            <a href="https://ln.fizx.uk" className="flex items-center gap-1.5 text-muted-foreground/60 hover:text-primary transition-colors">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#a78bfa" aria-hidden="true">
                <path d="M13 2L4.5 13.5H11L10 22L20.5 10.5H14L13 2z"/>
              </svg>
              <span>ln<span className="text-muted-foreground/40">.fizx.uk</span></span>
            </a>
            <a href="https://recipes.fizx.uk" className="flex items-center gap-1.5 text-muted-foreground/60 hover:text-primary transition-colors">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              <span>recipes<span className="text-muted-foreground/40">.fizx.uk</span></span>
            </a>
            <a href="https://relay.fizx.uk" className="flex items-center gap-1.5 text-muted-foreground/60 hover:text-primary transition-colors">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/>
              </svg>
              <span>relay<span className="text-muted-foreground/40">.fizx.uk</span></span>
            </a>
          </div>
          <span className="text-primary/60">✦ built with claude</span>
        </div>
      </footer>
    </div>
  );
}
