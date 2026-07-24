import { z } from "zod";

/**
 * Request-shape validation only. All redemption business rules (minimum work,
 * shortfall, available balance, day-open) live in the RPC and are enforced
 * server-side — this schema just guards that the body is a positive whole
 * number of credits before the request reaches the service.
 */
export const redeemSchema = z.object({
  requestedCredits: z
    .number({ error: "Enter a whole number of credits." })
    .int("Enter a whole number of credits.")
    .positive("Enter a positive amount."),
});

export type RedeemInput = z.infer<typeof redeemSchema>;
