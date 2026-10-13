import { NextResponse } from "next/server";

export interface ApiResponse<T = any> {
  data: T | null;
  error: {
    message: string;
    code?: string;
    details?: any;
  } | null;
}

export function successResponse<T>(data: T, status = 200, headers: HeadersInit = {}): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      data,
      error: null,
    },
    {
      status,
      headers,
    }
  );
}

export function errorResponse(
  message: string,
  status = 400,
  code?: string,
  details?: any,
  headers: HeadersInit = {}
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      data: null,
      error: {
        message,
        code,
        details,
      },
    },
    {
      status,
      headers,
    }
  );
}
