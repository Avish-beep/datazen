import { NextRequest } from "next/server";
import { createUserClient } from "./supabase";

export interface AuthContext {
  userId: string;
  jwt: string;
  supabase: ReturnType<typeof createUserClient>;
}

/**
 * Extracts and verifies the Supabase Auth JWT from the Authorization header.
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthContext | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const jwt = authHeader.substring(7).trim();
  if (!jwt) {
    return null;
  }

  const supabase = createUserClient(jwt);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    userId: user.id,
    jwt,
    supabase,
  };
}
