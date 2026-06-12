import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import Nav from "@/components/Nav";
import ReactionSummary from "@/components/ReactionSummary";
import { hostnameOf, naddrDecode, type Release } from "@/lib/nostr";
import { useReleaseByAddr } from "@/hooks/useReleaseByAddr";
import { useLabelLibrary, imageForLabel } from "@/hooks/useLabelLibrary";
import { genreLabel, type GenreSlug } from "@/lib/genre";
import { RELEASE_KIND } from "@/config";

export default function ReleasePage() {
  const { naddr = "" } = useParams();

  const query = useMemo(() => {
    try {
      return naddrDecode(naddr);
    } catch {
      return null;
    }
  }, [naddr]);

  const { release, loading, eose } = useReleaseByAddr(query);

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="container max-w-2xl py-6 sm:py-10">
      <div className="mb-6">
        <Link
          to="/"
          className="text-[11px] font-mono text-muted-foreground/60 hover:text-primary transition-colors"
        >
          ← back to discography
        </Link>
      </div>

      {!query && (
        <div className="text-sm text-red-400 font-mono">
          invalid naddr in URL
        </div>
      )}

      {query && loading && !eose && (
        <div className="text-xs text-muted-foreground/60 font-mono">
          loading from relays…
        </div>
      )}

      {query && eose && !release && (
        <div className="text-sm text-muted-foreground/70 font-mono">
          release not found (or deleted)
        </div>
      )}

      {release && <ReleaseDetail release={release} naddr={naddr} />}
      </main>
    </div>
  );
}

function ReleaseDetail({ release, naddr }: { release: Release; naddr: string }) {
  const addr = `${RELEASE_KIND}:${release.pubkey}:${release.d}`;
  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <div className="text-[11px] uppercase tracking-widest text-accent">
          {release.artist}
        </div>
        <h1 className="font-semibold leading-[1.1] text-[clamp(28px,5vw,40px)]">
          {release.title}
        </h1>
        <div className="text-xs sm:text-sm text-muted-foreground">
          {[release.year, release.medium, release.formatGroup, release.label, release.country]
            .filter(Boolean)
            .join(" · ")}
        </div>
        {release.source && hostnameOf(release.source) && (
          <div className="text-xs">
            <a
              href={release.source}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-muted-foreground/70 hover:text-primary transition-colors"
            >
              view on {hostnameOf(release.source)} ↗
            </a>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[24rem_16rem] gap-6 items-start">
        {release.image && (
          <img
            src={release.image}
            alt=""
            className="w-full max-w-[24rem] rounded-lg border border-border"
          />
        )}
        <div className="space-y-3">
          <ReactionSummary addr={addr} />
          <LabelSlot label={release.label} />
        </div>
      </div>

      {release.notes && (
        <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90 max-w-prose">
          {release.notes}
        </div>
      )}

      <dl className="grid grid-cols-1 lg:grid-cols-[24rem_16rem] gap-x-6 gap-y-3 text-sm">
        <Field label="type" value={release.type} />
        <Field label="category" value={release.category} />
        <GenresField genres={release.genres} />
        <Field label="medium" value={release.medium} />
        <Field label="format" value={release.format} />
        <Field label="year" value={release.year} />
        <Field label="label" value={release.label} />
        <Field label="catalog" value={release.catalog} />
        <Field label="country" value={release.country} />
        <Field label="condition" value={release.condition} />
      </dl>

      {release.tags.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-2">
            tags
          </div>
          <div className="flex flex-wrap gap-1.5">
            {release.tags.map((t) => (
              <span
                key={t}
                className="text-[11px] px-2 py-0.5 rounded bg-muted/60 text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {release.externalIds.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-2">
            external ids
          </div>
          <ul className="text-xs font-mono text-muted-foreground space-y-1">
            {release.externalIds.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-6 border-t border-border/40 text-[10px] text-muted-foreground/40 font-mono break-all">
        naddr: {naddr}
      </div>
    </article>
  );
}

/**
 * Square card under the reactions panel. Renders the record-label image
 * looked up from the owner's labels.v1 manifest (kind:31238) by release.label.
 * Falls back to a generic glyph when the label is unmapped or the manifest
 * doesn't exist yet (ndisc publisher impl pending — see schema/labels.v1.json).
 */
function LabelSlot({ label }: { label?: string }) {
  const { library } = useLabelLibrary();
  const url = imageForLabel(library, label);
  return (
    <div className="w-full aspect-square rounded-lg border border-border/60 bg-card/30 flex items-center justify-center overflow-hidden">
      {url ? (
        <img
          src={url}
          alt={label}
          className="w-full h-full object-contain"
        />
      ) : (
        <img
          src="/icons/label-fallback.svg"
          alt=""
          aria-hidden
          className="w-1/3 h-1/3 opacity-40"
        />
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <dt className="text-[10px] uppercase tracking-widest text-muted-foreground/50 w-20 mt-1 shrink-0">
        {label}
      </dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

/**
 * release.v2 — ordered 0–3 genre slots displayed as a row of colored dots +
 * names. Slot 0 (the primary) comes first. Hidden when the release carries no
 * genre tags. Slug → label via `genreLabel` (preserves the `soundtrack` → `film`
 * override and the compound-slug slash rule).
 */
function GenresField({ genres }: { genres: readonly GenreSlug[] }) {
  if (genres.length === 0) return null;
  return (
    <div className="flex gap-3">
      <dt className="text-[10px] uppercase tracking-widest text-muted-foreground/50 w-20 mt-1 shrink-0">
        genre
      </dt>
      <dd className="text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
        {genres.map((g) => (
          <span key={g} className="inline-flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full ring-1 ring-foreground/10 shrink-0"
              style={{ backgroundColor: `rgb(var(--c-g-${g}))` }}
              aria-hidden="true"
            />
            <span>{genreLabel(g)}</span>
          </span>
        ))}
      </dd>
    </div>
  );
}
