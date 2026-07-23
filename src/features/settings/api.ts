import { fetchJson } from "@/lib/api/fetch-json";
import type { UpdateSettingsInput } from "./schemas";

/** Client-side wrapper over PATCH /api/v1/settings. */
export const settingsApi = {
  update: (input: UpdateSettingsInput) =>
    fetchJson("/api/v1/settings", { method: "PATCH", body: input }),
};
