import type { ReactNode } from "react";
import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initialsOf } from "@/utils/format";
import type { LeaderboardData } from "@/services/leaderboard.service";

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="bg-secondary/60 rounded-xl px-3 py-2.5">
      <p className="font-heading text-xl font-bold tabular-nums">{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}

/** The signed-in user's own standing (highlighted). */
export function LeaderboardSummary({
  summary,
}: {
  summary: LeaderboardData["summary"];
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-11">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initialsOf(summary.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-muted-foreground text-sm">Your standing</p>
            <p className="font-heading truncate text-lg font-bold">
              {summary.name}
            </p>
          </div>
          <div className="bg-primary/10 text-primary ml-auto flex items-center gap-2 rounded-xl px-3 py-2">
            <Trophy className="size-5 shrink-0" />
            <div>
              <p className="font-heading text-xl leading-none font-bold tabular-nums">
                {summary.rank != null ? `#${summary.rank}` : "—"}
              </p>
              <p className="text-xs">Overall rank</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label="Total points" value={summary.totalPoints} />
          <Metric label="This week" value={summary.weekPoints} />
          <Metric label="Today" value={summary.todayPoints} />
          <Metric label="Days Present" value={summary.completedDays} />
        </div>
      </CardContent>
    </Card>
  );
}
