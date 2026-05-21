import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SimplePool, type Event as NostrEvent } from "nostr-tools";
import { DEFAULT_RELAYS, RELEASE_KIND } from "@/config";
import { classifyReaction, REACTION_UP, REACTION_DOWN, REACTION_INFO } from "@/lib/rating";
import { useNostrLogin } from "./useNostrLogin";
import { useOwnerProfile } from "./useOwnerProfile";

/**
 * Per-release aggregated reaction state. `myReaction` is the current user's
 * own latest reaction (or null), giving the UI a place to source the active
 * button state without scanning the full reaction list.
 */
export type ReactionAgg = {
  up: number;
  down: number;
  info: number;
  myReaction: { content: string; eventId: string } | null;
};

const EMPTY: ReactionAgg = { up: 0, down: 0, info: 0, myReaction: null };

/**
 * Per-bucket reactor pubkeys (most-recent reaction first) so the UI can
 * render a stack of reactor avatars next to the count.
 */
export type ReactorsAgg = {
  up: string[];
  down: string[];
  info: string[];
};

const EMPTY_REACTORS: ReactorsAgg = { up: [], down: [], info: [] };

type Ctx = {
  forAddr: (addr: string) => ReactionAgg;
  reactorsByAddr: (addr: string) => ReactorsAgg;
  publish: (addr: string, content: string) => Promise<void>;
  revoke: (addr: string) => Promise<void>;
  /** True iff the user is logged in AND a NIP-07 signer is present right now. */
  canPublish: boolean;
};

const C = createContext<Ctx | null>(null);

