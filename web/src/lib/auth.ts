import { cookies } from "next/headers";
import type { SessionUser } from "@/types";

const SESSION_COOKIE = "ticketty_session";
const API_BASE = (process.env.API_BASE_URL ?? "http://127.0.0.1:3001/api").replace(
  /\/$/,
  "",
);

/**
 * Server-side session lookup — reads the HttpOnly cookie and verifies the
 * token against the backend. Returns null if unauthenticated.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
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
