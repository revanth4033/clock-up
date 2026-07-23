import { fetchJson } from "@/lib/api/fetch-json";
import type { ChangePasswordInput, UpdateNameInput } from "./schemas";

/** Client-side wrappers over the /api/v1/profile endpoints. */
export const profileApi = {
  updateName: (input: UpdateNameInput) =>
    fetchJson("/api/v1/profile", { method: "PATCH", body: input }),
  changePassword: (input: ChangePasswordInput) =>
    fetchJson("/api/v1/profile/change-password", {
      method: "POST",
      body: input,
    }),
};
