import { NextRequest } from "next/server";

export function logRequest(req: NextRequest, status?: number) {
  const method = req.method;
  const path = req.nextUrl.pathname;
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  // Sanitize path/search params to never log tokens or passwords
  const sanitizedUrl = `${method} ${path}`;

  if (status !== undefined) {
    console.log(`[REQ] ${sanitizedUrl} | Status: ${status} | IP: ${ip}`);
  } else {
    console.log(`[REQ] ${sanitizedUrl} | UA: ${userAgent} | IP: ${ip}`);
  }
}
