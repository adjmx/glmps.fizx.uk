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
        <a href="https://github.com/adjmx/glmps.fizx.uk" target="_blank" rel="noopener noreferrer" title="Source on GitHub" aria-label="Source on GitHub" className="shrink-0 text-muted-foreground/60 hover:text-primary transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.69-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.77 1.07.77 2.16 0 1.56-.01 2.82-.01 3.21 0 .31.21.68.8.56 4.56-1.52 7.85-5.83 7.85-10.91C23.5 5.65 18.35.5 12 .5z"/></svg>
        </a>
        <div className="shrink-0 flex justify-end w-[34px] sm:w-[160px]">
          <NostrLogin />
        </div>
      </div>
    </nav>
  );
}
