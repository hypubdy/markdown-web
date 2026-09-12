import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { isDeveloperModeEnabled } from "@/lib/developer-mode";

/** Bọc trang yêu cầu đã đăng nhập — chưa đăng nhập thì redirect /login */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Skeleton className="h-16 w-64" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

/** Bọc trang chỉ dành cho admin */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

/** Chỉ cho phép mở các tính năng nội bộ khi developer mode được bật. */
export function RequireDeveloperMode({ children }: { children: ReactNode }) {
  if (!isDeveloperModeEnabled()) {
    return <Navigate to="/404" replace />;
  }
  return <>{children}</>;
}

/** Trang auth (login/register) — đã đăng nhập thì chuyển về "/" */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}
