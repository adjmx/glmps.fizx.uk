// Reusable dot-matrix loader — a short row of dots that rise in sequence
// ("Column Bounce"). Colours come from the theme CSS vars (--primary /
// --accent), so it carries no palette literals and renders coral on upleb,
// emerald on fizx from the same source. Honours prefers-reduced-motion by
// degrading the bounce to a gentle opacity pulse.

const DOT_LOADER_CSS = `@keyframes glmpsDotBounce{0%,100%{transform:translateY(0);opacity:.25}50%{transform:translateY(-8px);opacity:1}}@keyframes glmpsDotPulse{0%,100%{opacity:.3}50%{opacity:1}}@media (prefers-reduced-motion:reduce){.glmps-dot{animation-name:glmpsDotPulse!important}}`;

type Props = {
  className?: string;
  label?: string;
};

export default function DotMatrixLoader({
  className = "",
  label = "Loading",
}: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-end gap-[5px] h-[14px] ${className}`}
    >
      <style>{DOT_LOADER_CSS}</style>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="glmps-dot inline-block w-[6px] h-[6px] rounded-full"
          style={{
            background:
              i % 2 === 1 ? "hsl(var(--accent))" : "hsl(var(--primary))",
            animation: "glmpsDotBounce 1s ease-in-out infinite",
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
