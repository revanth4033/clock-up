import type { NextRequest } from "next/server";
import { redeemSchema } from "@/features/credits/schemas";
import { createOrUpdateRedemption } from "@/services/redemption.service";
import { apiError, apiSuccess } from "@/lib/api/response";

/**
 * Create or adjust today's redemption hold. Pure transport: validate the
 * request shape, then hand off to the existing redemption service (which owns
 * all business rules via the RPC). No settlement, points, or credit logic here.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = redeemSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "Enter a valid credit amount.",
      "INVALID_REQUEST",
      parsed.error.flatten().fieldErrors,
    );
  }

  const result = await createOrUpdateRedemption(parsed.data.requestedCredits);
  if (!result.ok) return apiError(result.message, result.code);
  return apiSuccess(result.data, result.message);
}
