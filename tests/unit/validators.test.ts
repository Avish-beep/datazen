import { describe, it, expect } from "vitest";
import { UsageSyncSchema, HistoryQuerySchema } from "../../src/validators/usage.schema";
import { CreateDeviceSchema } from "../../src/validators/device.schema";
import { UpdateQuotaSchema } from "../../src/validators/quota.schema";

describe("Validation Schemas", () => {
  it("validates UsageSyncSchema with valid data", () => {
    const validData = {
      deviceId: "123e4567-e89b-12d3-a456-426614174000",
      records: [
        {
          date: "2026-10-13",
          totalMb: 500,
          apps: [
            {
              appName: "YouTube",
              packageName: "com.google.android.youtube",
              usedMb: 250,
            },
          ],
        },
      ],
    };

    const parsed = UsageSyncSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it("fails UsageSyncSchema with invalid deviceId or negative usage", () => {
    const invalidData = {
      deviceId: "not-a-uuid",
      records: [
        {
          date: "2026-10-13",
          totalMb: -50,
          apps: [],
        },
      ],
    };

    const parsed = UsageSyncSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it("validates HistoryQuerySchema ranges", () => {
    expect(HistoryQuerySchema.safeParse({ range: "daily" }).success).toBe(true);
    expect(HistoryQuerySchema.safeParse({ range: "weekly" }).success).toBe(true);
    expect(HistoryQuerySchema.safeParse({ range: "yearly" }).success).toBe(false);
  });

  it("validates CreateDeviceSchema", () => {
    expect(CreateDeviceSchema.safeParse({ deviceName: "Pixel 8", platform: "android" }).success).toBe(true);
    expect(CreateDeviceSchema.safeParse({ deviceName: "" }).success).toBe(false);
  });

  it("validates UpdateQuotaSchema", () => {
    expect(
      UpdateQuotaSchema.safeParse({ dailyLimitMb: 2000, monthlyLimitMb: 60000, alertTime: "21:30" }).success
    ).toBe(true);
    expect(UpdateQuotaSchema.safeParse({ dailyLimitMb: -100, monthlyLimitMb: 500 }).success).toBe(false);
  });
});
