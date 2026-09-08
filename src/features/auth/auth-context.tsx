import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/features/auth/auth.api";
import { usersApi } from "@/features/users/users.api";
import { qk } from "@/lib/query-keys";
import { authToken } from "@/lib/auth-token";
import type { LoginBody, RegisterBody, SafeUser } from "@/types";

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
async function fetchMe(): Promise<SafeUser | null> {
  if (!authToken.get()) return null;
  try {
    return await usersApi.me();
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: qk.me,
    queryFn: fetchMe,
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

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được dùng bên trong <AuthProvider>");
  return ctx;
}
