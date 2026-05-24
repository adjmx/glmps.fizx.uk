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
  const stats = useMemo(() => {
    const by = (cat: string) =>
      releases.filter((r) => r.category === cat).length;
    return {
      artists: new Set(releases.map((r) => r.artist).filter(Boolean)).size,
      total: releases.length,
      labels: new Set(releases.map((r) => r.label).filter(Boolean)).size,
      album: by("album"),
      ep: by("ep"),
      single: by("single"),
      // misc = every categorised release that isn't album/ep/single
      // (compilation, mix, live, soundtrack, bootleg, miscellaneous, …).
      // Excludes uncategorised releases (no category tag).
      misc: releases.filter(
        (r) => r.category && !["album", "ep", "single"].includes(r.category),
      ).length,
    };
  }, [releases]);

  const hasSubcats =
    stats.album > 0 || stats.ep > 0 || stats.single > 0 || stats.misc > 0;

  return (
    <div
      className={`${bare ? "font-mono" : "rounded-lg border border-border/60 bg-card/30 p-3 font-mono"} ${className}`}
    >
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-2">
        discography
      </div>
      <div className="space-y-1.5 text-[12px]">
        <Row
          label={stats.artists === 1 ? "artist" : "artists"}
          n={stats.artists}
        />
        <Row
          label={stats.total === 1 ? "release" : "releases"}
          n={stats.total}
          accent
        />
        <Row
          label={stats.labels === 1 ? "label" : "labels"}
          n={stats.labels}
        />
        {hasSubcats && (
          <div className="mt-1.5 pt-1.5 border-t border-border/40 space-y-1">
            {stats.album > 0 && (
              <Row
                label={stats.album === 1 ? "album" : "albums"}
                n={stats.album}
              />
            )}
            {(stats.ep > 0 || stats.single > 0) && (
              <Row label="eps & singles" n={stats.ep + stats.single} />
            )}
            {stats.misc > 0 && (
              <Row
                label="comps, mixes, live…"
                n={stats.misc}
                title="compilations, mixes, live, soundtracks, bootlegs & miscellaneous"
              />
            )}
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
