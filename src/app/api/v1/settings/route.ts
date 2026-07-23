import type { NextRequest } from "next/server";
import { updateSettingsSchema } from "@/features/settings/schemas";
import { getSettings, updateSettings } from "@/services/settings.service";
import { apiError, apiSuccess } from "@/lib/api/response";

/** ASD Module 7 — Get Settings. Returns the caller's persisted preferences. */
export async function GET() {
  const settings = await getSettings();
  if (!settings) {
    return apiError("Please sign in again.", "AUTH_REQUIRED");
  }
  return apiSuccess(
    { theme: settings.theme, notifications: settings.notificationsEnabled },
    "Settings loaded.",
  );
}

/** ASD Module 7 — Update Settings. Body: { theme?, notifications? }. */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = updateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "Please check the highlighted fields.",
      "INVALID_REQUEST",
      parsed.error.flatten().fieldErrors,
    );
  }

  const result = await updateSettings({
    theme: parsed.data.theme,
    notificationsEnabled: parsed.data.notifications,
  });
  if (!result.ok) return apiError(result.message, result.code);
  return apiSuccess(null, result.message);
}
