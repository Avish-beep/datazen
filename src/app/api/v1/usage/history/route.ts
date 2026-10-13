import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/response";
import { securityHeaders, handleOptions } from "@/lib/cors";
import { logRequest } from "@/lib/logger";
import { HistoryQuerySchema } from "@/validators/usage.schema";
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

  const { searchParams } = req.nextUrl;
  const rawParams = {
    range: searchParams.get("range") || "daily",
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
  };

  const parsed = HistoryQuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return errorResponse(
      "Invalid query parameters",
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

    const history = await service.getHistory(
      auth.userId,
      parsed.data.range,
      parsed.data.from,
      parsed.data.to
    );

    return successResponse(history, 200, securityHeaders);
  } catch (err: any) {
    console.error("[History Error]:", err?.message || err);
    return errorResponse(
      err?.message || "Failed to retrieve history",
      500,
      "INTERNAL_SERVER_ERROR",
      null,
      securityHeaders
    );
  }
}
