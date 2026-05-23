import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  useReactions,
  REACTION_UP,
  REACTION_DOWN,
} from "@/hooks/useReactions";
import { useNostrLogin } from "@/hooks/useNostrLogin";
import { classifyReaction } from "@/lib/rating";

type Props = {
  addr: string;
  /** Layout. Detail page uses "lg"; cards never render this component. */
  size?: "sm" | "lg";
};

export default function ReactionButtons({ addr, size = "lg" }: Props) {
  const { pubkey } = useNostrLogin();
  const { forAddr, publish, revoke, canPublish } = useReactions();
  const { up, down, myReaction } = forAddr(addr);
  const myKind = myReaction ? classifyReaction(myReaction.content) : null;
  const [busy, setBusy] = useState<null | "up" | "down">(null);

  if (!pubkey) {
    return (
      <div className="text-[11px] font-mono text-muted-foreground/60">
        log in to vote · {up}↑ · {down}↓
      </div>
    );
  }

  if (!canPublish) {
    return (
      <div className="text-[11px] font-mono text-red-400/80">
        NIP-07 signer not available — install a Nostr browser extension to vote
      </div>
    );
  }

  const click = async (kind: "up" | "down") => {
    if (busy) return;
    setBusy(kind);
    try {
      const content = kind === "up" ? REACTION_UP : REACTION_DOWN;
      if (myKind === kind) {
        // Same button clicked twice → revoke via kind:5 deletion.
        await revoke(addr);
      } else {
        // Switch or first-time vote → publish new kind:7. Latest wins.
        // If we already had a vote of a different kind, we DON'T explicitly
        // revoke it — the newer event supersedes it per our latest-wins rule.
        await publish(addr, content);
      }
    } catch (e) {
      // publish/revoke roll back their own optimistic state on total failure;
      // the reverted buttons are the user-facing signal.
      console.warn("reaction failed", e);
    } finally {
      setBusy(null);
    }
  };

  const btnBase =
    size === "lg"
      ? "text-[12px] px-3 py-1.5 gap-1.5"
      : "text-[10px] px-2 py-1 gap-1";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => click("up")}
        aria-pressed={myKind === "up"}
        className={cn(
          "font-mono inline-flex items-center rounded border transition-colors",
          btnBase,
          myKind === "up"
            ? "border-accent text-accent bg-accent/10"
            : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40",
          busy === "up" && "opacity-50",
        )}
      >
        <span aria-hidden>↑</span>
        <span>{up}</span>
      </button>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => click("down")}
        aria-pressed={myKind === "down"}
        className={cn(
          "font-mono inline-flex items-center rounded border transition-colors",
          btnBase,
          myKind === "down"
            ? "border-accent text-accent bg-accent/10"
            : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40",
          busy === "down" && "opacity-50",
        )}
      >
        <span aria-hidden>↓</span>
        <span>{down}</span>
      </button>
    </div>
  );
}
