import type { Profile } from "@/lib/nostr";

type Props = {
  profile: Profile | null;
  npub: string;
};

export default function ProfileHeader({ profile, npub }: Props) {
  const npubShort = `${npub.slice(0, 12)}…${npub.slice(-6)}`;

  return (
    <header className="rounded-lg border border-border/60 bg-card/30 p-3 font-mono">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-2">
        profile
      </div>
      <div className="flex items-start gap-3">
        <div
          className="h-14 w-14 shrink-0 rounded-lg bg-muted ring-1 ring-border overflow-hidden bg-cover bg-center"
          style={
            profile?.picture
              ? { backgroundImage: `url(${JSON.stringify(profile.picture)})` }
              : undefined
          }
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h1
            className={`text-[13px] sm:text-sm font-semibold leading-tight truncate ${profile?.nip05 ? "" : "font-mono"}`}
          >
            <span
              style={{
                backgroundImage: "linear-gradient(90deg, #34d399, #a78bfa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {profile?.nip05 || npubShort}
            </span>
          </h1>
          {profile?.nip05 && (
            <div className="text-[9px] text-muted-foreground/60 mt-0.5 truncate">
              {npubShort}
            </div>
          )}
        </div>
      </div>
      {profile?.about && (
        <p className="text-[11px] text-muted-foreground mt-2 line-clamp-4 whitespace-pre-wrap">
          {profile.about}
        </p>
      )}
    </header>
  );
}
