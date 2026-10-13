import { createUserClient } from "@/lib/supabase";

export interface QuotaSettings {
  user_id: string;
  daily_limit_mb: number;
  monthly_limit_mb: number;
  alert_time: string;
  updated_at: string;
}

export class QuotaRepository {
  constructor(private supabase: ReturnType<typeof createUserClient>) {}

  async getQuota(userId: string): Promise<QuotaSettings> {
    const { data, error } = await this.supabase
      .from("quota_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    if (!data) {
      // Fallback/auto-create default
      const defaultSettings = {
        user_id: userId,
        daily_limit_mb: 1500,
        monthly_limit_mb: 45000,
        alert_time: "20:00",
        updated_at: new Date().toISOString(),
      };
      const { data: inserted, error: insertErr } = await this.supabase
        .from("quota_settings")
        .upsert(defaultSettings)
        .select()
        .single();

      if (insertErr) throw insertErr;
      return inserted;
    }

    return data;
  }

  async updateQuota(
    userId: string,
    updates: {
      daily_limit_mb: number;
      monthly_limit_mb: number;
      alert_time?: string;
    }
  ): Promise<QuotaSettings> {
    const payload: any = {
      user_id: userId,
      daily_limit_mb: updates.daily_limit_mb,
      monthly_limit_mb: updates.monthly_limit_mb,
      updated_at: new Date().toISOString(),
    };
    if (updates.alert_time) {
      payload.alert_time = updates.alert_time;
    }

    const { data, error } = await this.supabase
      .from("quota_settings")
      .upsert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
