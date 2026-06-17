import { useMemo } from "react";
import { Link } from "react-router-dom";
import Nav from "@/components/Nav";
import StatsSummary from "@/components/StatsSummary";
import StatsBreakdown from "@/components/StatsBreakdown";
import { useReleases } from "@/hooks/useReleases";
import { OWNER_NPUB } from "@/config";
import { npubToHex } from "@/lib/nostr";

export default function Stats() {
  const { hex, npubError } = useMemo(() => {
    try {
      return { hex: npubToHex(OWNER_NPUB), npubError: null as string | null };
    } catch (e) {
      return { hex: undefined, npubError: (e as Error).message };
    }
  }, []);

  const { releases, loading, eose } = useReleases(hex);

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="container max-w-5xl py-8 sm:py-12">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h1 className="font-mono text-lg text-foreground">
            discography <span className="text-muted-foreground">/ stats</span>
          </h1>
          <Link
            to="/"
            className="font-mono text-[11px] text-accent hover:text-primary transition-colors shrink-0"
          >
            ‹ back to releases
          </Link>
        </div>

        {npubError ? (
          <div className="text-sm text-red-400 font-mono">{npubError}</div>
        ) : (
          <div className="bg-card border border-border p-4 sm:p-6 space-y-6">
            <StatsSummary releases={releases} />
            {loading && releases.length === 0 ? (
              <p className="font-mono text-[11px] text-muted-foreground">
                loading breakdown…
              </p>
            ) : releases.length === 0 && eose ? (
              <p className="font-mono text-[11px] text-muted-foreground">
                no releases found
              </p>
            ) : (
              <StatsBreakdown releases={releases} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
