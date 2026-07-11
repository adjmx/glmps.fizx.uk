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
  // Parsed release per d-tag, cached at ingest so a recompute never re-parses
  // the whole catalogue. Kept in lockstep with latestRef: parse once when an
  // event wins the replaceable race; drop the entry if it fails to parse.
  const parsedRef = useRef<Map<string, Release>>(new Map());
  // NIP-09 deletion state.
  // `e`-tag deletes name a specific event id (content-addressed), so they are
  // permanent: that exact event is dead forever.
  const deletedIdsRef = useRef<Set<string>>(new Set());
  // `a`-tag deletes name a coordinate `kind:pubkey:d`, which is REUSED every
  // time the release is republished. So we keep the newest deletion timestamp
  // per coordinate and kill only events created at or before it — strict
  // NIP-09.
  //
  // This used to treat an `a` delete as a permanent tombstone on the
  // coordinate ("deleted means deleted"), which is wrong the moment a release
  // is unpublished and later published again: the new event carries the same
  // coordinate and was dropped on sight. After a bulk unpublish/republish
  // cycle every coordinate has a deletion in its history, so the viewer hid
  // the entire catalogue.
  const deletedAddrsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!hexPubkey) return;
    latestRef.current = new Map();
    parsedRef.current = new Map();
    deletedIdsRef.current = new Set();
    deletedAddrsRef.current = new Map();
    setState({ releases: [], loading: true, eose: false });

    const pool = new SimplePool();
    const relays = [...DEFAULT_RELAYS];

    const coordOf = (ev: NostrEvent) => {
      const d = ev.tags.find((t) => t[0] === "d")?.[1] ?? "";
      return `${ev.kind}:${ev.pubkey}:${d}`;
    };

    const isDeleted = (ev: NostrEvent) => {
      if (deletedIdsRef.current.has(ev.id)) return true;
      const deletedAt = deletedAddrsRef.current.get(coordOf(ev));
      return deletedAt !== undefined && ev.created_at <= deletedAt;
    };

    // Coalescing window (ms). Collapses the storm of onevent callbacks into a
    // handful of recomputes per second. setTimeout (not rAF) so it still fires
    // while the tab/webview is hidden — rAF pauses when the document isn't
    // visible, which would leave the catalogue unrendered on a backgrounded
    // load until the user returns.
    const FLUSH_MS = 120;
    let flushScheduled = false;
    let flushTimer: ReturnType<typeof setTimeout> | null = null;

    const flush = () => {
      flushScheduled = false;
      flushTimer = null;
      const releases: Release[] = [];
      for (const [d, ev] of latestRef.current) {
        if (isDeleted(ev)) continue;
        const parsed = parsedRef.current.get(d);
        if (parsed) releases.push(parsed);
      }
      releases.sort(compareReleases);
      setState((s) => ({ ...s, releases }));
    };

    // The old code re-parsed and re-sorted the whole catalogue on every single
    // event, pinning the main thread; this keeps the download aggressive while
    // the UI stays responsive.
    const scheduleFlush = () => {
      if (flushScheduled) return;
      flushScheduled = true;
      flushTimer = setTimeout(flush, FLUSH_MS);
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
          const parsed = parseRelease(ev);
          if (parsed) parsedRef.current.set(dTag, parsed);
          else parsedRef.current.delete(dTag);
          scheduleFlush();
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
            } else if (t[0] === "a" && t[1]) {
              const prev = deletedAddrsRef.current.get(t[1]);
              if (prev === undefined || ev.created_at > prev) {
                deletedAddrsRef.current.set(t[1], ev.created_at);
                touched = true;
              }
            }
          }
          if (touched) scheduleFlush();
        },
      },
    );

    return () => {
      if (flushTimer !== null) clearTimeout(flushTimer);
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
