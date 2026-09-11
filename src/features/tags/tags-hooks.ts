import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tagsApi } from "@/features/tags/tags.api";
import { notesApi } from "@/features/notes/notes.api";
import { qk } from "@/lib/query-keys";
import type { NoteListItem } from "@/types";

const PAGE_SIZE = 100;

type AddTagInput = {
  noteId: string;
  currentTags: string[];
  name: string;
};

type RenameTagInput = {
  from: string;
  to: string;
};

async function listAllNotesWithTag(name: string) {
  const notes: NoteListItem[] = [];
  let page = 1;

  while (true) {
    const items = await notesApi.list({ tag: name, page, limit: PAGE_SIZE });
    notes.push(...items);
    if (items.length < PAGE_SIZE) return notes;
    page += 1;
  }
}

function invalidateTagQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["tags"] });
  queryClient.invalidateQueries({ queryKey: ["notes"] });
}

/** Tags của mình kèm count */
export function useTags() {
  return useQuery({ queryKey: qk.tags, queryFn: () => tagsApi.list() });
}

/** Thêm tag vào một note qua PATCH /notes/:id { tagNames }. */
export function useAddTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, currentTags, name }: AddTagInput) =>
      notesApi.update(noteId, {
        tagNames: Array.from(new Set([...currentTags, name.trim()])),
      }),
    onSuccess: () => {
      invalidateTagQueries(queryClient);
      toast.success("Đã thêm nhãn");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Đổi tên tag trên toàn bộ note đang dùng tag đó qua PATCH /notes/:id. */
export function useRenameTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ from, to }: RenameTagInput) => {
      const notes = await listAllNotesWithTag(from);
      for (const note of notes) {
        const tagNames = Array.from(
          new Set(note.tags.map((tag) => (tag === from ? to : tag))),
        );
        await notesApi.update(note.id, { tagNames });
      }
      return notes.length;
    },
    onSuccess: (count) => {
      invalidateTagQueries(queryClient);
      toast.success(`Đã đổi tên nhãn trên ${count} ghi chú`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => tagsApi.remove(name),
    onSuccess: () => {
      invalidateTagQueries(queryClient);
      toast.success("Đã xoá tag");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
