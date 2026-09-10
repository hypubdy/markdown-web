import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/features/auth/auth.api";
import { usersApi } from "@/features/users/users.api";
import { isClerkEnabled } from "@/lib/auth-mode";
import { qk } from "@/lib/query-keys";
import { authToken, setAccessTokenProvider } from "@/lib/auth-token";
import type { LoginBody, RegisterBody, SafeUser } from "@/types";

/**
 * AUTH CONTEXT — 1 interface, 2 chế độ:
 *  - Clerk (SSO, khi có VITE_CLERK_PUBLISHABLE_KEY): đăng nhập qua Clerk OAuth.
 *    AuthProvider phải nằm trong <ClerkProvider> (xem main.tsx). Mọi api.* gắn
 *    Clerk session token (ngắn hạn) qua resolveAccessToken().
 *  - Legacy (JWT nội bộ): form email/mật khẩu → token trong localStorage
 *    (backend AUTH_PROVIDER=local; dùng cho test MSW & dev không bật Clerk).
 */
interface AuthContextValue {
  user: SafeUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (body: LoginBody) => Promise<void>;
  register: (body: RegisterBody) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Lấy user hiện tại (nếu có token hợp lệ) — KHÔNG ném lỗi, trả null khi chưa đăng nhập */
async function fetchMeLegacy(): Promise<SafeUser | null> {
  if (!authToken.get()) return null;
  try {
    return await usersApi.me();
  } catch {
    return null;
  }
}

/** Chế độ Legacy — giữ nguyên hành vi cũ (JWT nội bộ trong localStorage) */
function LegacyAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: qk.me,
    queryFn: fetchMeLegacy,
    retry: 1,
  });

  const login = useCallback(
    async (body: LoginBody) => {
      const result = await authApi.login(body);
      authApi.persist(result);
      queryClient.setQueryData(qk.me, result.user);
    },
    [queryClient],
  );

  const register = useCallback(
    async (body: RegisterBody) => {
      const result = await authApi.register(body);
      authApi.persist(result);
      queryClient.setQueryData(qk.me, result.user);
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    authToken.clear();
    queryClient.clear();
    queryClient.setQueryData(qk.me, null);
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Chế độ Clerk (SSO) — cần nằm trong <ClerkProvider>.
 * user ở đây là HỒ SƠ NỘI BỘ (SafeUser từ /users/me: role, id ghi chú…)
 * mà backend cấp sau khi map Clerk session → tài khoản nội bộ.
 */
function ClerkAuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, signOut, getToken } = useClerkAuth();
  const queryClient = useQueryClient();

  // Gắn cờ khi provider token sẵn sàng — tránh query /users/me chạy trước khi
  // có cách lấy token (Clerk getToken).
  const [tokenReady, setTokenReady] = useState(false);
  const signedIn = Boolean(isLoaded && isSignedIn);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      // Mỗi request lấy Clerk session token MỚI (ngắn hạn, tự refresh)
      setAccessTokenProvider(async () => (await getToken()) ?? null);
      setTokenReady(true);
    } else {
      setAccessTokenProvider(null);
      setTokenReady(false);
      authToken.clear();
      queryClient.setQueryData(qk.me, null);
    }
  }, [isLoaded, isSignedIn, getToken, queryClient]);

  const { data: user, isPending: mePending } = useQuery({
    queryKey: qk.me,
    queryFn: () => usersApi.me(),
    enabled: signedIn && tokenReady,
    retry: 1,
  });

  const login = useCallback(async () => {
    throw new Error(
      "Đăng nhập bằng mật khẩu đã tắt — vui lòng dùng nút SSO (Google/GitHub) ở trang đăng nhập",
    );
  }, []);

  const register = useCallback(async () => {
    throw new Error(
      "Đăng ký qua mật khẩu đã tắt — tài khoản được tạo tự động khi bạn đăng nhập SSO lần đầu",
    );
  }, []);

  const logout = useCallback(() => {
    setAccessTokenProvider(null);
    queryClient.clear();
    queryClient.setQueryData(qk.me, null);
    void signOut();
  }, [signOut, queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      // isLoading=true khi Clerk chưa load xong, hoặc đã đăng nhập nhưng hồ sơ
      // nội bộ (role…) chưa về — tránh nhấp nháy redirect guard.
      isLoading: !isLoaded || (signedIn && (!tokenReady || mePending)),
      isAuthenticated: signedIn,
      login,
      register,
      logout,
    }),
    [isLoaded, signedIn, tokenReady, mePending, user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return isClerkEnabled ? (
    <ClerkAuthProvider>{children}</ClerkAuthProvider>
  ) : (
    <LegacyAuthProvider>{children}</LegacyAuthProvider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được dùng bên trong <AuthProvider>");
  return ctx;
}
