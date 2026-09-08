import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notesApi, shareApi } from "@/features/notes/notes.api";
import { qk } from "@/lib/query-keys";
import type { NoteStatus } from "@/types";

/** Đổi trạng thái note (publish/unpublish) qua PATCH /notes/:id */
export function useUpdateStatus(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: NoteStatus) => notesApi.update(id ?? "", { status }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: qk.note(updated.id) });
      toast.success(updated.status === "published" ? "Đã xuất bản ghi chú" : "Đã chuyển về bản nháp");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Bật chia sẻ công khai + copy link */
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

/** Thu hồi chia sẻ công khai */
export function useDisableShare(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => shareApi.disable(id ?? ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Đã thu hồi chia sẻ");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
