import { Check, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Compact, non-dominant explainer of how points are earned. Presentation only —
 * mirrors the flat points model (ADR-009): a completed day that meets the goal
 * earns exactly 100 points, with no overtime bonus.
 */
export function PointsInfoCard() {
  return (
    <Card size="sm" className="rounded-2xl">
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <Trophy
            className="text-muted-foreground size-4 shrink-0"
            aria-hidden
          />
          <h2 className="font-heading text-sm font-medium">How Points Work</h2>
        </div>

        <div className="flex items-start gap-2">
          <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="text-sm leading-relaxed">
            Meet your daily goal of{" "}
            <span className="text-foreground font-semibold">9 hours</span> to
            earn{" "}
            <span className="text-foreground font-semibold tabular-nums">
              100 points
            </span>
            . Every day counts equally — the leaderboard rewards consistency,
            not extra hours.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
