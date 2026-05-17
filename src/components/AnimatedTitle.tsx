// Animated gradient title — ported verbatim from blst.fizx.uk for sibling-
// design consistency. Accent letters animate in left-to-right with a
// per-letter color gradient; the suffix letters fade in dimmer.

const TITLE_ANIM_CSS = `@keyframes titleLetterIn{from{transform:translateX(-80px);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes titleSuffixIn{from{opacity:0}to{opacity:1}}`;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function lerpRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): string {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
}

type Props = {
  accent: string;
  rest?: string;
  from: string;
  to: string;
  suffixRgba: string;
  fontSize?: string;
};

export default function AnimatedTitle({
  accent,
  rest = "",
  from,
  to,
  suffixRgba,
  fontSize = "clamp(36px, 7.5vw, 51px)",
}: Props) {
  const ac = accent.split("");
  const rc = rest.split("");
  const total = ac.length + rc.length;
  const dur = 350;
  const stagger = total > 1 ? (1200 - dur) / (total - 1) : 0;
  const fromRgb = hexToRgb(from);
  const toRgb = hexToRgb(to);
  const aLen = ac.length;

  return (
    <>
      <style>{TITLE_ANIM_CSS}</style>
      <h1 className="font-sans font-bold tracking-tight" style={{ fontSize }}>
        {ac.map((ch, i) => {
          const start = lerpRgb(fromRgb, toRgb, aLen > 0 ? i / aLen : 0);
          const end = lerpRgb(fromRgb, toRgb, aLen > 0 ? (i + 1) / aLen : 1);
          return (
            <span
              key={i}
              className="inline-block"
              style={{
                background: `linear-gradient(to right,${start},${end})`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: `titleLetterIn ${dur}ms cubic-bezier(0.22,1,0.36,1) both`,
                animationDelay: `${Math.round(i * stagger)}ms`,
              }}
            >
              {ch === " " ? " " : ch}
            </span>
          );
        })}
        {rc.map((ch, i) => (
          <span
            key={i + ac.length}
            className="inline-block"
            style={{
              color: suffixRgba,
              animation: `titleSuffixIn 600ms cubic-bezier(0.22,1,0.36,1) both`,
              animationDelay: `${Math.round((ac.length + i) * stagger)}ms`,
            }}
          >
            {ch === " " ? " " : ch}
          </span>
        ))}
      </h1>
    </>
  );
}
