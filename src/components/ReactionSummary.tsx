import { useReactions } from "@/hooks/useReactions";
import StarRow from "./StarRow";
import ReactionButtons from "./ReactionButtons";
import ReactorTrail from "./ReactorTrail";

type Props = { addr: string };

/**
 * Detail-page reaction block: large star row, breakdown, action buttons.
 * On cards/rows we just use <StarRow> directly with reaction counts.
 */
export default function ReactionSummary({ addr }: Props) {
  const { forAddr, reactorsByAddr } = useReactions();
  const { up, down } = forAddr(addr);
  const reactors = reactorsByAddr(addr);
  const noActivity = up === 0 && down === 0;

  return (
    <section className="space-y-3 border border-border/60 rounded-md p-4 bg-card/40">
      <StarRow up={up} down={down} size="md" showWhenUnrated />
      {!noActivity && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <ReactorTrail pubkeys={reactors.up} label="↑" />
          <ReactorTrail pubkeys={reactors.down} label="↓" />
        </div>
      )}
      <ReactionButtons addr={addr} />
    </section>
  );
}
