import { fetchJson } from "@/lib/api/fetch-json";
import type { ClockOutResult, GeoCoords } from "@/types/domain";

/** Client-side wrappers over the /api/v1/attendance endpoints. */
export const attendanceApi = {
  clockIn: (coords: GeoCoords) =>
    fetchJson<null>("/api/v1/attendance/clock-in", { body: coords }),
  clockOut: (coords: GeoCoords) =>
    fetchJson<ClockOutResult>("/api/v1/attendance/clock-out", { body: coords }),
  recover: (attendanceId: string, clockOut: string) =>
    fetchJson<ClockOutResult>("/api/v1/attendance/recover", {
      body: { attendanceId, clockOut },
    }),
};
