import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

/** Maps a business error code to an HTTP status (ASD "HTTP Status Codes"). */
const ERROR_STATUS: Record<string, number> = {
  INVALID_REQUEST: 400,
  AUTH_REQUIRED: 401,
  INVALID_CREDENTIALS: 401,
  EMAIL_NOT_CONFIRMED: 403,
  EMPLOYEE_EXISTS: 409,
  EMAIL_EXISTS: 409,
  INVALID_OFFICE: 422,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500,
};

export function apiSuccess<T>(data: T, message: string, status = 200) {
  return NextResponse.json<ApiResponse<T>>(
    { success: true, message, data },
    { status },
  );
}

export function apiError(message: string, code: string, details?: unknown) {
  return NextResponse.json<ApiResponse>(
    { success: false, message, error: { code, details } },
    { status: ERROR_STATUS[code] ?? 400 },
  );
}
