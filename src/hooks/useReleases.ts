import { useEffect, useMemo, useRef, useState } from "react";
import { SimplePool, type Event as NostrEvent } from "nostr-tools";
import {
  compareReleases,
  isNewerReplaceable,
  parseRelease,
  type Release,
} from "@/lib/nostr";
import { DEFAULT_RELAYS, RELEASE_KIND } from "@/config";

type State = {
  releases: Release[];
  loading: boolean;
  eose: boolean;
};

export function useReleases(hexPubkey: string | undefined) {
  const [state, setState] = useState<State>({
    releases: [],
    loading: true,
    eose: false,
  });

  // Latest event per d-tag (NIP-01 replaceable dedupe)
  const latestRef = useRef<Map<string, NostrEvent>>(new Map());
  // NIP-09 deletion state.
  // `e`-tag deletes name a specific event id (content-addressed).
  const deletedIdsRef = useRef<Set<string>>(new Set());
  // `a`-tag deletes name a coordinate `kind:pubkey:d`. ndisc treats these as
  // permanent tombstones on the coordinate — any matching kind:31237 is
  // dropped regardless of timestamp. (Strict NIP-09 only kills events with
  // created_at <= deletion.created_at, but ndisc / this viewer adopt the
  // simpler "deleted means deleted" semantics.)
  const deletedAddrsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!hexPubkey) return;
    latestRef.current = new Map();
    deletedIdsRef.current = new Set();
    deletedAddrsRef.current = new Set();
    setState({ releases: [], loading: true, eose: false });

    const pool = new SimplePool();
    const relays = [...DEFAULT_RELAYS];

    const coordOf = (ev: NostrEvent) => {
      const d = ev.tags.find((t) => t[0] === "d")?.[1] ?? "";
      return `${ev.kind}:${ev.pubkey}:${d}`;
    };

    const isDeleted = (ev: NostrEvent) =>
      deletedIdsRef.current.has(ev.id) ||
      deletedAddrsRef.current.has(coordOf(ev));

    const recompute = () => {
      const releases: Release[] = [];
      for (const ev of latestRef.current.values()) {
        if (isDeleted(ev)) continue;
        const parsed = parseRelease(ev);
        if (parsed) releases.push(parsed);
      }
      releases.sort(compareReleases);
      setState((s) => ({ ...s, releases }));
    };

    const releasesSub = pool.subscribeMany(
      relays,
      { kinds: [RELEASE_KIND], authors: [hexPubkey] },
      {
        onevent(ev) {
          const dTag = ev.tags.find((t) => t[0] === "d")?.[1];
          if (!dTag) return;
          const current = latestRef.current.get(dTag);
          if (!isNewerReplaceable(current, ev)) return;
          latestRef.current.set(dTag, ev);
          recompute();
        },
        oneose() {
          setState((s) => ({ ...s, loading: false, eose: true }));
        },
      },
    );

    const deletesSub = pool.subscribeMany(
      relays,
      { kinds: [5], authors: [hexPubkey] },
      {
        onevent(ev) {
          let touched = false;
          for (const t of ev.tags) {
            if (t[0] === "e" && t[1] && !deletedIdsRef.current.has(t[1])) {
              deletedIdsRef.current.add(t[1]);
              touched = true;
            } else if (t[0] === "a" && t[1] && !deletedAddrsRef.current.has(t[1])) {
              deletedAddrsRef.current.add(t[1]);
              touched = true;
            }
          }
          if (touched) recompute();
        },
      },
    );

    return () => {
      releasesSub.close();
      deletesSub.close();
      pool.close(relays);
    };
  }, [hexPubkey]);

  return useMemo(
    () => ({
      releases: state.releases,
      loading: state.loading,
      eose: state.eose,
    }),
    [state],
  );
}
