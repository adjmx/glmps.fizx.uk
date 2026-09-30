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
import { generateSecretKey, type EventTemplate, type Event as NostrEvent } from "nostr-tools/pure";
import { BunkerSigner, parseBunkerInput } from "nostr-tools/nip46";

// Three ways in:
// NIP-07: window.nostr injected by browser extensions (Alby, nos2x, …).
// NIP-46: a remote signer (bunker://…). The nsec stays with the signer; this
//   page keeps only a throwaway client key for the channel, in localStorage,
//   and every signature is a request the signer can refuse or ask about.
// NIP-55: nostrsigner: URI scheme used by Android signers (Amber); the
//   signer redirects back with `?nostr_pk=<pubkey>`. Read-only here — the
//   sign flow would need a redirect per event.
declare global {
  interface Window {
    nostr?: {
      getPublicKey(): Promise<string>;
      signEvent(e: object): Promise<object>;
    };
  }
}

type Via = "nip07" | "bunker" | "nip55";

type NostrLoginCtx = {
  pubkey: string | null;
  via: Via | null;
  /** Bunker only: connecting, or the last failure. */
  connecting: boolean;
  error: string | null;
  /** True when signEvent will actually ask someone to sign. */
  canSign: boolean;
  login: () => Promise<void>;
  loginBunker: (input: string) => Promise<void>;
  logout: () => void;
  /** Signs with whichever login is active; null if refused or unavailable. */
  signEvent: (template: EventTemplate) => Promise<NostrEvent | null>;
};

const Ctx = createContext<NostrLoginCtx | null>(null);

const PUBKEY_KEY = "nostr_pubkey";
const VIA_KEY = "glmps.loginVia";
const BUNKER_KEY = "glmps.bunker";

type BunkerSession = { clientKey: string; bunker: string };

function toHex(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}
function fromHex(h: string): Uint8Array {
  return new Uint8Array((h.match(/.{2}/g) ?? []).map((x) => parseInt(x, 16)));
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string | null) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage is a convenience */
  }
}

function loadBunker(): BunkerSession | null {
  try {
    const s = JSON.parse(read(BUNKER_KEY) ?? "null");
    return typeof s?.clientKey === "string" && typeof s?.bunker === "string" ? s : null;
  } catch {
    return null;
  }
}

export function NostrLoginProvider({ children }: { children: ReactNode }) {
  const [pubkey, setPubkey] = useState<string | null>(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("nostr_pk");
    if (fromUrl) {
      write(PUBKEY_KEY, fromUrl);
      write(VIA_KEY, "nip55");
      return fromUrl;
    }
    return read(PUBKEY_KEY);
  });
  // A pubkey stored before logins were tagged came from the extension or
  // Amber; treating it as nip07 keeps its old behaviour (signs when the
  // extension is there).
  const [via, setVia] = useState<Via | null>(() => {
    const v = read(VIA_KEY);
    return v === "nip07" || v === "bunker" || v === "nip55" ? v : read(PUBKEY_KEY) ? "nip07" : null;
  });
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bunkerReady, setBunkerReady] = useState(false);
  const signerRef = useRef<BunkerSigner | null>(null);

  // Strip nostr_pk from the URL once consumed.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("nostr_pk")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const connect = useCallback(async (clientKey: Uint8Array, input: string) => {
    setError(null);
    setConnecting(true);
    try {
      const bp = await parseBunkerInput(input);
      if (!bp) throw new Error("not a bunker:// string or NIP-05 name");
      const signer = BunkerSigner.fromBunker(clientKey, bp);
      // connect() waits forever if the signer is offline — cap it.
      await Promise.race([
        signer.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("signer did not respond — is it online?")), 25_000),
        ),
      ]);
      const pk = await signer.getPublicKey();
      signerRef.current = signer;
      setBunkerReady(true);
      return pk;
    } finally {
      setConnecting(false);
    }
  }, []);

  // Reconnect a stored bunker session. On failure stay logged in but unable
  // to sign, with the reason shown — the pairing may still be good once the
  // signer is back.
  useEffect(() => {
    if (via !== "bunker") return;
    const s = loadBunker();
    if (!s) return;
    connect(fromHex(s.clientKey), s.bunker).catch((e) =>
      setError(e instanceof Error ? e.message : String(e)),
    );
  }, [via, connect]);

  const login = useCallback(async () => {
    if (typeof window !== "undefined" && window.nostr) {
      try {
        const pk = await window.nostr.getPublicKey();
        if (pk) {
          setPubkey(pk);
          setVia("nip07");
          write(PUBKEY_KEY, pk);
          write(VIA_KEY, "nip07");
        }
      } catch {
        /* user rejected — silently ignore */
      }
      return;
    }
    const cb = `${window.location.origin}${window.location.pathname}?nostr_pk={signature}`;
    window.location.href = `nostrsigner:getpubkey?compressionType=none&returnType=signature&type=get_public_key&callbackUrl=${encodeURIComponent(cb)}`;
  }, []);

  const loginBunker = useCallback(
    async (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;
      // A fresh client key per login: the pairing secret in a bunker://
      // string is single-use, and this key is what the signer remembers.
      const clientKey = generateSecretKey();
      try {
        const pk = await connect(clientKey, trimmed);
        write(BUNKER_KEY, JSON.stringify({ clientKey: toHex(clientKey), bunker: trimmed }));
        write(PUBKEY_KEY, pk);
        write(VIA_KEY, "bunker");
        setPubkey(pk);
        setVia("bunker");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        throw e;
      }
    },
    [connect],
  );

  const logout = useCallback(() => {
    signerRef.current?.close().catch(() => {});
    signerRef.current = null;
    setBunkerReady(false);
    setPubkey(null);
    setVia(null);
    setError(null);
    write(PUBKEY_KEY, null);
    write(VIA_KEY, null);
    write(BUNKER_KEY, null);
  }, []);

  const signEvent = useCallback(
    async (template: EventTemplate): Promise<NostrEvent | null> => {
      try {
        if (via === "bunker") {
          const s = signerRef.current;
          if (!s) return null;
          // The signer decides whose key signs; a template carries no pubkey.
          const { kind, content, tags, created_at } = template;
          return await s.signEvent({ kind, content, tags, created_at });
        }
        if (!window.nostr) return null;
        const signed = (await window.nostr.signEvent(template)) as NostrEvent;
        return signed && signed.id ? signed : null;
      } catch (e) {
        console.warn("sign rejected", e);
        return null;
      }
    },
    [via],
  );

  const canSign =
    !!pubkey &&
    (via === "bunker" ? bunkerReady : via === "nip07" && typeof window !== "undefined" && !!window.nostr);

  const value = useMemo(
    () => ({ pubkey, via, connecting, error, canSign, login, loginBunker, logout, signEvent }),
    [pubkey, via, connecting, error, canSign, login, loginBunker, logout, signEvent],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNostrLogin() {
  const v = useContext(Ctx);
  if (!v)
    throw new Error("useNostrLogin must be used inside <NostrLoginProvider>");
  return v;
}
