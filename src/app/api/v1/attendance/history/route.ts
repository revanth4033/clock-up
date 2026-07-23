import type { NextRequest } from "next/server";
import { getAttendanceHistory } from "@/services/attendance.service";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  const pageParam = new URL(req.url).searchParams.get("page");
  const page = Number(pageParam ?? "1");
  const result = await getAttendanceHistory(Number.isFinite(page) ? page : 1);
  if (!result.ok) return apiError(result.message, result.code);
  return apiSuccess(result.data, result.message);
}
