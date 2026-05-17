// nostr.build NIP-96 image upload, NIP-98 authed. Mirrors the pattern used
// in fx.fizx.uk's share-to-nostr flow. One sign + one POST per upload.

const NB_UPLOAD_URL = "https://nostr.build/api/v2/nip96/upload";

/**
 * Sign a kind:27235 NIP-98 event for the given URL+method, base64-encode it,
 * and return the value of an Authorization: Nostr <…> header.
 */
async function buildNip98Auth(url: string, method: string, pubkey: string): Promise<string | null> {
  if (typeof window === "undefined" || !window.nostr) return null;
  const template = {
    kind: 27235,
    created_at: Math.floor(Date.now() / 1000),
    content: "",
    tags: [
      ["u", url],
      ["method", method.toUpperCase()],
    ],
    pubkey,
  };
  try {
    const signed = await window.nostr.signEvent(template);
    return "Nostr " + btoa(JSON.stringify(signed));
  } catch {
    return null;
  }
}

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; reason: string };

export async function uploadImageToNostrBuild(file: File, pubkey: string): Promise<UploadResult> {
  const auth = await buildNip98Auth(NB_UPLOAD_URL, "POST", pubkey);
  if (!auth) return { ok: false, reason: "auth signing rejected" };

  const form = new FormData();
  form.append("file", file);

  try {
    const res = await fetch(NB_UPLOAD_URL, {
      method: "POST",
      headers: { Authorization: auth },
      body: form,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, reason: `upload ${res.status}: ${txt.slice(0, 80)}` };
    }
    const json = await res.json();
    // NIP-96 response: { status, nip94_event: { tags: [["url", "..."], ...] } }
    const urlTag = json?.nip94_event?.tags?.find?.((t: string[]) => t[0] === "url");
    const url = urlTag?.[1];
    if (!url) return { ok: false, reason: "no url in response" };
    return { ok: true, url };
  } catch (e) {
    return { ok: false, reason: `upload: ${(e as Error)?.message ?? "failed"}` };
  }
}
