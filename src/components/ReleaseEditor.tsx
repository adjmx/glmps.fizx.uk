import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SimplePool, type Event as NostrEvent } from "nostr-tools";
import { useNostrLogin } from "@/hooks/useNostrLogin";
import { uploadImageToNostrBuild } from "@/lib/uploadImage";
import { DEFAULT_RELAYS, RELEASE_KIND } from "@/config";
import type { Release } from "@/lib/nostr";

// Controlled editor modal for kind:31237 releases. Used in two modes:
//   - "new": blank form, d-tag auto-derived from artist+title slug
//   - "edit": pre-filled from the release, d-tag locked (replaces the
//     existing event via NIP-01 replaceable semantics)

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

type FormState = {
  title: string;
  artist: string;
  medium: "physical" | "digital";
  year: string;
  format: string;
  image: string;
  notes: string;
};

const EMPTY: FormState = { title: "", artist: "", medium: "digital", year: "", format: "", image: "", notes: "" };

function fromRelease(r: Release): FormState {
  return {
    title: r.title,
    artist: r.artist,
    medium: r.medium === "physical" ? "physical" : "digital",
    year: r.year ?? "",
    format: r.format ?? "",
    image: r.image ?? "",
    notes: r.notes ?? "",
  };
}

type Status =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "signing" }
  | { kind: "publishing" }
  | { kind: "done"; ok: number; total: number }
  | { kind: "error"; reason: string };

type Props = {
  mode: "new" | "edit";
  release?: Release;
  onClose: () => void;
};