export function ReactionsProvider({ children }: { children: ReactNode }) {
  const { ownerHex } = useOwnerProfile();
  const { pubkey: myPubkey } = useNostrLogin();

  // latestByReleaseAndReactor: per-release → per-reactor → latest kind:7
  const latestRef = useRef<Map<string, Map<string, NostrEvent>>>(new Map());
  const [, forceRender] = useState(0);
  const bump = useCallback(() => forceRender((n) => n + 1), []);

  // Persisted pool for the lifetime of the provider; reuse for subscribes
  // and publishes alike.
  const poolRef = useRef<SimplePool | null>(null);
  if (!poolRef.current) poolRef.current = new SimplePool();
  const relays = useMemo(() => [...DEFAULT_RELAYS], []);

  useEffect(() => {
    if (!ownerHex) return;
    const pool = poolRef.current!;

    const onevent = (ev: NostrEvent) => {
      // Pick the most recent `a` tag pointing at one of our releases.
      const addr = ev.tags
        .filter((t) => t[0] === "a" && t[1]?.startsWith(`${RELEASE_KIND}:${ownerHex}:`))
        .map((t) => t[1])[0];
      if (!addr) return;
      let inner = latestRef.current.get(addr);
      if (!inner) {
        inner = new Map();
        latestRef.current.set(addr, inner);
      }
      const prev = inner.get(ev.pubkey);
      // Latest event wins; tie-break to lower id (matches release dedupe).
      if (
        !prev ||
        ev.created_at > prev.created_at ||
        (ev.created_at === prev.created_at && ev.id < prev.id)
      ) {
        inner.set(ev.pubkey, ev);
        bump();
      }
    };

    // The kind:7 subscription is best-effort across several relays. If a relay
    // is slow or fails to connect, its reactions silently never arrive and the
    // UI shows none. Re-subscribe a few times until the first EOSE so a
    // transiently unreachable relay still gets queried — re-delivery is
    // idempotent (events dedupe per (release, reactor) in latestRef).
    const MAX_ATTEMPTS = 3;
    const RETRY_MS = 6000;
    let attempt = 0;
    let eosed = false;
    let sub: ReturnType<typeof pool.subscribeMany> | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const open = () => {
      attempt += 1;
      sub = pool.subscribeMany(
        relays,
        { kinds: [7], "#p": [ownerHex] },
        {
          onevent,
          oneose() {
            eosed = true;
            if (retryTimer) clearTimeout(retryTimer);
          },
        },
      );
      // No EOSE within RETRY_MS means a relay likely never answered — re-query.
      if (attempt < MAX_ATTEMPTS) {
        retryTimer = setTimeout(() => {
          if (eosed) return;
          sub?.close();
          open();
        }, RETRY_MS);
      }
    };
    open();

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      sub?.close();
    };
  }, [ownerHex, relays, bump]);

  const forAddr = useCallback(
    (addr: string): ReactionAgg => {
      const inner = latestRef.current.get(addr);
      if (!inner) return EMPTY;
      let up = 0;
      let down = 0;
      let info = 0;
      let mine: ReactionAgg["myReaction"] = null;
      for (const ev of inner.values()) {
        const k = classifyReaction(ev.content);
        if (k === "up") up++;
        else if (k === "down") down++;
        else if (k === "info") info++;
        if (myPubkey && ev.pubkey === myPubkey) {
          mine = { content: ev.content, eventId: ev.id };
        }
      }
      return { up, down, info, myReaction: mine };
    },
    [myPubkey],
  );

  const reactorsByAddr = useCallback((addr: string): ReactorsAgg => {
    const inner = latestRef.current.get(addr);
    if (!inner) return EMPTY_REACTORS;
    const buckets: ReactorsAgg = { up: [], down: [], info: [] };
    // Sort by created_at desc so the avatar stack shows the most recent first.
    const events = [...inner.values()].sort((a, b) => b.created_at - a.created_at);
    for (const ev of events) {
      const k = classifyReaction(ev.content);
      if (k === "up") buckets.up.push(ev.pubkey);
      else if (k === "down") buckets.down.push(ev.pubkey);
      else if (k === "info") buckets.info.push(ev.pubkey);
    }
    return buckets;
  }, []);

  // Signing path: NIP-07 (window.nostr) on desktop. Amber/NIP-55 sign-flow
  // would need a redirect dance — out of scope for v1; we just no-op.
  const sign = useCallback(
    async (template: object): Promise<NostrEvent | null> => {
      if (typeof window === "undefined" || !window.nostr) return null;
      try {
        const signed = (await window.nostr.signEvent(template)) as NostrEvent;
        return signed && signed.id ? signed : null;
      } catch (e) {
        console.warn("sign rejected", e);
        return null;
      }
    },
    [],
  );

  const publish = useCallback(
    async (addr: string, content: string) => {
      if (!myPubkey || !ownerHex) return;
      const event = await sign({
        kind: 7,
        created_at: Math.floor(Date.now() / 1000),
        content,
        tags: [
          ["a", addr],
          ["p", ownerHex],
          ["k", String(RELEASE_KIND)],
        ],
        pubkey: myPubkey,
      });
      if (!event) return;
      let inner = latestRef.current.get(addr);
      if (!inner) {
        inner = new Map();
        latestRef.current.set(addr, inner);
      }
      // Optimistic local update; remember the prior state so it can be rolled
      // back if the event reaches no relay.
      const prev = inner.get(myPubkey);
      inner.set(myPubkey, event);
      bump();
      const results = await Promise.allSettled(
        poolRef.current!.publish(relays, event),
      );
      if (!results.some((r) => r.status === "fulfilled")) {
        // No relay accepted the reaction — undo the optimistic update so the
        // UI never shows a vote that was not persisted.
        if (prev) inner.set(myPubkey, prev);
        else inner.delete(myPubkey);
        bump();
        throw new Error("reaction not accepted by any relay");
      }
    },
    [myPubkey, ownerHex, relays, sign, bump],
  );

  const revoke = useCallback(
    async (addr: string) => {
      if (!myPubkey) return;
      const inner = latestRef.current.get(addr);
      const mine = inner?.get(myPubkey);
      if (!inner || !mine) return;
      const deletion = await sign({
        kind: 5,
        created_at: Math.floor(Date.now() / 1000),
        content: "",
        tags: [
          ["e", mine.id],
          ["k", "7"],
        ],
        pubkey: myPubkey,
      });
      if (!deletion) return;
      // Drop locally so the UI flips immediately; other clients catch up
      // via the kind:5 we just emitted.
      inner.delete(myPubkey);
      bump();
      const results = await Promise.allSettled(
        poolRef.current!.publish(relays, deletion),
      );
      if (!results.some((r) => r.status === "fulfilled")) {
        // The deletion reached no relay — restore the reaction so the UI
        // matches what every other client will still see.
        inner.set(myPubkey, mine);
        bump();
        throw new Error("reaction removal not accepted by any relay");
      }
    },
    [myPubkey, relays, sign, bump],
  );

  const canPublish =
    typeof window !== "undefined" && !!window.nostr && !!myPubkey;

  const value = useMemo<Ctx>(
    () => ({ forAddr, reactorsByAddr, publish, revoke, canPublish }),
    [forAddr, reactorsByAddr, publish, revoke, canPublish],
  );

  // Tear pool down on unmount (basically only on hot-reload during dev).
  useEffect(() => {
    const pool = poolRef.current!;
    return () => pool.close(relays);
  }, [relays]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useReactions() {
  const v = useContext(C);
  if (!v) throw new Error("useReactions must be used inside <ReactionsProvider>");
  return v;
}

// Re-export the constants so call-sites don't import from two places.
export { REACTION_UP, REACTION_DOWN, REACTION_INFO };
