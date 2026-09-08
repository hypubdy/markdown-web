import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/features/public/public.api";
import { qk } from "@/lib/query-keys";

/** Xem một note công khai theo shareToken (không cần đăng nhập) */
export function usePublicNote(token?: string) {
  return useQuery({
    queryKey: qk.publicNote(token ?? ""),
    queryFn: () => publicApi.note(token!),
    enabled: !!token,
    retry: 1,
  });
}
