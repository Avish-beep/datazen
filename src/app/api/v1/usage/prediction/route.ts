import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/response";
import { securityHeaders, handleOptions } from "@/lib/cors";
import { logRequest } from "@/lib/logger";
import { UsageRepository } from "@/repositories/usage.repository";
import { QuotaRepository } from "@/repositories/quota.repository";
import { DeviceRepository } from "@/repositories/device.repository";
import { UsageService } from "@/services/usage.service";

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(req: NextRequest) {
  logRequest(req);

  const auth = await authenticateRequest(req);
  if (!auth) {
    return errorResponse("Unauthorized", 401, "UNAUTHORIZED", null, securityHeaders);
  }

  try {
    const usageRepo = new UsageRepository(auth.supabase);
    const quotaRepo = new QuotaRepository(auth.supabase);
    const deviceRepo = new DeviceRepository(auth.supabase);
    const service = new UsageService(usageRepo, quotaRepo, deviceRepo);

    const prediction = await service.getPrediction(auth.userId);

    return successResponse(prediction, 200, securityHeaders);
  } catch (err: any) {
    console.error("[Prediction Error]:", err?.message || err);
    return errorResponse(
      err?.message || "Failed to calculate prediction",
      500,
      "INTERNAL_SERVER_ERROR",
      null,
      securityHeaders
    );
  }
}
