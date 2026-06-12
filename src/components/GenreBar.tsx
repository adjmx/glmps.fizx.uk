import { useMemo } from "react";
import type { Release } from "@/lib/nostr";
import { genreLabel } from "@/lib/genre";

type Props = {
  releases: Release[];
  className?: string;
};

/**
 * Horizontal stacked indicator showing the share of releases by genre.
 * Any-slot counting per `schema/visualisations.md` `genre-distribution` —
 * a release with N distinct slugs contributes N tallies (one per slug).
 * v2.1's pure-peer model means secondary/tertiary genres are equally
 * part of a release's sound; slot order on the wire is emission priority
 * only, not aggregation weight.
 *
 * Width allocation is sub-linear (share ∝ count^0.5, i.e. square-root) —
 * a strong tail boost so a heavily dominant slug doesn't drown the rest
 * of the catalogue. Pure cosmetic; there are no numbers on the bar.
 *
 * Per-genre counts live in the FilterBar dropdown when accurate numbers
 * matter. Returns null when no releases carry any genre tag, so the
 * surface is silently dormant until ndisc emits v2 events.
 */
const SCALING_EXPONENT = 0.5;

export default function GenreBar({ releases, className = "" }: Props) {
  const segments = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of releases) {
      for (const g of r.genres) {
        counts.set(g, (counts.get(g) ?? 0) + 1);
      }
    }
    const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    const sorted = Array.from(counts.entries()).sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );
    const scaled = sorted.map(([, n]) => Math.pow(n, SCALING_EXPONENT));
    const scaledSum = scaled.reduce((a, b) => a + b, 0);
    return sorted.map(([slug, n], i) => ({
      slug,
      n,
      pct: (scaled[i] / scaledSum) * 100,
    }));
  }, [releases]);

  if (segments.length === 0) return null;

  return (
    <div
      className={`rounded-lg bg-background p-3 border border-foreground/10 ${className}`}
      aria-label="release count by primary genre"
    >
      <div className="flex h-1.5 gap-0.5 overflow-hidden">
        {segments.map(({ slug, n, pct }) => (
          <div
            key={slug}
            style={{
              width: `${pct}%`,
              minWidth: "2px",
              backgroundColor: `rgb(var(--c-g-${slug}))`,
            }}
            title={`${genreLabel(slug)}: ${n}`}
          />
        ))}
      </div>
      {/* Legend strip — every present primary slug as a colored dot + name.
          Ordering mirrors the bar (count desc, ties alphabetical), so chip
          position = bar position. Per-genre counts live in the FilterBar's
          genre facet dropdown rather than here. */}
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-mono">
        {segments.map(({ slug }) => (
          <span key={slug} className="inline-flex items-center gap-1 shrink-0">
            <span
              className="w-1 h-2 shrink-0"
              style={{ backgroundColor: `rgb(var(--c-g-${slug}))` }}
              aria-hidden="true"
            />
            <span className="text-foreground/75">{genreLabel(slug)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

