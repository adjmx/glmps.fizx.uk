import { useMemo } from "react";
import type { Release } from "@/lib/nostr";
import { genreLabel } from "@/lib/genre";

type Props = {
  releases: Release[];
  className?: string;
};

/**
 * Horizontal stacked indicator showing the share of releases by primary-slot
 * genre. Primary-only counting (release.v2 §"Aggregation rule") so a
 * multi-tagged release is counted exactly once.
 *
 * Width allocation is sub-linear (share ∝ count^0.7) — a soft tail boost so
 * a dominant slug stays clearly the biggest band but doesn't erase the rest
 * of the catalogue from view. Pure cosmetic; there are no numbers on the bar.
 *
 * Rationale: the first cut went the other way (k ≈ 2.0, amplifying dominance)
 * and made an 88%-electronic library read as 99% pink with the tail squeezed
 * into a single pixel. For a library indicator the opposite curve is wanted —
 * dominance is still legible, but every primary slug that's actually present
 * gets a readable band.
 *
 * Returns null when no releases carry a primary genre, so the surface is
 * silently dormant until ndisc starts emitting v2 events.
 */
const SCALING_EXPONENT = 0.7;

export default function GenreBar({ releases, className = "" }: Props) {
  const segments = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of releases) {
      if (r.genres.length > 0) {
        const p = r.genres[0];
        counts.set(p, (counts.get(p) ?? 0) + 1);
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
      className={`mb-4 w-3/4 mx-auto rounded-lg bg-black/60 p-3 border border-foreground/10 ${className}`}
      aria-label="release count by primary genre"
    >
      <div className="flex h-1.5 gap-px overflow-hidden">
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
    </div>
  );
}

