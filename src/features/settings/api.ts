import type { ApiResponse } from "@/types/api";
import type { UpdateSettingsInput } from "./schemas";

/** Client-side wrapper over PATCH /api/v1/settings. */
export const settingsApi = {
  async update(input: UpdateSettingsInput): Promise<ApiResponse> {
    try {
      const res = await fetch("/api/v1/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      return (await res.json()) as ApiResponse;
    } catch {
      return {
        success: false,
        message: "Network error. Check your connection and try again.",
        error: { code: "NETWORK" },
      };
    }
  },
};
