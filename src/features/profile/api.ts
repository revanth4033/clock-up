import type { ApiResponse } from "@/types/api";
import type { ChangePasswordInput, UpdateNameInput } from "./schemas";

async function sendJson(
  url: string,
  method: "POST" | "PATCH",
  body: unknown,
): Promise<ApiResponse> {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json()) as ApiResponse;
  } catch {
    return {
      success: false,
      message: "Network error. Check your connection and try again.",
      error: { code: "NETWORK" },
    };
  }
}

/** Client-side wrappers over the /api/v1/profile endpoints. */
export const profileApi = {
  updateName: (input: UpdateNameInput) =>
    sendJson("/api/v1/profile", "PATCH", input),
  changePassword: (input: ChangePasswordInput) =>
    sendJson("/api/v1/profile/change-password", "POST", input),
};
