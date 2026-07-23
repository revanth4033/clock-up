import type { NextRequest } from "next/server";
import { updateNameSchema } from "@/features/profile/schemas";
import { updateProfileName } from "@/services/profile.service";
import { apiError, apiSuccess } from "@/lib/api/response";

/** Update the caller's editable profile fields (display name only, per ASD). */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = updateNameSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "Please check the highlighted fields.",
      "INVALID_REQUEST",
      parsed.error.flatten().fieldErrors,
    );
  }

  const result = await updateProfileName(parsed.data.fullName);
  if (!result.ok) return apiError(result.message, result.code);
  return apiSuccess(null, result.message);
}
