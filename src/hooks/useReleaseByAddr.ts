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
    // Newest `a`-tag deletion on targetCoord. NOT a permanent tombstone: the
    // coordinate is reused on every republish, so a deletion only kills events
    // created at or before it (strict NIP-09). See useReleases.ts.
    let addrDeletedAt: number | undefined;

    const apply = () => {
      if (!latest) return;
      const killed =
        deletedIds.has(latest.id) ||
        (addrDeletedAt !== undefined && latest.created_at <= addrDeletedAt);
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
            } else if (
              t[0] === "a" &&
              t[1] === targetCoord &&
              (addrDeletedAt === undefined || ev.created_at > addrDeletedAt)
            ) {
              addrDeletedAt = ev.created_at;
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
