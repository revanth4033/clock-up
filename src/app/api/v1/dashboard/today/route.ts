import { getTodaySummary } from "@/services/presentation.service";
import { apiError, apiSuccess } from "@/lib/api/response";

/** Read model: today's dashboard summary (worked / redeemed / counted / points
 * / earned / status / goal progress). Read-only. */
export async function GET() {
  const summary = await getTodaySummary();
  if (!summary) return apiError("Please sign in again.", "AUTH_REQUIRED");
  return apiSuccess(summary, "Today's summary.");
}
