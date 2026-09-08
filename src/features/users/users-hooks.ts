import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/features/users/users.api";
import { qk } from "@/lib/query-keys";
import type { UserRole } from "@/types";

export function useUserStats() {
  return useQuery({
    queryKey: qk.userStats,
    queryFn: () => usersApi.stats(),
  });
}

export function useUsers(filters: { role?: UserRole; q?: string } = {}) {
  return useQuery({
    queryKey: qk.users(filters),
    queryFn: () => usersApi.list(filters),
  });
}
