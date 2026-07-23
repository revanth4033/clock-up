import type { ApiResponse } from "@/types/api";

/**
 * Shared client-side JSON fetch for the /api/v1 endpoints. Sends a JSON body
 * (when provided) and normalizes network failures into the standard
 * `ApiResponse` envelope so callers only branch on `success`.
 */
export async function fetchJson<T = null>(
  url: string,
  options: { method?: "POST" | "PATCH"; body?: unknown } = {},
): Promise<ApiResponse<T>> {
  const { method = "POST", body } = options;
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
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
