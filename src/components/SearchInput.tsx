import { cn } from "@/lib/cn";

type Props = {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  // Optional element appended to the right of the input, inside the same
  // bordered shell — used by the discography page for the active-search chip
  // so the field + feedback read as a single control.
  trailing?: React.ReactNode;
};

/**
 * Search field used at the hero level (bound to FilterState.search via the
 * page). Renders the input + an optional `trailing` element (the cleared-on-
 * click search chip) inside a single rounded bordered shell with a black bg
 * so the two read as one control. `focus-within` highlights the shell when
 * the input is active.
 */
export default function SearchInput({ value, onChange, className, trailing }: Props) {
  return (
    <div
      className={cn(
        "relative w-full max-w-[16rem] flex items-center gap-1.5 pl-7 pr-1.5 py-1",
        "rounded border bg-black/60 border-border focus-within:border-primary/50 transition-colors",
        className,
      )}
    >
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
        maxLength={30}
        className={cn(
          "flex-1 min-w-0 font-mono text-[11px] bg-transparent border-0 outline-none",
          "placeholder:text-muted-foreground/40",
        )}
      />
      {trailing}
    </div>
  );
}
