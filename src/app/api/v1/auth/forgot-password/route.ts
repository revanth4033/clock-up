import type { NextRequest } from "next/server";
import { forgotPasswordSchema } from "@/features/auth/schemas";
import { requestPasswordReset } from "@/services/auth.service";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "Please enter a valid email address.",
      "INVALID_REQUEST",
      parsed.error.flatten().fieldErrors,
    );
  }

  const origin = new URL(req.url).origin;
  const redirectTo = `${origin}/auth/callback?next=/reset-password`;
  const result = await requestPasswordReset(
    parsed.data.officeEmail,
    redirectTo,
  );
  return apiSuccess(null, result.message);
}
