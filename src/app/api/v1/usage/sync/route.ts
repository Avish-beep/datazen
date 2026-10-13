import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/response";
import { securityHeaders, handleOptions } from "@/lib/cors";
import { logRequest } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { UsageSyncSchema } from "@/validators/usage.schema";
import { UsageRepository } from "@/repositories/usage.repository";
import { QuotaRepository } from "@/repositories/quota.repository";
import { DeviceRepository } from "@/repositories/device.repository";
import { UsageService } from "@/services/usage.service";

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(req: NextRequest) {
  logRequest(req);

  const auth = await authenticateRequest(req);
  if (!auth) {
    return errorResponse("Unauthorized", 401, "UNAUTHORIZED", null, securityHeaders);
  }

  // Rate Limiting (60 sync requests per minute per user)
  const isAllowed = await checkRateLimit({
    key: `sync:${auth.userId}`,
    maxPoints: 60,
    windowSeconds: 60,
  });

  if (!isAllowed) {
    return errorResponse(
      "Too many sync requests. Please retry in a few moments.",
      429,
      "RATE_LIMIT_EXCEEDED",
      null,
      securityHeaders
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON payload", 400, "BAD_REQUEST", null, securityHeaders);
  }

  const parsed = UsageSyncSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "Validation failed",
      400,
      "VALIDATION_ERROR",
      parsed.error.errors,
      securityHeaders
    );
  }

  try {
    const usageRepo = new UsageRepository(auth.supabase);
    const quotaRepo = new QuotaRepository(auth.supabase);
    const deviceRepo = new DeviceRepository(auth.supabase);
    const service = new UsageService(usageRepo, quotaRepo, deviceRepo);

    const result = await service.syncUsage(auth.userId, parsed.data.deviceId, parsed.data.records);

    return successResponse(
      {
        message: "Usage data synced successfully",
        ...result,
      },
      200,
      securityHeaders
    );
  } catch (err: any) {
    console.error("[Sync Error]:", err?.message || err);
    return errorResponse(
      err?.message || "Failed to sync usage",
      500,
      "INTERNAL_SERVER_ERROR",
      null,
      securityHeaders
    );
  }
}
