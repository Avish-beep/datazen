import { UsageRepository } from "@/repositories/usage.repository";
import { QuotaRepository } from "@/repositories/quota.repository";
import { DeviceRepository } from "@/repositories/device.repository";
import { calculateWastedData, predictExhaustion } from "./usage-calculator";

export class UsageService {
  constructor(
    private usageRepo: UsageRepository,
    private quotaRepo: QuotaRepository,
    private deviceRepo: DeviceRepository
  ) {}

  async syncUsage(
    userId: string,
    deviceId: string,
    records: Array<{
      date: string;
      totalMb: number;
      apps: Array<{
        appName: string;
        packageName: string;
        usedMb: number;
      }>;
    }>
  ) {
    // 1. Verify device belongs to user, update last_seen_at
    const device = await this.deviceRepo.getDeviceById(deviceId, userId);
    if (!device) {
      throw new Error("Device not found or does not belong to the user");
    }

    await this.deviceRepo.updateLastSeen(deviceId, userId);

    // 2. Perform idempotent upsert
    return await this.usageRepo.syncBatch(userId, deviceId, records);
  }

  async getSummary(userId: string) {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Calculate start of week (Monday)
    const dayOfWeek = today.getDay(); // 0 is Sunday
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - distanceToMonday);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    // Calculate start of month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStartStr = monthStart.toISOString().split("T")[0];

    // Fetch quota settings
    const quota = await this.quotaRepo.getQuota(userId);

    // Fetch month records for calculating summary & waste
    const monthRecords = await this.usageRepo.getDailyUsageInRange(userId, monthStartStr, todayStr);

    let todayTotalMb = 0;
    let weekTotalMb = 0;
    let monthTotalMb = 0;

    const dailyUsageMap = new Map<string, number>();

    for (const record of monthRecords) {
      const mb = Number(record.total_mb || 0);
      monthTotalMb += mb;

      if (record.date >= weekStartStr) {
        weekTotalMb += mb;
      }
      if (record.date === todayStr) {
        todayTotalMb += mb;
      }

      dailyUsageMap.set(record.date, (dailyUsageMap.get(record.date) || 0) + mb);
    }

    const aggregatedRecords = Array.from(dailyUsageMap.entries()).map(([date, totalMb]) => ({
      date,
      totalMb,
    }));

    const wasteResult = calculateWastedData(
      aggregatedRecords,
      quota.daily_limit_mb,
      todayStr
    );

    const remainingDailyMb = Math.max(0, quota.daily_limit_mb - todayTotalMb);
    const remainingMonthlyMb = Math.max(0, quota.monthly_limit_mb - monthTotalMb);

    return {
      today: {
        usedMb: Math.round(todayTotalMb * 100) / 100,
        limitMb: quota.daily_limit_mb,
        remainingMb: Math.round(remainingDailyMb * 100) / 100,
      },
      thisWeek: {
        usedMb: Math.round(weekTotalMb * 100) / 100,
      },
      thisMonth: {
        usedMb: Math.round(monthTotalMb * 100) / 100,
        limitMb: quota.monthly_limit_mb,
        remainingMb: Math.round(remainingMonthlyMb * 100) / 100,
      },
      wastedData: {
        totalWastedMb: wasteResult.wastedMb,
        daysEvaluated: wasteResult.daysEvaluated,
      },
      quotaSettings: {
        dailyLimitMb: quota.daily_limit_mb,
        monthlyLimitMb: quota.monthly_limit_mb,
        alertTime: quota.alert_time,
      },
    };
  }

  async getHistory(userId: string, range: "daily" | "weekly" | "monthly", from?: string, to?: string) {
    const today = new Date();
    const defaultTo = today.toISOString().split("T")[0];
    const defaultFromDate = new Date(today);
    defaultFromDate.setDate(today.getDate() - 30);
    const defaultFrom = defaultFromDate.toISOString().split("T")[0];

    const fromDate = from || defaultFrom;
    const toDate = to || defaultTo;

    const rawRecords = await this.usageRepo.getDailyUsageInRange(userId, fromDate, toDate);

    // Group by date across devices
    const dailyMap = new Map<string, number>();
    for (const r of rawRecords) {
      dailyMap.set(r.date, (dailyMap.get(r.date) || 0) + Number(r.total_mb || 0));
    }

    const dailyList = Array.from(dailyMap.entries())
      .map(([date, totalMb]) => ({ date, totalMb: Math.round(totalMb * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (range === "daily") {
      return {
        range,
        from: fromDate,
        to: toDate,
        records: dailyList,
      };
    }

    if (range === "weekly") {
      // Group by ISO week
      const weeklyMap = new Map<string, number>();
      for (const item of dailyList) {
        const d = new Date(item.date);
        const day = d.getDay();
        const diff = (day + 6) % 7;
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - diff);
        const weekKey = weekStart.toISOString().split("T")[0];
        weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + item.totalMb);
      }

      return {
        range,
        from: fromDate,
        to: toDate,
        records: Array.from(weeklyMap.entries()).map(([weekStarting, totalMb]) => ({
          weekStarting,
          totalMb: Math.round(totalMb * 100) / 100,
        })),
      };
    }

    // Monthly
    const monthlyMap = new Map<string, number>();
    for (const item of dailyList) {
      const monthKey = item.date.substring(0, 7); // YYYY-MM
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + item.totalMb);
    }

    return {
      range,
      from: fromDate,
      to: toDate,
      records: Array.from(monthlyMap.entries()).map(([month, totalMb]) => ({
        month,
        totalMb: Math.round(totalMb * 100) / 100,
      })),
    };
  }

  async getApps(userId: string, date: string) {
    const rawApps = await this.usageRepo.getAppUsageForDate(userId, date);

    // Aggregate by package_name across devices
    const appMap = new Map<string, { appName: string; usedMb: number }>();
    for (const r of rawApps) {
      const existing = appMap.get(r.package_name);
      const used = Number(r.used_mb || 0);
      if (existing) {
        existing.usedMb += used;
      } else {
        appMap.set(r.package_name, {
          appName: r.app_name,
          usedMb: used,
        });
      }
    }

    const result = Array.from(appMap.entries())
      .map(([packageName, details]) => ({
        packageName,
        appName: details.appName,
        usedMb: Math.round(details.usedMb * 100) / 100,
      }))
      .sort((a, b) => b.usedMb - a.usedMb);

    return {
      date,
      totalApps: result.length,
      apps: result,
    };
  }

  async getPrediction(userId: string) {
    const quota = await this.quotaRepo.getQuota(userId);
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
    const todayStr = today.toISOString().split("T")[0];

    const currentMonthUsage = await this.usageRepo.getMonthlyUsageSum(userId, monthStart, todayStr);
    const recentRecords = await this.usageRepo.getRecentUsage(userId, 14);

    const mappedRecent = recentRecords.map((r: any) => ({
      date: r.date,
      totalMb: Number(r.total_mb || 0),
    }));

    return predictExhaustion(mappedRecent, quota.monthly_limit_mb, currentMonthUsage, today);
  }
}
