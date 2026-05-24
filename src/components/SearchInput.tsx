import { cn } from "@/lib/cn";

type Props = {
  value: string;
  onChange: (v: string) => void;
  className?: string;
};

/**
 * Search field used at the hero level (bound to FilterState.search via the
 * page). Was originally inline with the FilterBar chip row; promoted out so
 * the typing area gets full title-cell width instead of competing with the
 * facet chips' flex-wrap budget.
 */
export default function SearchInput({ value, onChange, className }: Props) {
  return (
    <div className={cn("relative w-full max-w-[16rem]", className)}>
      <svg
        className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 opacity-40 pointer-events-none"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <circle cx="7" cy="7" r="5" />
        <path d="M10.5 10.5L14 14" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="search title, artist, notes…"
        className={cn(
          "w-full font-mono text-[11px] pl-7 pr-2 py-1 rounded border bg-card",
          "border-border focus:border-primary/50 focus:outline-none",
          "placeholder:text-muted-foreground/40",
        )}
      />
    </div>
  );
}
