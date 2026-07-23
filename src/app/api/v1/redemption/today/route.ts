import { getTodayRedemption } from "@/services/presentation.service";
import { apiError, apiSuccess } from "@/lib/api/response";

/** Read model: today's redemption (requested / applied / status / shortfall /
 * recommended). Read-only — creating a hold stays on the write path. */
export async function GET() {
  const redemption = await getTodayRedemption();
  if (!redemption) return apiError("Please sign in again.", "AUTH_REQUIRED");
  return apiSuccess(redemption, "Today's redemption.");
}
