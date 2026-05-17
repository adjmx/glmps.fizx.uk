import { useEffect, useState } from "react";
import { SimplePool, type Event as NostrEvent } from "nostr-tools";
import { parseProfile, type Profile } from "@/lib/nostr";
import { DEFAULT_RELAYS } from "@/config";

export function useProfile(hexPubkey: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!hexPubkey) return;
    setProfile(null);

    const pool = new SimplePool();
    const relays = [...DEFAULT_RELAYS];
    let latest: NostrEvent | undefined;

    const sub = pool.subscribeMany(
      relays,
      { kinds: [0], authors: [hexPubkey] },
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
  }, [hexPubkey]);

  return profile;
}
