import { describe, it, expect } from "vitest";
import {
  calculateWastedData,
  predictExhaustion,
  DailyUsageRecord,
} from "../../src/services/usage-calculator";

describe("calculateWastedData", () => {
  const dailyLimitMb = 1500;
  const todayStr = "2026-10-13";

  it("calculates waste when usage is below daily limit on past days", () => {
    const records: DailyUsageRecord[] = [
      { date: "2026-10-11", totalMb: 1000 }, // wasted 500
      { date: "2026-10-12", totalMb: 1200 }, // wasted 300
    ];

    const result = calculateWastedData(records, dailyLimitMb, todayStr);
    expect(result.wastedMb).toBe(800);
    expect(result.consumedMb).toBe(2200);
    expect(result.daysEvaluated).toBe(2);
  });

  it("returns zero waste when user hits or exceeds daily limit", () => {
    const records: DailyUsageRecord[] = [
      { date: "2026-10-11", totalMb: 1500 }, // 0 wasted
      { date: "2026-10-12", totalMb: 1800 }, // 0 wasted
    ];

    const result = calculateWastedData(records, dailyLimitMb, todayStr);
    expect(result.wastedMb).toBe(0);
    expect(result.consumedMb).toBe(3300);
  });

  it("ignores today because the current day's quota has not expired yet", () => {
    const records: DailyUsageRecord[] = [
      { date: "2026-10-12", totalMb: 500 }, // wasted 1000
      { date: "2026-10-13", totalMb: 200 }, // today -> ignored
    ];

    const result = calculateWastedData(records, dailyLimitMb, todayStr);
    expect(result.wastedMb).toBe(1000);
    expect(result.daysEvaluated).toBe(1);
  });

  it("handles zero usage on past days as full waste", () => {
    const records: DailyUsageRecord[] = [
      { date: "2026-10-10", totalMb: 0 }, // wasted 1500
    ];

    const result = calculateWastedData(records, dailyLimitMb, todayStr);
    expect(result.wastedMb).toBe(1500);
  });
});

describe("predictExhaustion", () => {
  const monthlyLimitMb = 30000;
  const fixedDate = new Date("2026-10-10T00:00:00.000Z");

  it("calculates remaining days and projected date correctly with steady daily burn", () => {
    // Current usage: 10000 MB, Remaining: 20000 MB
    // Recent 5 days average: 2000 MB/day
    // Remaining days = 20000 / 2000 = 10 days
    // 2026-10-10 + 10 days = 2026-10-20
    const recentRecords: DailyUsageRecord[] = [
      { date: "2026-10-05", totalMb: 2000 },
      { date: "2026-10-06", totalMb: 2000 },
      { date: "2026-10-07", totalMb: 2000 },
      { date: "2026-10-08", totalMb: 2000 },
      { date: "2026-10-09", totalMb: 2000 },
    ];

    const result = predictExhaustion(recentRecords, monthlyLimitMb, 10000, fixedDate);
    expect(result.status).toBe("predictable");
    expect(result.remainingMb).toBe(20000);
    expect(result.averageDailyMb).toBe(2000);
    expect(result.daysRemaining).toBe(10);
    expect(result.projectedExhaustionDate).toBe("2026-10-20");
  });

  it("returns status 'exhausted' if monthly limit has already been met or exceeded", () => {
    const recentRecords: DailyUsageRecord[] = [{ date: "2026-10-09", totalMb: 1500 }];

    const result = predictExhaustion(recentRecords, monthlyLimitMb, 30500, fixedDate);
    expect(result.status).toBe("exhausted");
    expect(result.remainingMb).toBe(0);
    expect(result.daysRemaining).toBe(0);
    expect(result.projectedExhaustionDate).toBe("2026-10-10");
  });

  it("handles zero recent usage gracefully", () => {
    const recentRecords: DailyUsageRecord[] = [
      { date: "2026-10-08", totalMb: 0 },
      { date: "2026-10-09", totalMb: 0 },
    ];

    const result = predictExhaustion(recentRecords, monthlyLimitMb, 5000, fixedDate);
    expect(result.status).toBe("no_depletion_expected");
    expect(result.daysRemaining).toBeNull();
    expect(result.projectedExhaustionDate).toBeNull();
  });

  it("handles empty history without crashing", () => {
    const result = predictExhaustion([], monthlyLimitMb, 5000, fixedDate);
    expect(result.status).toBe("no_recent_usage");
    expect(result.daysRemaining).toBeNull();
  });
});
