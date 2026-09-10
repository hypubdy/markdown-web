/**
 * Nơi quản lý access token phía client.
 *
 * HAI CƠ CHẾ:
 * 1. Legacy (JWT nội bộ, backend AUTH_PROVIDER=local): token lấy từ localStorage
 *    qua authToken.get() — dùng cho test MSW và dev không bật Clerk.
 * 2. Clerk (SSO): token là Clerk *session token* — NGẮN HẠN, phải lấy MỚI mỗi
 *    request qua `getToken()` của Clerk. AuthProvider đăng ký provider bằng
 *    setAccessTokenProvider(); mọi api.* gọi resolveAccessToken() để nhận token.
 *
 * KHÔNG bao giờ lưu Clerk session token vào localStorage (tránh XSS đánh cắp
 * session dài hạn) — chỉ mirror JWT nội bộ (legacy) qua authToken.
 */
const TOKEN_KEY = "mdn_token";

export const authToken = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore */
    }
  },
  clear: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

/** Provider trả token BẤT ĐỒNG BỘ (Clerk getToken). null = chưa có provider. */
export type AccessTokenProvider = () => Promise<string | null>;

let tokenProvider: AccessTokenProvider | null = null;

/** Đăng ký provider token (AuthProvider gọi khi Clerk đã đăng nhập). */
export function setAccessTokenProvider(provider: AccessTokenProvider | null): void {
  tokenProvider = provider;
}

/**
 * Lấy token hiện tại để gắn vào header Authorization.
 * - Có provider (Clerk): trả token mới từ Clerk (tự refresh khi hết hạn).
 * - Không có provider: fallback legacy localStorage (test MSW / dev local).
 */
export async function resolveAccessToken(): Promise<string | null> {
  if (tokenProvider) return tokenProvider();
  return authToken.get();
}
