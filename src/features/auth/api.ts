import type { ApiResponse } from "@/types/api";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "./schemas";

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

/** Client-side wrappers over the /api/v1/auth endpoints. */
export const authApi = {
  register: (input: RegisterInput) =>
    postJson<{ needsEmailConfirmation: boolean }>(
      "/api/v1/auth/register",
      input,
    ),
  login: (input: LoginInput) => postJson("/api/v1/auth/login", input),
  logout: () => postJson("/api/v1/auth/logout", {}),
  forgotPassword: (input: ForgotPasswordInput) =>
    postJson("/api/v1/auth/forgot-password", input),
  resetPassword: (input: ResetPasswordInput) =>
    postJson("/api/v1/auth/reset-password", input),
};
