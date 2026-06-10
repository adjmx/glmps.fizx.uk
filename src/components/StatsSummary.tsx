import { useMemo } from "react";
import type { Release } from "@/lib/nostr";

type Props = {
  releases: Release[];
  className?: string;
  // When true, skip the rounded-lg/border/bg outer card styling so the stats
  // can be embedded cleanly inside an outer container (e.g. the hero card).
  bare?: boolean;
};

export default function StatsSummary({ releases, className = "", bare = false }: Props) {
  const stats = useMemo(
    () => ({
      artists: new Set(releases.map((r) => r.artist).filter(Boolean)).size,
      total: releases.length,
      labels: new Set(releases.map((r) => r.label).filter(Boolean)).size,
    }),
    [releases],
  );

  return (
    <div
      className={`${bare ? "font-mono" : "rounded-lg border border-border/60 bg-card/30 p-3 font-mono"} ${className}`}
    >
      <div className="flex flex-col gap-1.5 text-[11px]">
        <Row
          label={stats.total === 1 ? "release" : "releases"}
          n={stats.total}
          valueClass="text-primary"
        />
        <Row
          label={stats.artists === 1 ? "artist" : "artists"}
          n={stats.artists}
          valueClass="text-accent"
        />
        <Row
          label={stats.labels === 1 ? "label" : "labels"}
          n={stats.labels}
          valueClass="text-foreground"
        />
      </div>
    </div>
  );
}

function Row({
  label,
  n,
  valueClass,
  title,
}: {
  label: string;
  n: number;
  valueClass?: string;
  title?: string;
}) {
  // Row chrome (border, padding, gap) mirrors RelayStats so the two columns
  // read as a parallel data band. The value stays visually prominent at 18px,
  // but `leading-none` keeps line-height tight so the row doesn't tower over
  // the 11px-bodied relay row beside it — heights end up roughly matched.
  return (
    <div
      className="flex items-center gap-2 text-[11px] px-2 py-1 border border-border/60 rounded bg-card/40"
      title={title}
    >
      <span className="font-mono text-foreground/70 flex-1 truncate">
        {label}
      </span>
      <span
        className={`font-sans tabular-nums font-bold tracking-tight text-[18px] leading-none shrink-0 ${
          valueClass ?? "text-primary"
        }`}
      >
        {n}
      </span>
    </div>
  );
}
