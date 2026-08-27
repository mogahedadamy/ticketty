import { NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.API_BASE_URL ?? "http://127.0.0.1:3001/api"
).replace(/\/$/, "");

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/health/readiness`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2_000),
    });

    if (!response.ok) {
      throw new Error('Backend is not ready');
    }

    return NextResponse.json({ status: "ready", backend: "up" });
  } catch {
    return NextResponse.json(
      { status: "not_ready", backend: "down" },
      { status: 503 },
    );
  }
}
