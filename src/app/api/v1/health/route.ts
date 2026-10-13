import { NextRequest } from "next/server";
import { successResponse } from "@/lib/response";
import { securityHeaders, handleOptions } from "@/lib/cors";
import { logRequest } from "@/lib/logger";

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(req: NextRequest) {
  logRequest(req, 200);
  return successResponse(
    {
      status: "healthy",
      service: "datazen-backend",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    },
    200,
    securityHeaders
  );
}
