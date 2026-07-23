import { z } from "zod";

/** Theme values — matches the DB `theme` enum and next-themes. */
export const themeSchema = z.enum(["light", "dark", "system"]);

/**
 * Update Settings request body (ASD Module 7). The wire format uses
 * `notifications`; the service maps it to `notifications_enabled`. At least one
 * field must be present.
 */
export const updateSettingsSchema = z
  .object({
    theme: themeSchema.optional(),
    notifications: z.boolean().optional(),
  })
  .refine((v) => v.theme !== undefined || v.notifications !== undefined, {
    message: "Provide at least one setting to update.",
  });

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
