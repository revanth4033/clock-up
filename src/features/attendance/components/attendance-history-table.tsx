import { AttendanceStatusBadge } from "@/features/dashboard/components/attendance-status-badge";
import {
  formatMinutes,
  formatShortDate,
  formatTimeOfDay,
} from "@/utils/format";
import type { HistoryRecord } from "@/types/domain";

const TH = "px-3 py-2 font-medium";
const TD = "px-3 py-2.5 whitespace-nowrap";

/** Per-day Time Credit figures, keyed by attendance id. */
export type HistoryCredits = Record<
  string,
  { redeemedCredits: number; countedMinutes: number; earnedCredits: number }
>;

export function AttendanceHistoryTable({
  records,
  officeName,
  credits,
}: {
  records: HistoryRecord[];
  officeName: string;
  /** When provided, the table shows Redeemed / Counted / Earned columns so the
   * daily result (Worked + Redeemed = Counted → Points, Earned) is legible. */
  credits?: HistoryCredits;
}) {
  const showCredits = !!credits;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-border text-muted-foreground border-b text-left text-xs">
            <th className={TH}>Date</th>
            <th className={TH}>Clock In</th>
            <th className={TH}>Clock Out</th>
            <th className={showCredits ? `${TH} text-right` : TH}>
              {showCredits ? "Worked" : "Total"}
            </th>
            {showCredits && (
              <>
                <th className={`${TH} text-right`}>Redeemed</th>
                <th className={`${TH} text-right`}>Counted</th>
              </>
            )}
            <th className={TH}>Status</th>
            <th className={`${TH} text-right`}>Points</th>
            {showCredits && <th className={`${TH} text-right`}>Earned</th>}
            <th className={TH}>Office</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => {
            const c = credits?.[r.id];
            return (
              <tr
                key={r.id}
                className="border-border/60 border-b last:border-0"
              >
                <td className={`${TD} font-medium`}>
                  {formatShortDate(r.workDate)}
                  {r.isEdited && (
                    <span className="bg-muted text-muted-foreground ml-1.5 rounded px-1 py-0.5 align-middle text-[0.6rem]">
                      Edited
                    </span>
                  )}
                </td>
                <td className={`${TD} tabular-nums`}>
                  {formatTimeOfDay(r.clockIn)}
                </td>
                <td className={`${TD} tabular-nums`}>
                  {formatTimeOfDay(r.clockOut)}
                </td>
                <td
                  className={
                    showCredits
                      ? `${TD} text-right tabular-nums`
                      : `${TD} tabular-nums`
                  }
                >
                  {r.workedMinutes != null
                    ? formatMinutes(r.workedMinutes)
                    : "—"}
                </td>
                {showCredits && (
                  <>
                    <td className={`${TD} text-right tabular-nums`}>
                      {c ? c.redeemedCredits || "—" : "—"}
                    </td>
                    <td className={`${TD} text-right tabular-nums`}>
                      {c ? formatMinutes(c.countedMinutes) : "—"}
                    </td>
                  </>
                )}
                <td className={TD}>
                  <AttendanceStatusBadge state={r.status} />
                </td>
                <td className={`${TD} text-right font-medium tabular-nums`}>
                  {r.pointsEarned || "—"}
                </td>
                {showCredits && (
                  <td className={`${TD} text-right tabular-nums`}>
                    {c ? c.earnedCredits || "—" : "—"}
                  </td>
                )}
                <td className={`${TD} text-muted-foreground`}>{officeName}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
