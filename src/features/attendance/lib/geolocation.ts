import type { GeoCoords } from "@/types/domain";

export type GeoErrorCode = "GPS_DENIED" | "GPS_UNAVAILABLE" | "GPS_TIMEOUT";

export class GeolocationError extends Error {
  code: GeoErrorCode;
  constructor(code: GeoErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "GeolocationError";
  }
}

const MESSAGES: Record<GeoErrorCode, string> = {
  GPS_DENIED:
    "Location access is required to verify office attendance. Please enable it and try again.",
  GPS_UNAVAILABLE:
    "We couldn't determine your location. Please check your device settings.",
  GPS_TIMEOUT: "Getting your location took too long. Please try again.",
};

/** Resolves the device's current position, or rejects with a GeolocationError. */
export function getCurrentPosition(): Promise<GeoCoords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new GeolocationError("GPS_UNAVAILABLE", MESSAGES.GPS_UNAVAILABLE));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => {
        const code: GeoErrorCode =
          err.code === err.PERMISSION_DENIED
            ? "GPS_DENIED"
            : err.code === err.TIMEOUT
              ? "GPS_TIMEOUT"
              : "GPS_UNAVAILABLE";
        reject(new GeolocationError(code, MESSAGES[code]));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}

export function geoErrorMessage(e: unknown): string {
  if (e instanceof GeolocationError) return e.message;
  return "We couldn't get your location. Please try again.";
}
