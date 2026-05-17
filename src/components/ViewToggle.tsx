import { cn } from "@/lib/cn";

// View modes — extended with `grid-sm` for tighter grid density on larger
// screens. `grid-xs` is reserved for a future iteration (thumbnail-only).
export type ViewMode = "grid" | "grid-sm" | "list";

type Props = {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
};

export default function ViewToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded border border-border overflow-hidden">
      <ToggleBtn
        active={value === "grid"}
        onClick={() => onChange("grid")}
        label="grid"
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
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "px-2 py-1 transition-colors",
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground/60 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
