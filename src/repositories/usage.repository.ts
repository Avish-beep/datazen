import { createUserClient } from "@/lib/supabase";

export interface UpsertDailyUsagePayload {
  user_id: string;
  device_id: string;
  date: string;
  total_mb: number;
}

export interface UpsertAppUsagePayload {
  user_id: string;
  device_id: string;
  date: string;
  app_name: string;
  package_name: string;
  used_mb: number;
}

export class UsageRepository {
  constructor(private supabase: ReturnType<typeof createUserClient>) {}

  async syncBatch(
    userId: string,
    deviceId: string,
    dailyRecords: Array<{
      date: string;
      totalMb: number;
      apps: Array<{
        appName: string;
        packageName: string;
        usedMb: number;
      }>;
    }>
  ) {
    const dailyPayloads: UpsertDailyUsagePayload[] = [];
    const appPayloads: UpsertAppUsagePayload[] = [];

    for (const record of dailyRecords) {
      dailyPayloads.push({
        user_id: userId,
        device_id: deviceId,
        date: record.date,
        total_mb: record.totalMb,
      });

      for (const app of record.apps) {
        appPayloads.push({
          user_id: userId,
          device_id: deviceId,
          date: record.date,
          app_name: app.appName,
          package_name: app.packageName,
          used_mb: app.usedMb,
        });
      }
    }

    // 1. Upsert daily_usage idempotently
    if (dailyPayloads.length > 0) {
      const { error: dailyErr } = await this.supabase
        .from("daily_usage")
        .upsert(dailyPayloads, {
          onConflict: "device_id,date",
        });
      if (dailyErr) throw dailyErr;
    }

    // 2. Upsert app_usage idempotently
    if (appPayloads.length > 0) {
      const { error: appErr } = await this.supabase
        .from("app_usage")
        .upsert(appPayloads, {
          onConflict: "device_id,date,package_name",
        });
      if (appErr) throw appErr;
    }

    return {
      dailyRecordsCount: dailyPayloads.length,
      appRecordsCount: appPayloads.length,
    };
  }

  async getDailyUsageInRange(userId: string, fromDate: string, toDate: string) {
    const { data, error } = await this.supabase
      .from("daily_usage")
      .select("date, total_mb, device_id")
      .eq("user_id", userId)
      .gte("date", fromDate)
      .lte("date", toDate)
      .order("date", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getAppUsageForDate(userId: string, date: string) {
    const { data, error } = await this.supabase
      .from("app_usage")
      .select("app_name, package_name, used_mb, device_id")
      .eq("user_id", userId)
      .eq("date", date)
      .order("used_mb", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getRecentUsage(userId: string, limitDays = 14) {
    const { data, error } = await this.supabase
      .from("daily_usage")
      .select("date, total_mb")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(limitDays);

    if (error) throw error;
    return (data || []).reverse();
  }

  async getMonthlyUsageSum(userId: string, yearMonthStart: string, yearMonthEnd: string) {
    const { data, error } = await this.supabase
      .from("daily_usage")
      .select("total_mb")
      .eq("user_id", userId)
      .gte("date", yearMonthStart)
      .lte("date", yearMonthEnd);

    if (error) throw error;
    const sum = (data || []).reduce((acc: number, row: any) => acc + Number(row.total_mb || 0), 0);
    return Math.round(sum * 100) / 100;
  }
}
