import { z } from "zod";

export const UpdateQuotaSchema = z.object({
  dailyLimitMb: z.number().positive("dailyLimitMb must be greater than 0"),
  monthlyLimitMb: z.number().positive("monthlyLimitMb must be greater than 0"),
  alertTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "alertTime must be HH:MM in 24h format").optional(),
});

export type UpdateQuotaInput = z.infer<typeof UpdateQuotaSchema>;
