import { QueryClient } from "@tanstack/react-query";

/** QueryClient dùng chung — tắt retry để test nhanh; cache mặc định 5 phút */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});
