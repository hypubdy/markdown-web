import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trashApi, shareApi } from "@/features/notes/notes.api";
import { qk } from "@/lib/query-keys";

/** Danh sách note trong thùng rác */
export function useTrash() {
  return useQuery({ queryKey: qk.trash, queryFn: () => trashApi.list() });
}

export function useRestoreNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trashApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", "trash"] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Đã khôi phục ghi chú");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useHardDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trashApi.hardDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", "trash"] });
      toast.success("Đã xoá vĩnh viễn");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useEnableShare() {
  return useMutation({
    mutationFn: (id: string) => shareApi.enable(id),
    onSuccess: (data) => {
      navigator.clipboard?.writeText(data.url).catch(() => undefined);
      toast.success("Đã bật chia sẻ công khai (đã copy link)");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDisableShare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shareApi.disable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Đã thu hồi chia sẻ");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
