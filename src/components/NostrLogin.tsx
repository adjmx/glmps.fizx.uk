import { useNostrLogin } from "@/hooks/useNostrLogin";
import { useProfile } from "@/hooks/useProfile";

export default function NostrLogin() {
  const { pubkey, login, logout } = useNostrLogin();
  const profile = useProfile(pubkey ?? undefined);

  if (pubkey) {
    const label = profile?.display_name || profile?.name || `${pubkey.slice(0, 8)}…`;
    return (
      <button
        onClick={logout}
        title={`Signed in as ${label} — click to log out`}
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
        <span className="hidden sm:inline max-w-[7rem] truncate">{label}</span>
        <span className="text-muted-foreground/50 ml-0.5">×</span>
      </button>
    );
  }

  return (
    <button
      onClick={login}
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
  );
}
