import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { qk } from "@/lib/query-keys";
import type { LoginBody, RegisterBody } from "@/types";

/**
 * Đăng nhập/đăng ký → lưu session qua AuthProvider (setQueryData me).
 * VIỆC ĐIỀU HƯỚNG sau login được xử lý TƯỜNG MINH bởi `<RedirectIfAuthenticated>`
 * (guard bao trang /login & /register) — đọc trạng thái auth MỚI NHẤT thay vì
 * navigate trong onSuccess (tránh đọc stale context khi React batch).
 */
export function useLogin() {
  const { login } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: LoginBody) => login(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.me });
    },
  });
}

export function useRegister() {
  const { register } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: RegisterBody) => register(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.me });
    },
  });
}
