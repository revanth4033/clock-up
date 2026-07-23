import type { NextRequest } from "next/server";
import { loginSchema } from "@/features/auth/schemas";
import { loginUser } from "@/services/auth.service";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "Please check the highlighted fields.",
      "INVALID_REQUEST",
      parsed.error.flatten().fieldErrors,
    );
  }

  const result = await loginUser(parsed.data);
  if (!result.ok) return apiError(result.message, result.code);
  return apiSuccess(null, result.message);
}
