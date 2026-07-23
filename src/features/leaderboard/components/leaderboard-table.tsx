import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { initialsOf } from "@/utils/format";
import type { LeaderboardData } from "@/services/leaderboard.service";

function rankClass(rank: number) {
  if (rank === 1) return "text-amber-500";
  if (rank === 2) return "text-slate-400";
  if (rank === 3) return "text-orange-400";
  return "text-muted-foreground";
}

const TH = "px-3 py-2 font-medium";
const TD = "px-3 py-3 whitespace-nowrap";

export function LeaderboardTable({ rows }: { rows: LeaderboardData["rows"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-border text-muted-foreground border-b text-left text-xs">
            <th className={cn(TH, "w-14 text-center")}>Rank</th>
            <th className={TH}>Employee</th>
            <th className={cn(TH, "hidden md:table-cell")}>Designation</th>
            <th className={cn(TH, "hidden lg:table-cell")}>Office</th>
            <th className={cn(TH, "text-right")}>Points</th>
            <th className={cn(TH, "hidden text-right sm:table-cell")}>
              Completed
            </th>
            <th className={cn(TH, "hidden sm:table-cell")}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.userId}
              className={cn(
                "border-border/60 border-b last:border-0",
                r.isCurrentUser && "bg-primary/5",
              )}
            >
              <td className={cn(TD, "text-center")}>
                <span
                  className={cn("font-bold tabular-nums", rankClass(r.rank))}
                >
                  {r.rank}
                </span>
              </td>
              <td className={TD}>
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-8">
                    <AvatarImage src={r.avatarUrl ?? undefined} alt="" />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {initialsOf(r.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {r.name}
                    {r.isCurrentUser && (
                      <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                        (You)
                      </span>
                    )}
                  </span>
                </div>
              </td>
              <td
                className={cn(TD, "text-muted-foreground hidden md:table-cell")}
              >
                {r.designation}
              </td>
              <td
                className={cn(TD, "text-muted-foreground hidden lg:table-cell")}
              >
                {r.officeName}
              </td>
              <td className={cn(TD, "text-right font-semibold tabular-nums")}>
                {r.points}
              </td>
              <td
                className={cn(
                  TD,
                  "hidden text-right tabular-nums sm:table-cell",
                )}
              >
                {r.completedDays}
              </td>
              <td className={cn(TD, "hidden sm:table-cell")}>
                {r.completedDays > 0 ? (
                  <span className="bg-success/10 text-success inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium">
                    <span className="bg-success size-1.5 rounded-full" />
                    Active
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
