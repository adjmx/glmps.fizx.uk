import { useEffect, useMemo, useState } from "react";
import type { LabelLibrary, Release } from "@/lib/nostr";

type Props = {
  releases: Release[];
  library: LabelLibrary | null;
  activeLabel?: string;
  onLabelClick: (name: string) => void;
  intervalMs?: number;
};

/**
 * Auto-cycles through the owner's label images (labels.v1 manifest) for
 * labels that actually appear in the current release set. Click an image
 * to single-select that label as a discography filter — same effect as
 * picking it from the FilterBar dropdown. Cycle pauses on hover.
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
  const entries = useMemo(() => {
    if (!library) return [];
    const counts = new Map<string, number>();
    for (const r of releases) {
      if (r.label && library.labels[r.label]) {
        counts.set(r.label, (counts.get(r.label) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({
        name,
        count,
        image: library.labels[name].image,
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

  return (
    <div
      className="flex flex-col gap-1"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <button
        type="button"
        onClick={() => onLabelClick(current.name)}
        className={`w-full aspect-square rounded border bg-card/30 overflow-hidden transition-colors ${
          isActive
            ? "border-primary"
            : "border-border/60 hover:border-primary/60"
        }`}
        title={isActive ? `Clear ${current.name} filter` : `Filter by ${current.name}`}
        aria-label={`Filter releases by label ${current.name}`}
      >
        <img
          key={current.name}
          src={current.image}
          alt={current.name}
          className="w-full h-full object-contain animate-in fade-in duration-700"
        />
      </button>
      <div className="flex items-center justify-between gap-1 text-[9px]">
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
  );
}