export default function ReleaseEditor({ mode, release, onClose }: Props) {
  const { pubkey } = useNostrLogin();
  const initial = useMemo<FormState>(() => (mode === "edit" && release ? fromRelease(release) : EMPTY), [mode, release]);
  const [form, setForm] = useState<FormState>(initial);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Esc to close (only when nothing in-flight).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && status.kind === "idle") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, status.kind]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onFile = useCallback(
    async (file: File) => {
      if (!pubkey) return;
      setStatus({ kind: "uploading" });
      const r = await uploadImageToNostrBuild(file, pubkey);
      if (!r.ok) {
        setStatus({ kind: "error", reason: r.reason });
        return;
      }
      setField("image", r.url);
      setStatus({ kind: "idle" });
    },
    [pubkey],
  );

  const canPublish = !!pubkey && !!window.nostr && form.title.trim() && form.artist.trim();

  // For edit mode keep the existing d-tag (replace semantics); for new mode
  // derive it from the slug.
  const dTag = mode === "edit" && release ? release.d : `${slug(form.artist)}-${slug(form.title)}`;
  const dPreview = mode === "edit" ? dTag : `${slug(form.artist || "—")}-${slug(form.title || "—")}`;

  const onPublish = useCallback(async () => {
    if (!pubkey || !window.nostr || !canPublish) return;
    const titleT = form.title.trim();
    const artistT = form.artist.trim();
    if (!dTag) {
      setStatus({ kind: "error", reason: "title/artist must contain letters or numbers" });
      return;
    }

    const tags: string[][] = [
      ["d", dTag],
      ["title", titleT],
      ["artist", artistT],
      ["medium", form.medium],
    ];
    if (form.year.trim()) tags.push(["year", form.year.trim()]);
    if (form.format.trim()) tags.push(["format", form.format.trim()]);
    if (form.image.trim()) tags.push(["image", form.image.trim()]);

    const template = {
      kind: RELEASE_KIND,
      created_at: Math.floor(Date.now() / 1000),
      content: form.notes.trim(),
      tags,
      pubkey,
    };

    setStatus({ kind: "signing" });
    let signed: NostrEvent;
    try {
      signed = (await window.nostr.signEvent(template)) as NostrEvent;
    } catch (e) {
      setStatus({ kind: "error", reason: (e as Error)?.message ?? "signing rejected" });
      return;
    }

    setStatus({ kind: "publishing" });
    const pool = new SimplePool();
    const relays = [...DEFAULT_RELAYS];
    const results = await Promise.allSettled(pool.publish(relays, signed));
    pool.close(relays);
    const ok = results.filter((r) => r.status === "fulfilled").length;
    setStatus({ kind: "done", ok, total: results.length });
    setTimeout(() => onClose(), 1800);
  }, [pubkey, canPublish, form, dTag, onClose]);

  const headline = mode === "edit" ? `Edit · ${release?.title ?? ""}` : "New release";
  const actionLabel = mode === "edit" ? "save" : "publish";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget && status.kind === "idle") onClose();
      }}
    >
      <div className="w-full sm:max-w-lg bg-card border border-border rounded-t-xl sm:rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-sm truncate">{headline}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={status.kind !== "idle" && status.kind !== "error"}
            className="text-muted-foreground/60 hover:text-foreground transition-colors disabled:opacity-30"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-3 text-sm">
          <Field label="title *">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="album name"
              className="w-full bg-background border border-border px-2 py-1.5 text-sm focus:outline-none focus:border-primary/50"
              autoFocus
            />
          </Field>
          <Field label="artist *">
            <input
              type="text"
              value={form.artist}
              onChange={(e) => setField("artist", e.target.value)}
              placeholder="artist name"
              className="w-full bg-background border border-border px-2 py-1.5 text-sm focus:outline-none focus:border-primary/50"
            />
          </Field>
          <Field label="medium *">
            <div className="flex gap-2">
              {(["physical", "digital"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setField("medium", m)}
                  className={`text-xs font-mono px-3 py-1 border transition-colors ${
                    form.medium === m
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="year">
              <input
                type="text"
                value={form.year}
                onChange={(e) => setField("year", e.target.value)}
                placeholder="e.g. 2024"
                className="w-full bg-background border border-border px-2 py-1.5 text-sm focus:outline-none focus:border-primary/50"
              />
            </Field>
            <Field label="format">
              <input
                type="text"
                value={form.format}
                onChange={(e) => setField("format", e.target.value)}
                placeholder={`e.g. 12", EP`}
                className="w-full bg-background border border-border px-2 py-1.5 text-sm focus:outline-none focus:border-primary/50"
              />
            </Field>
          </div>
          <Field label="image url">
            <div className="flex gap-2">
              <input
                type="url"
                value={form.image}
                onChange={(e) => setField("image", e.target.value)}
                placeholder="https://… or upload →"
                className="flex-1 bg-background border border-border px-2 py-1.5 text-sm focus:outline-none focus:border-primary/50"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onFile(f);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={status.kind === "uploading"}
                className="text-xs font-mono px-3 py-1 border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-40 shrink-0"
              >
                {status.kind === "uploading" ? "…" : "upload"}
              </button>
            </div>
          </Field>
          <Field label="notes">
            <textarea
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="free-form notes (kind:31237 content)"
              rows={3}
              className="w-full bg-background border border-border px-2 py-1.5 text-sm focus:outline-none focus:border-primary/50 resize-y font-mono"
            />
          </Field>
          {mode === "edit" && (
            <div className="text-[10px] font-mono text-muted-foreground/60 border-l-2 border-accent/40 pl-2 py-1">
              d-tag locked: <span className="text-accent/70">{dTag}</span> — saving replaces the existing release.
            </div>
          )}
        </div>

        <div className="border-t border-border px-4 py-3 flex items-center justify-between gap-3">
          <div className="text-[11px] font-mono text-muted-foreground/60 flex-1 min-w-0 truncate">
            {status.kind === "uploading"
              ? "uploading image…"
              : status.kind === "signing"
              ? "waiting for signer…"
              : status.kind === "publishing"
              ? "publishing to relays…"
              : status.kind === "done"
              ? `${mode === "edit" ? "saved" : "published"} to ${status.ok}/${status.total} relays ✓`
              : status.kind === "error"
              ? `× ${status.reason}`
              : `d: ${dPreview}`}
          </div>
          <button
            type="button"
            onClick={onPublish}
            disabled={!canPublish || (status.kind !== "idle" && status.kind !== "error")}
            className="text-xs font-mono px-4 py-1.5 border border-accent/50 text-accent hover:bg-accent/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
