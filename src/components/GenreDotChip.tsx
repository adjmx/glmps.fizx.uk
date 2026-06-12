import { genreLabel, type GenreSlug } from "@/lib/genre";

type Props = {
  genres: readonly GenreSlug[];
  className?: string;
};

/**
 * Compact pill of up-to-3 colored dots representing genre slugs. Shared
 * between LabelCycler (top primaries per label) and ReleaseCard (this
 * release's v2 genre slots) so the genre signal reads the same wherever
 * it appears. Returns null when there are no genres to show.
 */
export default function GenreDotChip({ genres, className = "" }: Props) {
  if (genres.length === 0) return null;
  return (
    <span
      className={`inline-flex items-center gap-px shrink-0 px-1.5 py-0.5 rounded-full border border-foreground/10 bg-black/40 ${className}`}
      title={genres.map(genreLabel).join(" · ")}
    >
      {genres.map((g) => (
        <span
          key={g}
          className="w-2 h-2 rounded-full ring-1 ring-foreground/10"
          style={{ backgroundColor: `rgb(var(--c-g-${g}))` }}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
