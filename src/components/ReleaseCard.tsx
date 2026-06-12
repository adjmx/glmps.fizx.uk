import { Link } from "react-router-dom";
import { naddrEncode, type Release } from "@/lib/nostr";
import { RELEASE_KIND } from "@/config";
import { cn } from "@/lib/cn";
import { useReactions } from "@/hooks/useReactions";
import { displayCount } from "@/lib/rating";
import StarRow from "./StarRow";
import OwnerNaddrCopy from "./OwnerNaddrCopy";
import GenreDotChip from "./GenreDotChip";

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
        "group block rounded-lg border border-border bg-card hover:border-primary/40",
        "transition-colors overflow-hidden",
      )}
    >
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
          isSm ? "p-2 space-y-0.5" : "p-3 sm:p-4 space-y-1.5",
        )}
      >
        <GenreDotChip genres={release.genres} />
        <div
          className={cn(
            "uppercase tracking-wider text-accent/70 truncate text-[10px]",
          )}
        >
          {release.artist}
        </div>
        <h3
          className={cn(
            "font-medium group-hover:text-primary transition-colors",
            isSm
              ? "text-[10px] leading-tight line-clamp-1"
              : "text-sm sm:text-base leading-snug line-clamp-2",
          )}
        >
          {release.title}
        </h3>

        {/* Facets row: year · format · label · country. Same text-[10px] in
            compact so artist / title / meta sit on one tight visual rhythm.
            Tag chips still dropped in compact — too noisy at <200px widths. */}
        {facets && (
          <div
            className={cn(
              "text-muted-foreground/85 truncate",
              isSm ? "text-[10px]" : "text-[11px]",
            )}
          >
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

        {(isSm || up > 0 || down > 0 || info > 0) && (
          <div
            className={cn(
              "flex items-center gap-2 font-mono text-muted-foreground/70",
              isSm ? "text-[9px]" : "text-[10px] pt-1",
            )}
          >
            <StarRow up={up} down={down} size="xs" showWhenUnrated={isSm} />
            {info > 0 && <span>· {displayCount(info)} + info</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
