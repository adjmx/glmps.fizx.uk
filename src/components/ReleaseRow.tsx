import { Link } from "react-router-dom";
import { naddrEncode, type Release } from "@/lib/nostr";
import { RELEASE_KIND } from "@/config";
import { useReactions } from "@/hooks/useReactions";
import { displayCount } from "@/lib/rating";
import StarRow from "./StarRow";
import OwnerNaddrCopy from "./OwnerNaddrCopy";
import SourceDot from "./SourceDot";

type Props = { release: Release };

/**
 * Dense single-row layout for the List view. ~38px tall on desktop.
 * Designed to scan 2000+ rows without exhausting visual real estate.
 *
 * Layout notes:
 * - Reactions slot is fixed-width so adding/removing votes doesn't shift
 *   the medium pill column.
 * - Medium pill is also fixed-width (physical/digital differ in glyph
 *   width); pre-allocated to the wider of the two.
 * - Title gets a tooltip so long album names don't lose information when
 *   truncated.
 */
export default function ReleaseRow({ release }: Props) {
  const naddr = naddrEncode(release.pubkey, RELEASE_KIND, release.d);
  const addr = `${RELEASE_KIND}:${release.pubkey}:${release.d}`;
  const { forAddr } = useReactions();
  const { up, down, info } = forAddr(addr);

  return (
    <Link
      to={`/r/${naddr}`}
      className="group flex items-center gap-3 px-2 py-2 rounded hover:bg-muted/30 transition-colors border-b border-border/40"
    >
      <div className="w-8 h-8 rounded shrink-0 bg-muted/50 ring-1 ring-border overflow-hidden flex items-center justify-center">
        {release.image ? (
          <img
            src={release.image}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-[8px] uppercase text-muted-foreground/40 tracking-widest">
            {release.medium === "physical" ? "ph" : "dg"}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 grid grid-cols-[1fr_auto] sm:grid-cols-[1.2fr_1fr_auto] items-center gap-x-3">
        <div className="min-w-0 truncate" title={`${release.artist} – ${release.title}`}>
          <span className="text-accent/80 text-[11px]">{release.artist}</span>
          <span className="text-muted-foreground/30 mx-1.5">·</span>
          <span className="text-[13px] sm:text-sm group-hover:text-primary transition-colors">
            {release.title}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/70 truncate">
          {release.year && <span>{release.year}</span>}
          {release.formatGroup && (
            <>
              <span className="opacity-40">·</span>
              <span className="truncate">{release.formatGroup}</span>
            </>
          )}
          {release.tracks != null && (
            <>
              <span className="opacity-40">·</span>
              <span>{release.tracks} tracks</span>
            </>
          )}
          {release.discs != null && release.discs > 1 && (
            <>
              <span className="opacity-40">·</span>
              <span>{release.discs} discs</span>
            </>
          )}
          {release.label && (
            <>
              <span className="opacity-40">·</span>
              <span className="truncate">{release.label}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Reactions slot — fixed width so layout stays stable whether
              or not a release has any reactions yet. */}
          <span className="w-16 sm:w-20 flex items-center justify-end gap-1 text-[10px] font-mono text-muted-foreground/70">
            <StarRow up={up} down={down} size="xs" showWhenUnrated />
            {info > 0 && <span className="opacity-60">+{displayCount(info)}</span>}
          </span>
          <SourceDot release={release} />
          <span className="w-12 text-right text-[9px] uppercase tracking-widest text-muted-foreground/40 shrink-0">
            {release.medium === "physical" ? "physical" : "digital"}
          </span>
          <OwnerNaddrCopy naddr={naddr} />
        </div>
      </div>
    </Link>
  );
}
