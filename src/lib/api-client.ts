import type { ApiEnvelope, ApiErrorDetail } from "@/types";

/**
 * Base URL: trong dev dùng proxy vite (/api → backend). Vite proxy mặc định chuyển
 * mọi `/api/v1/*` sang backend. Khi build thật có thể đổi bằng env VITE_API_BASE.
 */
export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

/** Lỗi HTTP chuẩn hoá — mang message + chi tiết validate + status */
export class ApiError extends Error {
  readonly status: number;
  readonly details?: ApiErrorDetail[];
  constructor(status: number, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** Query string (không cần dấu "?") */
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  token?: string | null;
  /** Không gắn header Content-Type (vd GET /raw trả text/markdown) */
  raw?: boolean;
  signal?: AbortSignal;
}

/** Dựng URL + query */
function buildPath(path: string, query?: ApiRequestOptions["query"]): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/**
 * Client fetch nhẹ, bọc envelope chuẩn backend `{ success, data, message, details }`.
 * - 2xx: trả `data` (đã unwrap).
 * - Không 2xx: ném ApiError(message, status, details).
 * - Nếu muốn dữ liệu thô (text/markdown), truyền { raw: true } → trả text.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = "GET", query, body, token, raw = false, signal } = options;
  const url = `${API_BASE}${buildPath(path, query)}`;

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!raw && body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  // 204 No Content (xoá/soft-delete/…) → không có body, coi như thành công, trả undefined
  if (res.status === 204) {
    return undefined as T;
  }

  // text/markdown (vd GET /notes/:id/raw)
  if (raw) {
    if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
    return (await res.text()) as T;
  }

  let envelope: ApiEnvelope<T> | null = null;
  try {
    envelope = (await res.json()) as ApiEnvelope<T>;
  } catch {
    // response không phải JSON chuẩn
  }

  if (!res.ok || !envelope || envelope.success === false) {
    throw new ApiError(
      res.status,
      envelope?.message ?? `HTTP ${res.status}`,
      envelope?.details,
    );
  }

  return (envelope.data ?? (undefined as T));
}
