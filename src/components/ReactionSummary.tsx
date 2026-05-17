import { useReactions } from "@/hooks/useReactions";
import { displayCount } from "@/lib/rating";
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
  const { up, down, info } = forAddr(addr);
  const reactors = reactorsByAddr(addr);
  const noActivity = up === 0 && down === 0 && info === 0;

  return (
    <section className="space-y-3 border border-border/60 rounded-md p-4 bg-card/40">
      <div className="flex items-center gap-3 flex-wrap">
        <StarRow up={up} down={down} size="md" showWhenUnrated />
        <div className="font-mono text-[11px] text-muted-foreground/80">
          {displayCount(up)} ↑ · {displayCount(down)} ↓ · {displayCount(info)} + info
          {noActivity && (
            <span className="text-muted-foreground/40">  (no reactions yet)</span>
          )}
        </div>
      </div>
      {!noActivity && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <ReactorTrail pubkeys={reactors.up} label="↑" />
          <ReactorTrail pubkeys={reactors.down} label="↓" />
          <ReactorTrail pubkeys={reactors.info} label="info" />
        </div>
      )}
      <ReactionButtons addr={addr} />
    </section>
  );
}
