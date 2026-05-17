import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { usePopover } from "@/hooks/usePopover";

type Props = {
  label: string; // e.g. "format"
  options: string[]; // distinct values, in display order
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  emptyLabel?: string; // shown when nothing selected (default: "any")
  // When provided, a search input appears above the list. Typing filters
  // matches from this full superset; an empty query falls back to `options`.
  searchableOptions?: string[];
};

/**
 * Compact facet trigger + popover panel. Multi-select within the popover;
 * the button label collapses to "<label>: any" / "<label>: <value>" /
 * "<label>: <n> selected" depending on selection count.
 */
export default function FacetButton({
  label,
  options,
  selected,
  onChange,
  emptyLabel = "any",
  searchableOptions,
}: Props) {
  const { open, toggle, close, ref } = usePopover<HTMLDivElement>();
  const [query, setQuery] = useState("");

  const visibleOptions = useMemo(() => {
    if (!searchableOptions) return options;
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return searchableOptions.filter((o) => o.toLowerCase().includes(q));
  }, [options, searchableOptions, query]);

  const toggleValue = (v: string) => {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(next);
  };

  const clear = () => onChange(new Set());

  const summary =
    selected.size === 0
      ? emptyLabel
      : selected.size === 1
        ? Array.from(selected)[0]
        : `${selected.size} selected`;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "font-mono text-[11px] px-2 py-1 border rounded transition-colors flex items-center gap-1.5 max-w-[14rem]",
          selected.size > 0
            ? "border-primary/50 text-primary bg-primary/10"
            : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40",
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="uppercase tracking-widest opacity-60 text-[10px]">
          {label}
        </span>
        <span className="truncate">{summary}</span>
        <svg
          className={cn(
            "h-3 w-3 shrink-0 opacity-50 transition-transform",
            open && "rotate-180",
          )}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path d="M3 5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable
          className="absolute z-30 mt-1 left-0 min-w-[12rem] max-w-[calc(100vw-2rem)] max-h-[60vh] overflow-auto rounded-md border border-border bg-card shadow-lg p-2"
        >
          {searchableOptions && (
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`search ${label}…`}
              className={cn(
                "w-full font-mono text-[11px] px-2 py-1 mb-2 rounded border bg-background",
                "border-border focus:border-primary/50 focus:outline-none",
                "placeholder:text-muted-foreground/40",
              )}
              autoFocus
            />
          )}
          {visibleOptions.length === 0 && (
            <div className="text-[11px] font-mono text-muted-foreground/50 px-2 py-1">
              {searchableOptions && query ? "no matches" : "no values yet"}
            </div>
          )}
          <ul className="space-y-0.5">
            {visibleOptions.map((opt) => {
              const isOn = selected.has(opt);
              return (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => toggleValue(opt)}
                    role="option"
                    aria-selected={isOn}
                    className={cn(
                      "w-full text-left text-[11px] font-mono px-2 py-1 rounded flex items-center gap-2 transition-colors",
                      isOn
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                    )}
                  >
                    <span
                      className={cn(
                        "w-3 h-3 border rounded-sm shrink-0 flex items-center justify-center",
                        isOn ? "border-primary bg-primary" : "border-border",
                      )}
                      aria-hidden
                    >
                      {isOn && (
                        <svg
                          viewBox="0 0 12 12"
                          className="w-2.5 h-2.5"
                          fill="none"
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                        >
                          <path
                            d="M2 6.5L5 9.5L10 3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span className="truncate">{opt}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {selected.size > 0 && (
            <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <button
                type="button"
                onClick={clear}
                className="hover:text-primary transition-colors"
              >
                clear
              </button>
              <button
                type="button"
                onClick={close}
                className="hover:text-primary transition-colors"
              >
                done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
