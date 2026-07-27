import Link from "next/link";
import { Trophy } from "lucide-react";
import { DashboardCard } from "./dashboard-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { initialsOf, rankMedalClass } from "@/utils/format";
import type { DashboardData } from "@/services/dashboard.service";

export function LeaderboardPreviewCard({
  leaderboard,
  className,
}: {
  leaderboard: DashboardData["leaderboard"];
  className?: string;
}) {
  return (
    <DashboardCard
      title="Leaderboard"
      icon={Trophy}
      className={className}
      action={
        <Link
          href="/leaderboard"
          className="text-primary focus-visible:ring-ring/50 rounded-sm text-xs font-medium outline-none hover:underline focus-visible:ring-3"
        >
          View all
        </Link>
      }
    >
      {leaderboard.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          No rankings yet.
        </p>
      ) : (
        <ol className="flex flex-col gap-0.5">
          {leaderboard.map((entry) => (
            <li
              key={entry.userId}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2 py-2.5",
                entry.isCurrentUser && "bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "w-6 shrink-0 text-center text-base font-bold tabular-nums",
                  rankMedalClass(entry.rank),
                )}
              >
                {entry.rank}
              </span>
              <Avatar className="size-8">
                <AvatarImage src={entry.avatarUrl ?? undefined} alt="" />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initialsOf(entry.name)}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate text-sm font-medium">
                {entry.name}
                {entry.isCurrentUser && (
                  <span className="text-muted-foreground ml-1 text-xs font-normal">
                    (You)
                  </span>
                )}
              </span>
              <span className="font-heading text-sm font-bold tabular-nums">
                {entry.points}
              </span>
            </li>
          ))}
        </ol>
      )}
    </DashboardCard>
  );
}
