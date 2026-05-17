import { useEffect, useRef, useState } from "react";

/**
 * Tiny popover state machine. Returns:
 *   - `open`: boolean
 *   - `toggle`, `close`: setters
 *   - `ref`: attach to the root element; outside clicks close the popover
 *
 * Auto-closes on Escape and on `mousedown` outside `ref.current`.
 */
export function usePopover<T extends HTMLElement = HTMLElement>() {
  const [open, setOpen] = useState(false);
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return {
    open,
    toggle: () => setOpen((o) => !o),
    close: () => setOpen(false),
    ref,
  };
}
