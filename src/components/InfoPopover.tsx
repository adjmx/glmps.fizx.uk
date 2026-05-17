import { useOwnerProfile } from "@/hooks/useOwnerProfile";
import { OWNER_NPUB } from "@/config";

/**
 * Small panel rendered alongside the +info button on the release detail
 * page. Surfaces the owner's contact handles (NIP-05, npub) plus a link
 * to a generic Nostr profile viewer so the visitor can DM / @-mention
 * the artist for trade or info inquiries. The +info kind:7 reaction
 * itself is the public signal; this popover is the follow-through.
 */
export default function InfoPopover() {
  const { profile } = useOwnerProfile();
  const name = profile?.display_name || profile?.name || "the artist";
  // njump.me is a vendor-neutral Nostr profile viewer; opens in any client.
  const njumpUrl = `https://njump.me/${OWNER_NPUB}`;

  const npubShort = `${OWNER_NPUB.slice(0, 14)}…${OWNER_NPUB.slice(-6)}`;

  return (
    <div className="text-[11px] font-mono space-y-2 min-w-[16rem] max-w-[20rem]">
      <div className="text-muted-foreground/70 leading-relaxed">
        Want more info about this release? Reach {name} via Nostr — send a
        public note mentioning their handle, or DM via any Nostr client.
      </div>
      <dl className="space-y-1">
        {profile?.nip05 && (
          <Row label="nip05">
            <CopyButton value={profile.nip05}>{profile.nip05}</CopyButton>
          </Row>
        )}
        <Row label="npub">
          <CopyButton value={OWNER_NPUB}>{npubShort}</CopyButton>
        </Row>
        {profile?.lud16 && (
          <Row label="lud16">
            <CopyButton value={profile.lud16}>{profile.lud16}</CopyButton>
          </Row>
        )}
      </dl>
      <a
        href={njumpUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-accent hover:underline"
      >
        view profile on njump.me ↗
      </a>
      {profile?.about && (
        <div className="text-[10px] text-muted-foreground/60 whitespace-pre-wrap border-t border-border/40 pt-2">
          {profile.about}
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <dt className="text-[9px] uppercase tracking-widest text-muted-foreground/40 w-12 shrink-0">
        {label}
      </dt>
      <dd className="min-w-0 truncate">{children}</dd>
    </div>
  );
}

function CopyButton({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  const copy = () => {
    try {
      navigator.clipboard.writeText(value);
    } catch {
      /* ignore */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="text-foreground/80 hover:text-primary transition-colors truncate"
      title={`copy ${value}`}
    >
      {children}
    </button>
  );
}

