// BFF-based API client.
//
// الـ JWT محفوظ في Cookie من نوع HttpOnly (لا يمكن للمتصفح قراءته).
// لذلك كل الطلبات تمر عبر مسارات BFF في Next.js (تحت /api/proxy) التي
// تقرأ الـ cookie Server-side وتضيف الـ Bearer token عند التحويل إلى الـ Backend.
// العميل هنا لا يلمس الـ token إطلاقاً — فقط يرسل الـ cookie تلقائياً.

const BFF_BASE = "/api/proxy";

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const res = await fetch(`${BFF_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) ?? {}),
    },
    body: options.body != null ? JSON.stringify(options.body) : undefined,
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    const error = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(error.message ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Safe fetch variant that returns null on error instead of throwing.
 */
export async function safeApiClient<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T | null> {
  try {
    return await apiClient<T>(endpoint, options);
  } catch {
    return null;
  }
}