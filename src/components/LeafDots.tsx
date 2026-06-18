/**
 * LeafDots — the suite's diagrammatic quantity glyph, after ndisc / ndisc.tree's
 * `LeafIcon.tsx`. Each track is one small leaf-green dot; the cluster itself is
 * the count, exact figure on hover. Packs into an optimal grid. Nothing renders
 * for 0; capped at `max`.
 *
 * These web consumers only know the release's expected total (the release.v2
 * `tracks` tag), so every dot is solid — there's no present/missing split like
 * ndisc's local-file scan. Green (`rgb(74 222 128)` = ndisc's `--c-ok`) is
 * inlined deliberately: it's a semantic suite glyph, NOT part of either site's
 * brand palette, so this file stays byte-identical across the coral (upleb) /
 * emerald (fizx) fork.
 */

// Optimal column count for `n` dots within `maxCols`: a single row up to the
// smaller of 5 / maxCols, then the fewest balanced rows that fit. Ported
// verbatim from ndisc's LeafIcon.tsx.
function dotCols(n: number, maxCols: number): number {
  if (n <= Math.min(5, maxCols)) return n;
  const rows = Math.ceil(n / maxCols);
  return Math.ceil(n / rows);
}

export function LeafDots({
  n,
  max = 99,
  maxCols = 8,
  className,
}: {
  n: number | null | undefined;
  max?: number;
  maxCols?: number;
  className?: string;
}) {
  const shown = Math.min(Math.max(n ?? 0, 0), max);
  if (shown <= 0) return null;
  const cols = dotCols(shown, maxCols);
  const capped = (n ?? 0) > max;
  const title = `${shown}${capped ? "+" : ""} track${shown === 1 ? "" : "s"}`;
  return (
    <span
      className={`inline-grid gap-[2px] w-max${className ? ` ${className}` : ""}`}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      title={title}
      aria-label={title}
    >
      {Array.from({ length: shown }, (_, i) => (
        <span
          key={i}
          className="w-1 h-1 rounded-full"
          style={{ backgroundColor: "rgb(74 222 128 / 0.75)" }}
        />
      ))}
    </span>
  );
}
