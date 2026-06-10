import { Link } from "react-router-dom";
import { naddrEncode, type Release } from "@/lib/nostr";
import { RELEASE_KIND } from "@/config";
import { cn } from "@/lib/cn";
import { useReactions } from "@/hooks/useReactions";
import { displayCount } from "@/lib/rating";
import { genreLabel } from "@/lib/genre";
import StarRow from "./StarRow";
import OwnerNaddrCopy from "./OwnerNaddrCopy";

// release.v2 — left-edge genre bar uses slot-proportional weights from the
// proposal: 60 / 30 / 10. Missing slots renormalise so a single slot fills.
const SLOT_WEIGHTS = [0.6, 0.3, 0.1];

export type CardDensity = "default" | "sm";

type Props = {
  release: Release;
  density?: CardDensity;
};

export default function ReleaseCard({ release, density = "default" }: Props) {
  const naddr = naddrEncode(release.pubkey, RELEASE_KIND, release.d);
  const addr = `${RELEASE_KIND}:${release.pubkey}:${release.d}`;
  const { forAddr } = useReactions();
  const { up, down, info } = forAddr(addr);
  const facets = [release.year, release.formatGroup, release.label, release.country]
    .filter(Boolean)
    .join(" · ");

  const isSm = density === "sm";
  const isPhysical = release.medium === "physical";

  return (
    <Link
      to={`/r/${naddr}`}
      title={`${release.artist} – ${release.title}`}
      className={cn(
        "group relative block rounded-lg border border-border bg-card hover:border-primary/40",
        "transition-colors overflow-hidden",
      )}
    >
      {release.genres.length > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 z-10 pointer-events-none flex flex-col"
          aria-hidden="true"
          title={release.genres.map((g) => genreLabel(g)).join(" · ")}
        >
          {release.genres.map((g, i) => {
            const total = release.genres.reduce(
              (acc, _, idx) => acc + SLOT_WEIGHTS[idx],
              0,
            );
            return (
              <div
                key={i}
                style={{
                  height: `${(SLOT_WEIGHTS[i] / total) * 100}%`,
                  backgroundColor: `rgb(var(--c-g-${g}))`,
                }}
              />
            );
          })}
        </div>
      )}
      <div className="relative aspect-square bg-gradient-to-br from-muted/40 to-card flex items-center justify-center text-muted-foreground/30 text-xs">
        <div className="absolute top-1.5 left-1.5 z-10">
          <span
            title={isPhysical ? "physical release" : "digital release"}
            className={cn(
              "inline-flex items-center gap-1 rounded border bg-card/80 backdrop-blur-sm font-mono uppercase tracking-widest",
              isSm ? "text-[8px] px-1 py-0.5" : "text-[9px] px-1.5 py-0.5",
              isPhysical
                ? "border-accent/40 text-accent/90"
                : "border-border text-muted-foreground/60",
            )}
          >
            <svg
              width="6"
              height="6"
              viewBox="0 0 6 6"
              aria-hidden="true"
              className="shrink-0"
            >
              <circle
                cx="3"
                cy="3"
                r="2.2"
                fill={isPhysical ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
            {!isSm && (isPhysical ? "physical" : "digital")}
          </span>
        </div>
        <div className="absolute top-1.5 right-1.5 z-10 flex gap-1">
          <OwnerNaddrCopy naddr={naddr} />
        </div>
        {release.image ? (
          <img
            src={release.image}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span
            className={cn(
              "font-mono uppercase tracking-widest",
              isSm && "text-[9px]",
            )}
          >
            {release.medium === "physical" ? "physical" : "digital"}
          </span>
        )}
      </div>

      <div
        className={cn(
          isSm ? "p-2 space-y-1" : "p-3 sm:p-4 space-y-1.5",
        )}
      >
        <div
          className={cn(
            "uppercase tracking-wider text-accent/70 truncate",
            isSm ? "text-[9px]" : "text-[10px]",
          )}
        >
          {release.artist}
        </div>
        <h3
          className={cn(
            "font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2",
            isSm ? "text-xs sm:text-[13px]" : "text-sm sm:text-base",
          )}
        >
          {release.title}
        </h3>

        {/* Drop facets row + tag chips at small density — visually noisy
            at <200px card widths and rarely useful for at-a-glance scanning. */}
        {!isSm && facets && (
          <div className="text-[11px] text-muted-foreground/85 truncate">
            {facets}
          </div>
        )}
        {!isSm && release.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {release.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {(up > 0 || down > 0 || info > 0) && (
          <div
            className={cn(
              "flex items-center gap-2 font-mono text-muted-foreground/70",
              isSm ? "text-[9px]" : "text-[10px] pt-1",
            )}
          >
            <StarRow up={up} down={down} size="xs" />
            {info > 0 && <span>· {displayCount(info)} + info</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
