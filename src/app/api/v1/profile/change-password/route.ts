import type { NextRequest } from "next/server";
import { changePasswordSchema } from "@/features/profile/schemas";
import { changePassword } from "@/services/profile.service";
import { apiError, apiSuccess } from "@/lib/api/response";

/** Change the signed-in user's password (re-verifies the current one first). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "Please check the highlighted fields.",
      "INVALID_REQUEST",
      parsed.error.flatten().fieldErrors,
    );
  }

  const result = await changePassword(
    parsed.data.currentPassword,
    parsed.data.newPassword,
  );
  if (!result.ok) return apiError(result.message, result.code);
  return apiSuccess(null, result.message);
}
