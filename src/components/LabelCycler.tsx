import { useEffect, useMemo, useState } from "react";
import type { LabelLibrary, Release } from "@/lib/nostr";
import { type GenreSlug } from "@/lib/genre";
import GenreDotChip from "./GenreDotChip";

/**
 * Top genre slugs for the label, ranked by any-slot count (ties broken
 * alphabetically). Per `schema/visualisations.md` `genre-dominant-of-set`:
 * a release with N distinct slugs contributes N tallies. Returns up to
 * `max` slugs — fewer when the label has fewer distinct genres, empty
 * when no release on the label carries any genre.
 */
function topGenresForLabel(
  counts: Map<string, number>,
  max: number,
): GenreSlug[] {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, max)
    .map(([slug]) => slug as GenreSlug);
}

type Props = {
  releases: Release[];
  library: LabelLibrary | null;
  activeLabel?: string;
  onLabelClick: (name: string) => void;
  intervalMs?: number;
};

/**
 * Auto-cycles through the owner's label images (labels.v1 manifest) for
 * labels that actually appear in the current release set. Click the image
 * to single-select that label as a discography filter — same effect as
 * picking it from the FilterBar dropdown. Cycle pauses on hover; prev/next
 * chevrons let viewers flip through labels manually.
 *
 * Returns null when no labels have manifest entries — the hero cell
 * collapses to header + count, no broken-image flicker.
 */
export default function LabelCycler({
  releases,
  library,
  activeLabel,
  onLabelClick,
  intervalMs = 4000,
}: Props) {
  // Distinct labels in the release set that also have an image in the
  // manifest. Sorted by release count desc, ties broken alphabetically.
  // Each entry carries its top-3 any-slot genres for the colored dot chip
  // beside the label name (see schema/visualisations.md).
  const entries = useMemo(() => {
    if (!library) return [];
    type Agg = { count: number; genreCounts: Map<string, number> };
    const agg = new Map<string, Agg>();
    for (const r of releases) {
      if (!r.label || !library.labels[r.label]) continue;
      const e = agg.get(r.label) ?? { count: 0, genreCounts: new Map() };
      e.count += 1;
      for (const g of r.genres) {
        e.genreCounts.set(g, (e.genreCounts.get(g) ?? 0) + 1);
      }
      agg.set(r.label, e);
    }
    return Array.from(agg.entries())
      .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
      .map(([name, { count, genreCounts }]) => ({
        name,
        count,
        image: library.labels[name].image,
        topGenres: topGenresForLabel(genreCounts, 3),
      }));
  }, [releases, library]);

  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  // Keep idx valid if the set shrinks (e.g. release feed updates).
  useEffect(() => {
    if (idx >= entries.length && entries.length > 0) setIdx(0);
  }, [entries.length, idx]);

  // Auto-cycle when not hovered + there's more than one entry.
  useEffect(() => {
    if (paused || entries.length <= 1) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % entries.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [paused, entries.length, intervalMs]);

  if (entries.length === 0) return null;

  const current = entries[idx % entries.length];
  const isActive = activeLabel === current.name;
  const step = (dir: number) =>
    setIdx((i) => (i + dir + entries.length) % entries.length);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`rounded-lg border overflow-hidden transition-colors font-mono ${
        isActive
          ? "border-primary"
          : "border-border hover:border-primary/40"
      }`}
    >
      <div className="flex items-stretch">
        {entries.length > 1 && (
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous label"
            title="Previous label"
            className="shrink-0 w-5 grid place-items-center text-foreground/60 hover:bg-card/60 hover:text-primary transition-colors"
          >
            <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="10 3 5 8 10 13" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <button
          type="button"
          onClick={() => onLabelClick(current.name)}
          className="flex-1 min-w-0 block text-left"
          title={isActive ? `Clear ${current.name} filter` : `Filter by ${current.name}`}
          aria-label={`Filter releases by label ${current.name}`}
        >
          <div className="aspect-square p-[5%]">
            <img
              key={current.name}
              src={current.image}
              alt={current.name}
              className="w-full h-full object-contain mix-blend-screen animate-in fade-in duration-700"
            />
          </div>
        </button>
        {entries.length > 1 && (
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next label"
            title="Next label"
            className="shrink-0 w-5 grid place-items-center text-foreground/60 hover:bg-card/60 hover:text-primary transition-colors"
          >
            <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="6 3 11 8 6 13" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
      <div className="px-2 py-1 flex flex-col gap-1 text-[9px]">
        <GenreDotChip genres={current.topGenres} className="self-start" />
        <div className="flex items-center justify-between gap-1">
          <span
            className={`truncate ${isActive ? "text-primary" : "text-foreground/70"}`}
            title={current.name}
          >
            {current.name}
          </span>
          <span className="shrink-0 tabular-nums text-muted-foreground/60">
            {current.count}
          </span>
        </div>
      </div>
    </div>
  );
}
