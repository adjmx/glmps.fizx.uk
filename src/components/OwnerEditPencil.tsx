import { useIsOwner } from "@/hooks/useIsOwner";
import { useNostrLogin } from "@/hooks/useNostrLogin";
import { useReleaseEditor } from "@/hooks/useReleaseEditor";
import type { Release } from "@/lib/nostr";

// Owner-only pencil button per release. Visible when the logged-in user is
// the owner AND that user's pubkey matches the release's pubkey (sanity
// guard — releases shown here are all the owner's, but the explicit check
// avoids any future cross-author rendering accidentally exposing edit UI).
//
// Designed to be safe inside <Link> wrappers: stopPropagation + preventDefault
// keep clicks from triggering navigation.
export default function OwnerEditPencil({ release, className = "" }: { release: Release; className?: string }) {
  const isOwner = useIsOwner();
  const { pubkey } = useNostrLogin();
  const { openEdit } = useReleaseEditor();
  if (!isOwner || !pubkey || pubkey.toLowerCase() !== release.pubkey.toLowerCase()) return null;

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openEdit(release);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title="Edit release"
      className={`text-[9px] font-mono px-1.5 py-0.5 border border-accent/40 text-accent/80 bg-card/80 backdrop-blur-sm hover:bg-accent/15 rounded transition-colors ${className}`}
      aria-label="Edit release"
    >
      edit
    </button>
  );
}
