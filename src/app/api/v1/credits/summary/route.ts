import { getCreditSummary } from "@/services/presentation.service";
import { apiError, apiSuccess } from "@/lib/api/response";

/** Read model: credit totals (earned / used / balance / reserved / available)
 * plus today's redemption status. Read-only. */
export async function GET() {
  const summary = await getCreditSummary();
  if (!summary) return apiError("Please sign in again.", "AUTH_REQUIRED");
  return apiSuccess(summary, "Credit summary.");
}
