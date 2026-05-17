import { useState } from "react";
import { useIsOwner } from "@/hooks/useIsOwner";

// Owner-only button that copies a release's naddr1… to the clipboard so the
// owner can paste it into their local ndisc instance for editing. Glmps is a
// read-only viewer; ndisc is the editor.
//
// Designed to be safe inside <Link> wrappers: stopPropagation + preventDefault
// keep clicks from triggering navigation.
export default function OwnerNaddrCopy({ naddr, className = "" }: { naddr: string; className?: string }) {
  const isOwner = useIsOwner();
  const [copied, setCopied] = useState(false);
  if (!isOwner) return null;

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard
      .writeText(naddr)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        // navigator.clipboard requires HTTPS + user gesture; both met here,
        // but some browsers still refuse silently. Fail soft.
      });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={copied ? "copied to clipboard" : "copy naddr — paste into ndisc to edit"}
      className={`text-[9px] font-mono px-1.5 py-0.5 border rounded transition-colors ${
        copied
          ? "border-emerald-400/50 text-emerald-400 bg-emerald-400/10"
          : "border-accent/40 text-accent/80 bg-card/80 backdrop-blur-sm hover:bg-accent/15"
      } ${className}`}
    >
      {copied ? "copied ✓" : "naddr"}
    </button>
  );
}
