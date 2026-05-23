import { useEffect, useState } from "react";
import { SimplePool, type Event as NostrEvent, nip19 } from "nostr-tools";
import {
  isNewerReplaceable,
  parseLabelLibrary,
  type LabelLibrary,
} from "@/lib/nostr";
import { DEFAULT_RELAYS, LABEL_LIBRARY_KIND, OWNER_NPUB } from "@/config";

// d-tag value is fixed by the labels.v1 contract — see schema/labels.v1.json.
const LABEL_LIBRARY_D = "disco-vault:labels";

const ownerHex = (() => {
  try {
    const dec = nip19.decode(OWNER_NPUB);
    return dec.type === "npub" ? (dec.data as string) : "";
  } catch {
    return "";
  }
})();

/**
 * Owner-published record-label image library (kind:31238, schema labels.v1).
 * One event per author addressed by ("disco-vault:labels"). Returns `null`
 * until the event lands (and remains `null` if the manifest doesn't exist
 * yet — ndisc may not have published it). Callers should use
 * `imageForLabel` for safe lookup with a graceful fallback.
 */
export function useLabelLibrary() {
  const [library, setLibrary] = useState<LabelLibrary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerHex) {
      setLoading(false);
      return;
    }

    const pool = new SimplePool();
    const relays = [...DEFAULT_RELAYS];
    let latest: NostrEvent | undefined;

    const sub = pool.subscribeMany(
      relays,
      [
        {
          kinds: [LABEL_LIBRARY_KIND],
          authors: [ownerHex],
          "#d": [LABEL_LIBRARY_D],
        },
      ],
      {
        onevent(ev) {
          if (!isNewerReplaceable(latest, ev)) return;
          latest = ev;
          setLibrary(parseLabelLibrary(ev));
        },
        oneose() {
          setLoading(false);
        },
      },
    );

    // Safety timeout — if no relay responds at all, stop showing "loading"
    // after 5s. The label slot then renders the fallback glyph.
    const t = setTimeout(() => setLoading(false), 5000);

    return () => {
      clearTimeout(t);
      sub.close();
      pool.close(relays);
    };
  }, []);

  return { library, loading };
}

/** Returns the image URL for a label name, or null when unmapped. */
export function imageForLabel(
  library: LabelLibrary | null,
  name: string | undefined,
): string | null {
  if (!library || !name) return null;
  return library.labels[name]?.image ?? null;
}
