import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tagsApi } from "@/features/tags/tags.api";
import { qk } from "@/lib/query-keys";

/** Tags của mình kèm count */
export function useTags() {
  return useQuery({ queryKey: qk.tags, queryFn: () => tagsApi.list() });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => tagsApi.remove(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Đã xoá tag");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
