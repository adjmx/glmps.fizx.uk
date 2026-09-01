import { useEffect, useMemo, useRef, useState } from "react";
import Nav from "@/components/Nav";
import AnimatedTitle from "@/components/AnimatedTitle";
import StatsSummary from "@/components/StatsSummary";
import ReleaseCard from "@/components/ReleaseCard";
import ReleaseRow from "@/components/ReleaseRow";
import FilterBar from "@/components/FilterBar";
import ViewToggle, { type ViewMode } from "@/components/ViewToggle";
import RelayStats from "@/components/RelayStats";
import LabelCycler from "@/components/LabelCycler";
import SearchInput from "@/components/SearchInput";
import DotMatrixLoader from "@/components/DotMatrixLoader";
import { useReleases } from "@/hooks/useReleases";
import { useLabelLibrary } from "@/hooks/useLabelLibrary";
import { useTheme, THEME_TITLE } from "@/hooks/useTheme";
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
  const { library } = useLabelLibrary();
  const { theme, cycleTheme } = useTheme();

  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [view, setView] = useState<ViewMode>(() => {
    try {
      const v = localStorage.getItem(VIEW_STORAGE_KEY);
      if (v === "list" || v === "grid-sm" || v === "grid-xs" || v === "grid")
        return v;
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

  // Reset the scroll window when the FILTER changes (a narrower filter must
  // start from the top). Deliberately NOT keyed on releases.length: while the
  // feed streams in from relays, every batch would otherwise reset the window
  // to 60 and fight the auto-advance. A shrinking set is handled gracefully by
  // the slice below (paged just gets shorter; hasMore goes false).
  useEffect(() => {
    setShown(PAGE_SIZE);
  }, [filters]);

  const visible = useMemo(
    () => applyFilters(releases, filters),
    [releases, filters],
  );
  const paged = useMemo(() => visible.slice(0, shown), [visible, shown]);
  const hasMore = visible.length > paged.length;

  // Infinite scroll: a sentinel below the grid auto-advances the window when
  // it nears the viewport — no click needed. Because the full discography is
  // already in memory, we add a brief reveal beat so the loader registers and
  // the scroll reads as a smooth glide rather than an instant snap.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setAdvancing(true);
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
    // Re-key on paged.length so the observer re-evaluates after each advance:
    // observe() emits an immediate callback for the current state, so if the
    // sentinel is still visible it keeps filling, and stops once it isn't —
    // avoids the "sentinel stays in view, no transition, load stalls" trap.
  }, [hasMore, view, paged.length]);

  useEffect(() => {
    if (!advancing) return;
    const t = setTimeout(() => {
      setShown((s) => Math.min(s + PAGE_SIZE, visible.length));
      setAdvancing(false);
    }, 250);
    return () => clearTimeout(t);
  }, [advancing, visible.length]);

  // Gate the labels cell on whether the manifest will populate the
  // cycler. Until ndisc publishes labels.v1, this is false and the hero
  // collapses to 3 columns. (The `labels` count itself moved into
  // StatsSummary, so we don't keep a separate count here anymore.)
  const hasLabelImages = useMemo(() => {
    if (!library) return false;
    return releases.some((r) => r.label && library.labels[r.label]);
  }, [releases, library]);

  // Single-select sync for the FilterBar.label set. Clicking the hero
  // LabelCycler single-selects that label; clicking the same one again
  // (or while it's the sole filter) clears it.
  const activeLabel = useMemo(() => {
    if (filters.label.size !== 1) return undefined;
    const [only] = filters.label;
    return only;
  }, [filters.label]);

  const handleLabelClick = (name: string) => {
    setFilters((prev) => {
      const onlyOne = prev.label.size === 1 && prev.label.has(name);
      return {
        ...prev,
        label: onlyOne ? new Set<string>() : new Set([name]),
      };
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="container max-w-5xl py-8 sm:py-12">
        <div className="mb-8">
          {/* Header — hero card: [title | relays | discography] | labels.
              Genre key + bar moved to the /stats page. */}
          <div className="bg-card border border-border">
            <div className="flex flex-col sm:flex-row sm:divide-x divide-border">
              {/* Left half: top row (title | relays | stats) + search row */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="min-h-[110px] grid grid-cols-1 sm:grid-cols-[10rem_minmax(0,1fr)_10rem] divide-y sm:divide-y-0 sm:divide-x divide-border flex-1">
                  <div className="px-4 py-3 min-w-0 flex flex-col justify-center whitespace-nowrap gap-1">
                    <button
                      type="button"
                      onClick={cycleTheme}
                      title={`Theme: ${theme} — tap to switch`}
                      aria-label={`Colour theme: ${theme}. Tap to switch.`}
                      className="block text-left transition-opacity hover:opacity-70"
                    >
                      <AnimatedTitle
                        accent="glmps"
                        rest=""
                        from={THEME_TITLE[theme].from}
                        to={THEME_TITLE[theme].to}
                        suffixRgba={THEME_TITLE[theme].suffixRgba}
                        fontSize="clamp(28px, 5vw, 40px)"
                      />
                    </button>
                    <span className="self-start rounded-full border border-accent text-accent font-mono text-[10px] px-2 py-0.5">
                      31237
                    </span>
                  </div>
                  {hex && (
                    <div className="px-4 py-3 font-mono flex flex-col justify-center min-w-0">
                      <RelayStats
                        urls={DEFAULT_RELAYS}
                        filter={{ kinds: [RELEASE_KIND], authors: [hex] }}
                      />
                    </div>
                  )}
                  {hex && (
                    <div className="px-4 py-3 flex flex-col justify-center">
                      <StatsSummary releases={releases} bare />
                    </div>
                  )}
                </div>
                <div className="border-t border-border px-4 py-2">
                  <SearchInput
                    value={filters.search}
                    onChange={(v) => setFilters((prev) => ({ ...prev, search: v }))}
                    className="max-w-none"
                    trailing={
                      <>
                        {filters.search && (
                          <button
                            type="button"
                            onClick={() =>
                              setFilters((prev) => ({ ...prev, search: "" }))
                            }
                            title="Clear search"
                            aria-label="Clear search"
                            className="shrink-0 font-mono text-[11px] text-accent hover:text-primary transition-colors flex items-baseline gap-0.5"
                          >
                            <span className="opacity-60">"</span>
                            <span>
                              {filters.search.length > 15
                                ? filters.search.slice(0, 15) + "…"
                                : filters.search}
                            </span>
                            <span className="opacity-60">"</span>
                            <span aria-hidden className="ml-1">×</span>
                          </button>
                        )}
                        {releases.length > 0 && (
                          <span className="shrink-0 whitespace-nowrap text-[11px] font-mono text-muted-foreground/70">
                            {visible.length.toLocaleString()}{" "}
                            {visible.length !== releases.length ? (
                              <span className="opacity-50">
                                / {releases.length.toLocaleString()}{" "}
                                {releases.length === 1 ? "release" : "releases"}
                              </span>
                            ) : (
                              <>{visible.length === 1 ? "release" : "releases"}</>
                            )}
                          </span>
                        )}
                      </>
                    }
                  />
                </div>
              </div>
              {/* Right half: labels column, full card height */}
              {hex && hasLabelImages && (
                <div className="px-4 py-3 font-mono border-t sm:border-t-0 border-border sm:w-[15rem] sm:shrink-0">
                  <LabelCycler
                    releases={releases}
                    library={library}
                    activeLabel={activeLabel}
                    onLabelClick={handleLabelClick}
                  />
                </div>
              )}
            </div>
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
              rightSlot={
                releases.length > 0 ? (
                  <ViewToggle value={view} onChange={setView} />
                ) : null
              }
            />

            {loading && !eose && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground/60 font-mono">
                <DotMatrixLoader />
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
              ) : view === "grid-xs" ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5 sm:gap-2">
                  {paged.map((r) => (
                    <ReleaseCard
                      key={`${r.pubkey}:${r.d}`}
                      release={r}
                      density="xs"
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

            {/* Infinite-scroll sentinel + loader. The sentinel sits just below
                the grid; when it nears the viewport the window advances. */}
            {hasMore && (
              <div
                ref={sentinelRef}
                className="mt-6 flex flex-col items-center gap-2 py-4"
              >
                <DotMatrixLoader />
                <span className="font-mono text-[10px] text-muted-foreground/40 tabular-nums">
                  {paged.length.toLocaleString()} /{" "}
                  {visible.length.toLocaleString()}
                </span>
              </div>
            )}

            {/* End marker — reached the true end of the filtered set. */}
            {!hasMore && paged.length > 0 && (
              <div className="mt-6 flex justify-center py-4">
                <span className="font-mono text-[10px] text-muted-foreground/40 tabular-nums">
                  that’s everything · {visible.length.toLocaleString()}{" "}
                  {visible.length === 1 ? "release" : "releases"}
                </span>
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
