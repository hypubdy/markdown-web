import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/features/auth/auth-context";
import { authToken } from "@/lib/auth-token";
import type { ReactElement } from "react";

/**
 * HELPER DÙNG CHUNG CHO CÁC FILE TEST UI (không phải file test) —
 * mirror `tests/support/helpers.ts` của backend (`signInAs` / `authBearer`).
 */

/** Tạo một session "đã đăng nhập" giả lập bằng cách ghi token vào localStorage.
 *  MSW handler hiểu token dạng `mock:<role>:<id>` → parseAuth() trả role tương ứng. */
export function signInAs(options: { id: string; role: "admin" | "user" }): void {
  authToken.set(`mock:${options.role}:${options.id}`);
}

/** Xoá session (đăng xuất) */
export function signOut(): void {
  authToken.clear();
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

/** Bọc bộ provider cho test: QueryClient (mới mỗi test) + AuthProvider + Router */
export function renderWithProviders(ui: ReactElement, initialRoute = "/"): ReactElement {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[initialRoute]}>{ui}</MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
