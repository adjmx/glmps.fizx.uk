import { useIsOwner } from "@/hooks/useIsOwner";
import { useReleaseEditor } from "@/hooks/useReleaseEditor";

// Owner-only floating "+" button. Opens the shared <ReleaseEditor/> in
// "new" mode via context. Modal lifecycle + form state live in the editor
// component itself.
export default function NewReleaseFab() {
  const isOwner = useIsOwner();
  const { openNew } = useReleaseEditor();
  if (!isOwner) return null;

  return (
    <button
      type="button"
      onClick={openNew}
      title="Quick publish a release"
      className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/30 hover:shadow-accent/50 hover:scale-105 transition-all flex items-center justify-center text-2xl font-light"
      aria-label="New release"
    >
      +
    </button>
  );
}
