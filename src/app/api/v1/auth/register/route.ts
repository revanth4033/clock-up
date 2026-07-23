import type { NextRequest } from "next/server";
import { registerSchema } from "@/features/auth/schemas";
import { registerUser } from "@/services/auth.service";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "Please check the highlighted fields.",
      "INVALID_REQUEST",
      parsed.error.flatten().fieldErrors,
    );
  }

  const result = await registerUser(parsed.data);
  if (!result.ok) return apiError(result.message, result.code);
  return apiSuccess(result.data, result.message, 201);
}
