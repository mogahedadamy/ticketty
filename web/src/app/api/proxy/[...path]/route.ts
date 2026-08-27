import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const API_BASE = (process.env.API_BASE_URL ?? "http://127.0.0.1:3001/api").replace(
  /\/$/,
  "",
);

const SESSION_COOKIE = "ticketty_session";

/**
 * Generic authenticated proxy from the browser to the backend API.
 *
 * The browser holds the JWT in an HttpOnly cookie, so it cannot send an
 * Authorization header directly. This route handler reads the cookie
 * server-side and forwards the request to the backend with a Bearer token.
 *
 * Example: GET /api/proxy/auth/me  →  GET {API_BASE}/auth/me
 */
async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const method = request.method;
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ message: "طلب غير موثوق" }, { status: 403 });
    }
  }
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  const query = request.nextUrl.search;
  const target = `${API_BASE}/${path.join("/")}${query}`;

  const isBodyless = method === "GET" || method === "HEAD";
  const rawBody = isBodyless ? undefined : await request.text();

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (rawBody) headers["Content-Type"] = "application/json";
  const idempotencyKey = request.headers.get("idempotency-key");
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const backendRes = await fetch(target, {
    method,
    headers,
    body: rawBody,
    cache: "no-store",
  });

  const data = await backendRes.json().catch(() => null);

  return NextResponse.json(data, { status: backendRes.status });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
