import { z } from "zod";

/** GPS payload for clock in / clock out. */
export const clockCoordsSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative(),
});

export const recoverSchema = z.object({
  attendanceId: z.string().uuid(),
  clockOut: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date/time"),
});

export type ClockCoordsInput = z.infer<typeof clockCoordsSchema>;
export type RecoverInput = z.infer<typeof recoverSchema>;
