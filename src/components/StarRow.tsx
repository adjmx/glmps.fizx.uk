import { cn } from "@/lib/cn";
import { starRating } from "@/lib/rating";

type Props = {
  up: number;
  down: number;
  size?: "xs" | "sm" | "md";
  /** If true, renders an empty placeholder when rating is 0. Default: hide. */
  showWhenUnrated?: boolean;
  className?: string;
};

const SIZES = {
  xs: { star: "w-2.5 h-2.5", gap: "gap-0" },
  sm: { star: "w-3 h-3", gap: "gap-0" },
  md: { star: "w-4 h-4", gap: "gap-0.5" },
};

export default function StarRow({
  up,
  down,
  size = "sm",
  showWhenUnrated = false,
  className,
}: Props) {
  const stars = starRating(up, down);
  if (stars === 0 && !showWhenUnrated) return null;

  const s = SIZES[size];
  return (
    <div
      className={cn("inline-flex items-center", s.gap, className)}
      aria-label={`${stars} of 5 stars`}
      title={`${stars}/5 · ${up}↑ ${down}↓`}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} filled={i < stars} className={s.star} />
      ))}
    </div>
  );
}

function Star({ filled, className }: { filled: boolean; className: string }) {
  return (
    <svg
      className={cn(className, filled ? "text-accent" : "text-muted-foreground/20")}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2.5l2.6 6.4 6.9.5-5.2 4.5 1.6 6.8L12 17.2l-5.9 3.5 1.6-6.8L2.5 9.4l6.9-.5L12 2.5z" />
    </svg>
  );
}
