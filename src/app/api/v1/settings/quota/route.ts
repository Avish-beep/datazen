import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/response";
import { securityHeaders, handleOptions } from "@/lib/cors";
import { logRequest } from "@/lib/logger";
import { UpdateQuotaSchema } from "@/validators/quota.schema";
import { QuotaRepository } from "@/repositories/quota.repository";

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
    const quotaRepo = new QuotaRepository(auth.supabase);
    const quota = await quotaRepo.getQuota(auth.userId);

    return successResponse(quota, 200, securityHeaders);
  } catch (err: any) {
    console.error("[Get Quota Error]:", err?.message || err);
    return errorResponse(
      err?.message || "Failed to retrieve quota settings",
      500,
      "INTERNAL_SERVER_ERROR",
      null,
      securityHeaders
    );
  }
}

export async function PUT(req: NextRequest) {
  logRequest(req);

  const auth = await authenticateRequest(req);
  if (!auth) {
    return errorResponse("Unauthorized", 401, "UNAUTHORIZED", null, securityHeaders);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON payload", 400, "BAD_REQUEST", null, securityHeaders);
  }

  const parsed = UpdateQuotaSchema.safeParse(body);
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
    const quotaRepo = new QuotaRepository(auth.supabase);
    const updated = await quotaRepo.updateQuota(auth.userId, {
      daily_limit_mb: parsed.data.dailyLimitMb,
      monthly_limit_mb: parsed.data.monthlyLimitMb,
      alert_time: parsed.data.alertTime,
    });

    return successResponse(updated, 200, securityHeaders);
  } catch (err: any) {
    console.error("[Update Quota Error]:", err?.message || err);
    return errorResponse(
      err?.message || "Failed to update quota settings",
      500,
      "INTERNAL_SERVER_ERROR",
      null,
      securityHeaders
    );
  }
}
