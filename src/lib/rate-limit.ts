import { createAdminClient } from "./supabase";

export interface RateLimitOptions {
  key: string;
  maxPoints?: number;
  windowSeconds?: number;
}

/**
 * Postgres-backed rate limiting using the check_rate_limit SQL function.
 * Safe for serverless environments like Vercel.
 */
export async function checkRateLimit({
  key,
  maxPoints = 60,
  windowSeconds = 60,
}: RateLimitOptions): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_key: key,
      p_max_points: maxPoints,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.error("[RateLimit] RPC Error:", error.message);
      // Fail open if database issue, or consider failing closed
      return true;
    }

    return Boolean(data);
  } catch (err) {
    console.error("[RateLimit] Exception:", err instanceof Error ? err.message : "Unknown");
    return true;
  }
}
