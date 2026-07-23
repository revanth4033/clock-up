import type { NextRequest } from "next/server";
import { recoverSchema } from "@/features/attendance/schemas";
import { recoverMissedClockOut } from "@/services/attendance.service";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = recoverSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "Please provide a valid clock-out time.",
      "INVALID_REQUEST",
      parsed.error.flatten().fieldErrors,
    );
  }
  const result = await recoverMissedClockOut(
    parsed.data.attendanceId,
    parsed.data.clockOut,
  );
  if (!result.ok) return apiError(result.message, result.code);
  return apiSuccess(result.data, result.message);
}
