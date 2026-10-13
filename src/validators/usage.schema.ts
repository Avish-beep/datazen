import { z } from "zod";

export const AppUsageItemSchema = z.object({
  appName: z.string().min(1, "appName is required"),
  packageName: z.string().min(1, "packageName is required"),
  usedMb: z.number().min(0, "usedMb must be non-negative"),
});

export const DailyUsageSyncItemSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format"),
  totalMb: z.number().min(0, "totalMb must be non-negative"),
  apps: z.array(AppUsageItemSchema).default([]),
});

export const UsageSyncSchema = z.object({
  deviceId: z.string().uuid("deviceId must be a valid UUID"),
  records: z.array(DailyUsageSyncItemSchema).min(1, "records must contain at least one item"),
});

export const HistoryQuerySchema = z.object({
  range: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "from must be YYYY-MM-DD").optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "to must be YYYY-MM-DD").optional(),
});

export const AppsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format"),
});

export type UsageSyncInput = z.infer<typeof UsageSyncSchema>;
export type HistoryQueryInput = z.infer<typeof HistoryQuerySchema>;
export type AppsQueryInput = z.infer<typeof AppsQuerySchema>;
