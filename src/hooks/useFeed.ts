import { useEffect, useMemo, useRef, useState } from "react";
import { SimplePool, type Event as NostrEvent } from "nostr-tools";
import {
  APPROVAL_KIND,
  FEED_KIND,
  REGISTRY_KIND,
  resolveFeed,
  type FeedNote,
} from "@/lib/feed";
import { DEFAULT_RELAYS } from "@/config";

export interface FeedState {
  notes: FeedNote[];
  loading: boolean;
}

// Subscribes to the owner's feed-note channel (kind:31239 notes + the owner's
// 30000 registry / 4550 sign-offs / 5 deletes) and runs the SHARED trust gate
// (lib/feed.ts resolveFeed) — the same pure function ndisc + ndisc.view run.
// Owner-only author filter for now; transport mirrors useReleases.
export function useFeed(ownerHex: string | undefined): FeedState {
  const [notes, setNotes] = useState<FeedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const byKeyRef = useRef<Map<string, NostrEvent>>(new Map());

  useEffect(() => {
    if (!ownerHex) {
      setNotes([]);
      setLoading(false);
      return;
    }
    byKeyRef.current = new Map();
    setNotes([]);
    setLoading(true);

    const pool = new SimplePool();
    const relays = [...DEFAULT_RELAYS];
    const byKey = byKeyRef.current;
    const recompute = () => setNotes(resolveFeed([...byKey.values()], ownerHex));

    const sub = pool.subscribeMany(
      relays,
      {
        kinds: [FEED_KIND, REGISTRY_KIND, APPROVAL_KIND, 5],
        authors: [ownerHex],
      },
      {
        onevent(ev) {
          // Replaceable kinds key by address; regular events (4550, 5) by id.
          const dTag = ev.tags.find((t) => t[0] === "d")?.[1];
          const key =
            ev.kind === FEED_KIND || ev.kind === REGISTRY_KIND
              ? `${ev.kind}:${ev.pubkey}:${dTag ?? ""}`
              : ev.id;
          const prev = byKey.get(key);
          if (!prev || ev.created_at > prev.created_at) {
            byKey.set(key, ev);
            recompute();
          }
        },
        oneose() {
          setLoading(false);
        },
      },
    );

    const t = setTimeout(() => setLoading(false), 5000);

    return () => {
      clearTimeout(t);
      sub.close();
      pool.close(relays);
    };
  }, [ownerHex]);

  return useMemo(() => ({ notes, loading }), [notes, loading]);
}
