import { useMemo } from "react";
import { useNostrLogin } from "./useNostrLogin";
import { OWNER_NPUB } from "@/config";
import { npubToHex } from "@/lib/nostr";

/**
 * True iff the currently logged-in Nostr pubkey matches OWNER_NPUB.
 * Comparison is case-insensitive — pubkeys are lowercase hex by convention
 * but some signers return them mixed-case.
 */
export function useIsOwner() {
  const { pubkey } = useNostrLogin();
  const ownerHex = useMemo(() => {
    try {
      return npubToHex(OWNER_NPUB).toLowerCase();
    } catch {
      return null;
    }
  }, []);
  if (!pubkey || !ownerHex) return false;
  return pubkey.toLowerCase() === ownerHex;
}
