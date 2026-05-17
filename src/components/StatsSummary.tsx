import { useMemo } from "react";
import type { Release } from "@/lib/nostr";

type Props = {
  releases: Release[];
  className?: string;
};

export default function StatsSummary({ releases, className = "" }: Props) {
  const stats = useMemo(() => {
    const by = (cat: string) =>
      releases.filter((r) => r.category === cat).length;
    return {
      total: releases.length,
      album: by("album"),
      ep: by("ep"),
      single: by("single"),
      misc: by("miscellaneous"),
    };
  }, [releases]);

  const hasSubcats =
    stats.album > 0 || stats.ep > 0 || stats.single > 0 || stats.misc > 0;

  return (
    <div
      className={`rounded-lg border border-border/60 bg-card/30 p-3 font-mono ${className}`}
    >
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-2">
        discography
      </div>
      <div className="space-y-1.5 text-[12px]">
        <Row
          label={stats.total === 1 ? "release" : "releases"}
          n={stats.total}
          accent
        />
        {hasSubcats && (
          <div className="mt-1.5 pt-1.5 border-t border-border/40 space-y-1">
            {stats.album > 0 && (
              <Row
                label={stats.album === 1 ? "album" : "albums"}
                n={stats.album}
              />
            )}
            {stats.ep > 0 && (
              <Row label={stats.ep === 1 ? "ep" : "eps"} n={stats.ep} />
            )}
            {stats.single > 0 && (
              <Row
                label={stats.single === 1 ? "single" : "singles"}
                n={stats.single}
              />
            )}
            {stats.misc > 0 && <Row label="misc" n={stats.misc} />}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  n,
  accent,
}: {
  label: string;
  n: number;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between items-baseline gap-4">
      <span className={accent ? "text-foreground/90" : "text-foreground/70"}>
        {label}
      </span>
      <span
        className={`tabular-nums ${accent ? "text-primary font-semibold text-[16px]" : "text-accent"}`}
      >
        {n.toLocaleString()}
      </span>
    </div>
  );
}
