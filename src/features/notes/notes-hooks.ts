import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notesApi } from "@/features/notes/notes.api";
import { qk } from "@/lib/query-keys";
import type { CreateNoteBody, NoteListParams, UpdateNoteBody } from "@/types";

/** Danh sách note SỐNG của mình (lọc q/status/tag) */
export function useNotes(params: NoteListParams = {}) {
  return useQuery({
    queryKey: qk.notes(params),
    queryFn: () => notesApi.list(params),
  });
}

/** Chi tiết một note (kèm content + tags) */
export function useNote(id?: string) {
  return useQuery({
    queryKey: qk.note(id ?? ""),
    queryFn: () => notesApi.byId(id!),
    enabled: !!id,
  });
}

/** Nội dung raw markdown của một note */
export function useRawNote(id?: string) {
  return useQuery({
    queryKey: qk.noteRaw(id ?? ""),
    queryFn: () => notesApi.raw(id!),
    enabled: !!id,
    staleTime: 0,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateNoteBody) => notesApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Đã tạo ghi chú");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateNote(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateNoteBody) => notesApi.update(id!, body),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: qk.note(id ?? "") });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      // Nếu đổi title/status thì danh sách cũng đổi
      if (vars.title !== undefined || vars.status !== undefined) {
        queryClient.invalidateQueries({ queryKey: ["notes"] });
      }
      toast.success("Đã cập nhật ghi chú");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSoftDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesApi.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["notes", "trash"] });
      toast.success("Đã chuyển vào thùng rác");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
