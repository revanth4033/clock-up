import { AttendanceStatusBadge } from "@/features/dashboard/components/attendance-status-badge";
import {
  formatMinutes,
  formatShortDate,
  formatTimeOfDay,
} from "@/utils/format";
import type { HistoryRecord } from "@/types/domain";

const TH = "px-3 py-2 font-medium";
const TD = "px-3 py-2.5 whitespace-nowrap";

export function AttendanceHistoryTable({
  records,
  officeName,
}: {
  records: HistoryRecord[];
  officeName: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-border text-muted-foreground border-b text-left text-xs">
            <th className={TH}>Date</th>
            <th className={TH}>Clock In</th>
            <th className={TH}>Clock Out</th>
            <th className={TH}>Total</th>
            <th className={TH}>Status</th>
            <th className={`${TH} text-right`}>Points</th>
            <th className={TH}>Office</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="border-border/60 border-b last:border-0">
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
              <td className={`${TD} tabular-nums`}>
                {r.workedMinutes != null ? formatMinutes(r.workedMinutes) : "—"}
              </td>
              <td className={TD}>
                <AttendanceStatusBadge state={r.status} />
              </td>
              <td className={`${TD} text-right font-medium tabular-nums`}>
                {r.pointsEarned || "—"}
              </td>
              <td className={`${TD} text-muted-foreground`}>{officeName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
