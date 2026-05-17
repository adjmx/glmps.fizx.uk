import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Release } from "@/lib/nostr";
import ReleaseEditor from "@/components/ReleaseEditor";

// Editor state — `null` means closed, otherwise carries mode + (for edit)
// the release being edited. Provided once at app level so any descendant
// (the FAB at root, an edit-pencil deep in a release card) can open it
// without prop-drilling.
type EditorState = { mode: "new" } | { mode: "edit"; release: Release } | null;

type Ctx = {
  state: EditorState;
  openNew: () => void;
  openEdit: (release: Release) => void;
  close: () => void;
};

const C = createContext<Ctx | null>(null);

export function ReleaseEditorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EditorState>(null);
  const openNew = useCallback(() => setState({ mode: "new" }), []);
  const openEdit = useCallback((release: Release) => setState({ mode: "edit", release }), []);
  const close = useCallback(() => setState(null), []);

  const value = useMemo<Ctx>(() => ({ state, openNew, openEdit, close }), [state, openNew, openEdit, close]);

  return (
    <C.Provider value={value}>
      {children}
      {state !== null && (
        <ReleaseEditor
          mode={state.mode}
          release={state.mode === "edit" ? state.release : undefined}
          onClose={close}
        />
      )}
    </C.Provider>
  );
}

export function useReleaseEditor() {
  const v = useContext(C);
  if (!v) throw new Error("useReleaseEditor must be used inside <ReleaseEditorProvider>");
  return v;
}
