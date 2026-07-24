import { cancelRedemption } from "@/services/redemption.service";
import { apiError, apiSuccess } from "@/lib/api/response";

/**
 * Cancel today's pending redemption hold. Pure transport — the service and RPC
 * own the "is there an active hold?" rule and the credit release.
 */
export async function POST() {
  const result = await cancelRedemption();
  if (!result.ok) return apiError(result.message, result.code);
  return apiSuccess(result.data, result.message);
}
