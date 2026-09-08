/**
 * App.tsx — điểm nối provider & router.
 * Provider: QueryClientProvider (main.tsx) → AuthProvider → RouterProvider.
 * Mọi trang đều nằm trong client router; component này chủ yếu để test nhúng
 * (renderAppProviders) thay vì render trực tiếp trong main.
 */
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/features/auth/auth-context";
import { queryClient } from "@/lib/query-client";
import type { ReactNode } from "react";

/** Bọc bộ provider cần thiết — dùng cho cả main và test */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter>{children}</MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default function App() {
  return null;
}
