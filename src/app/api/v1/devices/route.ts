import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/response";
import { securityHeaders, handleOptions } from "@/lib/cors";
import { logRequest } from "@/lib/logger";
import { CreateDeviceSchema, DeleteDeviceSchema } from "@/validators/device.schema";
import { DeviceRepository } from "@/repositories/device.repository";

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
    const deviceRepo = new DeviceRepository(auth.supabase);
    const devices = await deviceRepo.listDevices(auth.userId);

    return successResponse(devices, 200, securityHeaders);
  } catch (err: any) {
    console.error("[List Devices Error]:", err?.message || err);
    return errorResponse(
      err?.message || "Failed to list devices",
      500,
      "INTERNAL_SERVER_ERROR",
      null,
      securityHeaders
    );
  }
}

export async function POST(req: NextRequest) {
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

  const parsed = CreateDeviceSchema.safeParse(body);
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
    const deviceRepo = new DeviceRepository(auth.supabase);
    const device = await deviceRepo.createDevice(
      auth.userId,
      parsed.data.deviceName,
      parsed.data.platform
    );

    return successResponse(device, 201, securityHeaders);
  } catch (err: any) {
    console.error("[Create Device Error]:", err?.message || err);
    return errorResponse(
      err?.message || "Failed to create device",
      500,
      "INTERNAL_SERVER_ERROR",
      null,
      securityHeaders
    );
  }
}

export async function DELETE(req: NextRequest) {
  logRequest(req);

  const auth = await authenticateRequest(req);
  if (!auth) {
    return errorResponse("Unauthorized", 401, "UNAUTHORIZED", null, securityHeaders);
  }

  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");

  const parsed = DeleteDeviceSchema.safeParse({ id });
  if (!parsed.success) {
    return errorResponse(
      "Valid device id UUID query parameter is required",
      400,
      "VALIDATION_ERROR",
      parsed.error.errors,
      securityHeaders
    );
  }

  try {
    const deviceRepo = new DeviceRepository(auth.supabase);
    await deviceRepo.deleteDevice(parsed.data.id, auth.userId);

    return successResponse({ message: "Device deleted successfully" }, 200, securityHeaders);
  } catch (err: any) {
    console.error("[Delete Device Error]:", err?.message || err);
    return errorResponse(
      err?.message || "Failed to delete device",
      500,
      "INTERNAL_SERVER_ERROR",
      null,
      securityHeaders
    );
  }
}
