/**
 * Chế độ xác thực của frontend:
 *   - Có `VITE_CLERK_PUBLISHABLE_KEY` (và KHÔNG phải mode test) → Clerk (SSO OAuth)
 *     là cách đăng nhập chính.
 *   - Ngược lại → legacy: form email/mật khẩu + JWT nội bộ (backend AUTH_PROVIDER=local).
 *
 * Lưu ý: vitest (MODE="test") vẫn load `.env.local` nên phải loại trừ mode test —
 * bộ test dùng MSW mô phỏng auth legacy (login/register), không bật Clerk.
 * import.meta.env được Vite thay hằng số lúc build → điều kiện này ổn định.
 */
const rawPublishableKey: string | undefined = (
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined
)?.trim();

export const clerkPublishableKey: string | undefined =
  rawPublishableKey || undefined;

export const isClerkEnabled =
  import.meta.env.MODE !== "test" && Boolean(clerkPublishableKey);

