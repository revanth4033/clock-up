import type { ApiResponse } from "@/types/api";
import type { ClockOutResult, GeoCoords } from "@/types/domain";

async function postJson<T>(
  url: string,
  body: unknown,
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json()) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      message: "Network error. Check your connection and try again.",
      error: { code: "NETWORK" },
    };
  }
}

export const attendanceApi = {
  clockIn: (coords: GeoCoords) =>
    postJson<null>("/api/v1/attendance/clock-in", coords),
  clockOut: (coords: GeoCoords) =>
    postJson<ClockOutResult>("/api/v1/attendance/clock-out", coords),
  recover: (attendanceId: string, clockOut: string) =>
    postJson<ClockOutResult>("/api/v1/attendance/recover", {
      attendanceId,
      clockOut,
    }),
};
