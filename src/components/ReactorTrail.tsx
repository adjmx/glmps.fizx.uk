import { useProfile } from "@/hooks/useProfile";
import { displayCount } from "@/lib/rating";

const MAX_AVATARS = 5;

type Props = {
  pubkeys: string[];
  label?: string;
  className?: string;
};

/**
 * Small horizontal stack of reactor avatars — like Damus / Amethyst show
 * under reactions. Fetches each pubkey's kind:0 lazily via useProfile.
 * Caps visible avatars at MAX_AVATARS; surplus shown as "+N" pill.
 *
 * Designed to render nothing for empty lists so the consumer can drop it
 * inline without a guard.
 */
export default function ReactorTrail({ pubkeys, label, className = "" }: Props) {
  if (pubkeys.length === 0) return null;
  const shown = pubkeys.slice(0, MAX_AVATARS);
  const remaining = pubkeys.length - shown.length;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {label && (
        <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/40 shrink-0">
          {label}
        </span>
      )}
      <div className="flex items-center -space-x-1.5">
        {shown.map((pk) => (
          <ReactorAvatar key={pk} pubkey={pk} />
        ))}
      </div>
      {remaining > 0 && (
        <span className="text-[9px] font-mono text-muted-foreground/60 ml-0.5">+{displayCount(remaining)}</span>
      )}
    </div>
  );
}

function ReactorAvatar({ pubkey }: { pubkey: string }) {
  const profile = useProfile(pubkey);
  const name = profile?.display_name || profile?.name || `${pubkey.slice(0, 8)}…`;
  return (
    <span
      title={name}
      className="w-5 h-5 rounded-full ring-1 ring-border bg-muted bg-cover bg-center shrink-0"
      style={
        profile?.picture
          ? { backgroundImage: `url(${JSON.stringify(profile.picture)})` }
          : undefined
      }
      aria-label={name}
    />
  );
}
