import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// NIP-07: window.nostr injected by browser extensions (Alby, nos2x, …).
// NIP-55: nostrsigner: URI scheme used by Android signers (Amber); the
// signer redirects back with `?nostr_pk=<pubkey>`.
declare global {
  interface Window {
    nostr?: {
      getPublicKey(): Promise<string>;
      signEvent(e: object): Promise<object>;
    };
  }
}

type NostrLoginCtx = {
  pubkey: string | null;
  login: () => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<NostrLoginCtx | null>(null);

export function NostrLoginProvider({ children }: { children: ReactNode }) {
  const [pubkey, setPubkey] = useState<string | null>(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get(
        "nostr_pk",
      );
      if (fromUrl) {
        localStorage.setItem("nostr_pubkey", fromUrl);
        return fromUrl;
      }
      return localStorage.getItem("nostr_pubkey");
    } catch {
      return null;
    }
  });

  // Strip nostr_pk from the URL once consumed.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("nostr_pk")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const login = useCallback(async () => {
    if (typeof window !== "undefined" && window.nostr) {
      try {
        const pk = await window.nostr.getPublicKey();
        if (pk) {
          setPubkey(pk);
          localStorage.setItem("nostr_pubkey", pk);
        }
      } catch {
        /* user rejected — silently ignore */
      }
      return;
    }
    const cb = `${window.location.origin}${window.location.pathname}?nostr_pk={signature}`;
    window.location.href = `nostrsigner:getpubkey?compressionType=none&returnType=signature&type=get_public_key&callbackUrl=${encodeURIComponent(cb)}`;
  }, []);

  const logout = useCallback(() => {
    setPubkey(null);
    try {
      localStorage.removeItem("nostr_pubkey");
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ pubkey, login, logout }),
    [pubkey, login, logout],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNostrLogin() {
  const v = useContext(Ctx);
  if (!v)
    throw new Error("useNostrLogin must be used inside <NostrLoginProvider>");
  return v;
}
