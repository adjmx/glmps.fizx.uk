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
      <div className="space-y-1.5 text-[12px]">
        <Row
          label={stats.total === 1 ? "release" : "releases"}
          n={stats.total}
          accent
        />
        <Row
          label={stats.artists === 1 ? "artist" : "artists"}
          n={stats.artists}
          accent
        />
        <Row
          label={stats.labels === 1 ? "label" : "labels"}
          n={stats.labels}
          accent
        />
      </div>
    </div>
  );
}

function Row({
  label,
  n,
  accent,
  title,
}: {
  label: string;
  n: number;
  accent?: boolean;
  title?: string;
}) {
  return (
    <div className="flex justify-between items-baseline gap-4" title={title}>
      <span className={accent ? "text-foreground/90" : "text-foreground/70"}>
        {label}
      </span>
      <span
        className={`tabular-nums ${accent ? "text-primary font-semibold text-[12px]" : "text-accent"}`}
      >
        {n.toLocaleString()}
      </span>
    </div>
  );
}
