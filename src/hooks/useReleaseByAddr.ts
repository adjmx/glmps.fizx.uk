import { useEffect, useState } from "react";
import { SimplePool, type Event as NostrEvent } from "nostr-tools";
import { isNewerReplaceable, parseRelease, type Release } from "@/lib/nostr";
import { DEFAULT_RELAYS } from "@/config";

export type AddrQuery = {
  pubkey: string;
  kind: number;
  identifier: string;
  relays?: string[];
};

export function useReleaseByAddr(query: AddrQuery | null) {
  const [state, setState] = useState<{
    release: Release | null;
    loading: boolean;
    eose: boolean;
  }>({ release: null, loading: true, eose: false });

  useEffect(() => {
    if (!query) {
      setState({ release: null, loading: false, eose: true });
      return;
    }
    setState({ release: null, loading: true, eose: false });

    const pool = new SimplePool();
    const relays = Array.from(
      new Set([...(query.relays ?? []), ...DEFAULT_RELAYS]),
    );
    const targetCoord = `${query.kind}:${query.pubkey}:${query.identifier}`;
    let latest: NostrEvent | undefined;
    const deletedIds = new Set<string>();
    let addrDeleted = false; // a-tag delete on targetCoord is a permanent tombstone

    const apply = () => {
      if (!latest) return;
      const killed = addrDeleted || deletedIds.has(latest.id);
      setState((s) => ({ ...s, release: killed ? null : parseRelease(latest!) }));
    };

    const main = pool.subscribeMany(
      relays,
      {
        kinds: [query.kind],
        authors: [query.pubkey],
        "#d": [query.identifier],
      },
      {
        onevent(ev) {
          if (!isNewerReplaceable(latest, ev)) return;
          latest = ev;
          apply();
        },
        oneose() {
          setState((s) => ({ ...s, loading: false, eose: true }));
        },
      },
    );

    const deletes = pool.subscribeMany(
      relays,
      { kinds: [5], authors: [query.pubkey] },
      {
        onevent(ev) {
          let touched = false;
          for (const t of ev.tags) {
            if (t[0] === "e" && t[1] && !deletedIds.has(t[1])) {
              deletedIds.add(t[1]);
              touched = true;
            } else if (t[0] === "a" && t[1] === targetCoord && !addrDeleted) {
              addrDeleted = true;
              touched = true;
            }
          }
          if (touched) apply();
        },
      },
    );

    return () => {
      main.close();
      deletes.close();
      pool.close(relays);
    };
  }, [query?.pubkey, query?.kind, query?.identifier, query?.relays?.join(",")]);

  return state;
}
