import { cn } from "@/lib/cn";

// View modes — extended with `grid-sm` for tighter grid density on larger
// screens. `grid-xs` is reserved for a future iteration (thumbnail-only).
export type ViewMode = "grid" | "grid-sm" | "list";

type Props = {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
};

// Resting-state colour for an inactive view button, lifted from the same
// primary→accent gradient FilterBar uses on its facet row, so the whole
// control band reads as one tinted strip.
const inactiveColor = (i: number): string => {
  const pct = (i / 2) * 100;
  return `color-mix(in oklch, hsl(var(--primary)), hsl(var(--accent)) ${pct}%)`;
};

export default function ViewToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded border border-border overflow-hidden">
      <ToggleBtn
        active={value === "grid"}
        onClick={() => onChange("grid")}
        label="grid"
        gradientColor={inactiveColor(0)}
      >
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
          <rect x="1" y="1" width="4" height="4" rx="0.5" />
          <rect x="7" y="1" width="4" height="4" rx="0.5" />
          <rect x="1" y="7" width="4" height="4" rx="0.5" />
          <rect x="7" y="7" width="4" height="4" rx="0.5" />
        </svg>
      </ToggleBtn>
      <ToggleBtn
        active={value === "grid-sm"}
        onClick={() => onChange("grid-sm")}
        label="small grid"
        gradientColor={inactiveColor(1)}
      >
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
          <rect x="0.5" y="0.5" width="3" height="3" rx="0.3" />
          <rect x="4.5" y="0.5" width="3" height="3" rx="0.3" />
          <rect x="8.5" y="0.5" width="3" height="3" rx="0.3" />
          <rect x="0.5" y="4.5" width="3" height="3" rx="0.3" />
          <rect x="4.5" y="4.5" width="3" height="3" rx="0.3" />
          <rect x="8.5" y="4.5" width="3" height="3" rx="0.3" />
          <rect x="0.5" y="8.5" width="3" height="3" rx="0.3" />
          <rect x="4.5" y="8.5" width="3" height="3" rx="0.3" />
          <rect x="8.5" y="8.5" width="3" height="3" rx="0.3" />
        </svg>
      </ToggleBtn>
      <ToggleBtn
        active={value === "list"}
        onClick={() => onChange("list")}
        label="list"
        gradientColor={inactiveColor(2)}
      >
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
          <rect x="1" y="2" width="10" height="1.5" rx="0.5" />
          <rect x="1" y="5.25" width="10" height="1.5" rx="0.5" />
          <rect x="1" y="8.5" width="10" height="1.5" rx="0.5" />
        </svg>
      </ToggleBtn>
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  label,
  children,
  gradientColor,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  gradientColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      style={
        gradientColor
          ? ({ ["--btn-grad" as string]: gradientColor } as React.CSSProperties)
          : undefined
      }
      className={cn(
        "px-2 py-1 transition-colors",
        active
          ? "bg-primary/15 text-primary"
          : gradientColor
            ? "text-[color:var(--btn-grad)] hover:text-foreground"
            : "text-muted-foreground/60 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
