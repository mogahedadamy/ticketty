import { cookies } from "next/headers";
import type { SessionUser } from "@/types";
import { getServerEnvironment } from "@/lib/server/env";

const SESSION_COOKIE = "ticketty_session";

/**
 * Server-side session lookup — reads the HttpOnly cookie and verifies the
 * token against the backend. Returns null if unauthenticated.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { apiBaseUrl } = getServerEnvironment();
    const response = await fetch(`${apiBaseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { user: SessionUser };
    return data.user;
  } catch {
    return null;
  }
}
