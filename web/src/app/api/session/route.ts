import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SESSION_COOKIE = "ticketty_session";

interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    roleKey: string;
    orgId: string | null;
    branchId: string | null;
    permissions: string[];
  };
}

function apiBaseUrl(): string {
  return (process.env.API_BASE_URL ?? "http://127.0.0.1:3001/api").replace(
    /\/$/,
    "",
  );
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const expectedOrigin = new URL(request.url).origin;
  if (origin && origin !== expectedOrigin) {
    return NextResponse.json({ message: "طلب غير موثوق" }, { status: 403 });
  }
  let credentials: unknown;
  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json(
      { message: "بيانات الطلب غير صالحة" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`${apiBaseUrl()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      cache: "no-store",
    });
    const data: unknown = await response.json();

    if (!response.ok) {
      const message =
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
          ? data.message
          : "تعذر تسجيل الدخول. تحقق من البيانات وحاول مجدداً.";
      return NextResponse.json({ message }, { status: response.status });
    }

    const login = data as LoginResponse;
    if (!login.access_token || !login.user) {
      throw new Error("Malformed authentication response");
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, login.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return NextResponse.json({ user: login.user });
  } catch {
    return NextResponse.json(
      { message: "خدمة الدخول غير متاحة حالياً. حاول مرة أخرى بعد قليل." },
      { status: 503 },
    );
  }
}

export async function DELETE(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ message: "طلب غير موثوق" }, { status: 403 });
  }
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ success: true });
}
