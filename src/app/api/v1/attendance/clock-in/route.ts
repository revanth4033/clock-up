import type { NextRequest } from "next/server";
import { clockCoordsSchema } from "@/features/attendance/schemas";
import { clockIn } from "@/services/attendance.service";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = clockCoordsSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "Valid GPS coordinates are required.",
      "INVALID_REQUEST",
      parsed.error.flatten().fieldErrors,
    );
  }
  const result = await clockIn(parsed.data);
  if (!result.ok) return apiError(result.message, result.code);
  return apiSuccess(null, result.message, 201);
}
