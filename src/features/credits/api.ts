import { fetchJson } from "@/lib/api/fetch-json";

/** Client-side wrappers over the /api/v1/redemption write endpoints. */
export const redemptionApi = {
  redeem: (requestedCredits: number) =>
    fetchJson<{
      redemptionId: string;
      requestedCredits: number;
      availableBalance: number;
    }>("/api/v1/redemption", { body: { requestedCredits } }),
  cancel: () =>
    fetchJson<{ availableBalance: number }>("/api/v1/redemption/cancel"),
};
