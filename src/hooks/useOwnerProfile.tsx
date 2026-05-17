import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { SimplePool, type Event as NostrEvent } from "nostr-tools";
import { parseProfile, type Profile, npubToHex } from "@/lib/nostr";
import { DEFAULT_RELAYS, OWNER_NPUB } from "@/config";

type Ctx = {
  ownerHex: string | null;
  profile: Profile | null;
};

const C = createContext<Ctx | null>(null);

export function OwnerProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const ownerHex = (() => {
    try {
      return npubToHex(OWNER_NPUB);
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!ownerHex) return;
    const pool = new SimplePool();
    const relays = [...DEFAULT_RELAYS];
    let latest: NostrEvent | undefined;

    const sub = pool.subscribeMany(
      relays,
      { kinds: [0], authors: [ownerHex] },
      {
        onevent(ev) {
          if (!latest || ev.created_at > latest.created_at) {
            latest = ev;
            setProfile(parseProfile(ev));
          }
        },
      },
    );

    return () => {
      sub.close();
      pool.close(relays);
    };
  }, [ownerHex]);

  return <C.Provider value={{ ownerHex, profile }}>{children}</C.Provider>;
}

export function useOwnerProfile() {
  const v = useContext(C);
  if (!v)
    throw new Error("useOwnerProfile must be used inside <OwnerProfileProvider>");
  return v;
}
