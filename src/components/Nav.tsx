import NostrLogin from "./NostrLogin";

const SUBS = ["blst", "glmps", "npub", "pls", "smpl"] as const;

export default function Nav() {
  const host =
    typeof window !== "undefined" ? window.location.hostname : "glmps.fizx.uk";
  const cur = SUBS.find((s) => host === `${s}.fizx.uk`);
  const others = SUBS.filter((s) => s !== cur);

  return (
    <nav className="border-b border-border px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-center gap-4">
        <a
          href="https://fizx.uk"
          className="font-mono text-[11px] sm:text-[12px] text-muted-foreground/50 hover:text-primary transition-colors shrink-0"
        >
          fizx
        </a>
        {cur && (
          <span className="font-mono text-[11px] sm:text-[12px] text-primary whitespace-nowrap shrink-0 cursor-default">
            {cur}
          </span>
        )}
        <div className="flex-1 flex justify-center items-center gap-x-3 overflow-x-auto">
          {others.map((sub) => (
            <a
              key={sub}
              href={`https://${sub}.fizx.uk`}
              className="text-muted-foreground/60 hover:text-primary transition-colors whitespace-nowrap text-[11px] sm:text-[12px] font-mono"
            >
              {sub}
            </a>
          ))}
        </div>
        <div className="shrink-0 flex justify-end w-[34px] sm:w-[160px]">
          <NostrLogin />
        </div>
      </div>
    </nav>
  );
}
