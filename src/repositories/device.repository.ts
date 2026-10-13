import { createUserClient } from "@/lib/supabase";

export class DeviceRepository {
  constructor(private supabase: ReturnType<typeof createUserClient>) {}

  async listDevices(userId: string) {
    const { data, error } = await this.supabase
      .from("devices")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }

  async getDeviceById(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from("devices")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  }

  async createDevice(userId: string, deviceName: string, platform: string) {
    const { data, error } = await this.supabase
      .from("devices")
      .insert({
        user_id: userId,
        device_name: deviceName,
        platform,
        last_seen_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateLastSeen(deviceId: string, userId: string) {
    const { error } = await this.supabase
      .from("devices")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", deviceId)
      .eq("user_id", userId);

    if (error) throw error;
  }

  async deleteDevice(id: string, userId: string) {
    const { error } = await this.supabase
      .from("devices")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
  }
}
