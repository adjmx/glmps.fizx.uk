import { useEffect, useRef, useState } from "react";
import { useNostrLogin } from "@/hooks/useNostrLogin";
import { useProfile } from "@/hooks/useProfile";

export default function NostrLogin() {
  const { pubkey, via, connecting, error, canSign, login, loginBunker, logout } = useNostrLogin();
  const profile = useProfile(pubkey ?? undefined);
  const [open, setOpen] = useState(false);
  const [bunker, setBunker] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  // Close the panel on a click outside it, or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (pubkey) {
    // Prefer NIP-05 (name@domain) over kind:0 name/display_name fields, with a
    // truncated hex pubkey as the ultimate fallback when the user has no
    // discoverable kind:0 metadata on DEFAULT_RELAYS.
    const label = profile?.nip05 || profile?.display_name || profile?.name || `${pubkey.slice(0, 8)}…`;
    const how = via === "bunker" ? "remote signer" : via === "nip55" ? "Android signer" : "extension";
    const problem = via === "bunker" && !canSign ? (connecting ? "connecting to signer…" : error ?? "signer not connected") : null;
    return (
      <button
        onClick={logout}
        title={`Signed in as ${label}, via ${how}${problem ? ` — ${problem}` : ""} — click to log out`}
        className="font-mono text-[11px] px-1.5 py-1 border border-primary/30 text-primary/70 hover:text-primary hover:border-primary/60 transition-colors flex items-center gap-1.5 w-full justify-center whitespace-nowrap"
      >
        {profile?.picture ? (
          <span
            className="w-4 h-4 rounded-full shrink-0 bg-muted bg-cover bg-center ring-1 ring-primary/30"
            style={{ backgroundImage: `url(${JSON.stringify(profile.picture)})` }}
            aria-hidden
          />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
        )}
        <span className="hidden sm:inline max-w-[11rem] truncate">{label}</span>
        {problem && <span className="text-muted-foreground/60" aria-hidden>…</span>}
        <span className="text-muted-foreground/50 ml-0.5">×</span>
      </button>
    );
  }

  const hasExtension = typeof window !== "undefined" && !!window.nostr;
  const option =
    "w-full text-left px-2 py-1.5 border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors";

  return (
    <div ref={boxRef} className="relative w-full">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="font-mono text-[11px] px-2 py-1 border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors flex items-center gap-1.5 w-full justify-center whitespace-nowrap"
      >
        <svg
          className="h-3 w-3 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <span className="hidden sm:inline">Log in with Nostr</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-72 max-w-[calc(100vw-2rem)] bg-card border border-border shadow-lg p-2.5 flex flex-col gap-2 font-mono text-[11px]">
          {hasExtension && (
            <button onClick={() => { setOpen(false); void login(); }} className={option}>
              Browser extension <span className="text-muted-foreground/50">· NIP-07</span>
            </button>
          )}
          <form
            className="flex flex-col gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              loginBunker(bunker).then(
                () => { setOpen(false); setBunker(""); },
                () => {},
              );
            }}
          >
            <label className="text-muted-foreground/70" htmlFor="glmps-bunker">
              Remote signer <span className="text-muted-foreground/50">· NIP-46</span>
            </label>
            <div className="flex gap-1.5">
              <input
                id="glmps-bunker"
                value={bunker}
                onChange={(e) => setBunker(e.target.value)}
                placeholder="bunker://…"
                spellCheck={false}
                autoComplete="off"
                className="flex-1 min-w-0 px-2 py-1 bg-background border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
              />
              <button
                type="submit"
                disabled={connecting || !bunker.trim()}
                className="px-2 py-1 border border-primary/40 text-primary hover:bg-primary/10 disabled:opacity-40 transition-colors"
              >
                {connecting ? "…" : "Connect"}
              </button>
            </div>
            {connecting && <span className="text-muted-foreground/70">connecting to signer…</span>}
            {error && !connecting && <span className="text-red-400/80 break-words">{error}</span>}
          </form>
          {!hasExtension && (
            <button onClick={() => { setOpen(false); void login(); }} className={option}>
              Android signer app <span className="text-muted-foreground/50">· NIP-55, view only</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
