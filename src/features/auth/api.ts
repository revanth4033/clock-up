import { fetchJson } from "@/lib/api/fetch-json";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "./schemas";

/** Client-side wrappers over the /api/v1/auth endpoints. */
export const authApi = {
  register: (input: RegisterInput) =>
    fetchJson<{ needsEmailConfirmation: boolean }>("/api/v1/auth/register", {
      body: input,
    }),
  login: (input: LoginInput) =>
    fetchJson("/api/v1/auth/login", { body: input }),
  logout: () => fetchJson("/api/v1/auth/logout", { body: {} }),
  forgotPassword: (input: ForgotPasswordInput) =>
    fetchJson("/api/v1/auth/forgot-password", { body: input }),
  resetPassword: (input: ResetPasswordInput) =>
    fetchJson("/api/v1/auth/reset-password", { body: input }),
};
