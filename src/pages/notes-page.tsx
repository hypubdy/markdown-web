import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { NoteListItemCard } from "@/features/notes/note-list-item";
import { SplitNoteEditor } from "@/features/notes/split-note-editor";
import { useNotes, useNote, useSoftDeleteNote } from "@/features/notes/notes-hooks";
import { useTags } from "@/features/tags/tags-hooks";
import { notesApi } from "@/features/notes/notes.api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Plus, Search } from "lucide-react";
import type { NoteListItem, NoteStatus, SafeNote } from "@/types";

export function NotesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<NoteStatus | "all">("all");
  const [tag, setTag] = useState<string | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /** Bản ghi đang được soạn (draft mới hoặc bản sao của note đã chọn) */
  const [editing, setEditing] = useState<SafeNote | null>(null);
  /** true khi đang tải note khác (chuyển note) → hiện Skeleton, tránh vỡ layout */
  const [switching, setSwitching] = useState(false);

  const filters = {
    q: search || undefined,
    status: status === "all" ? undefined : status,
    tag: tag === "all" ? undefined : tag,
  };

  const { data: notes, isLoading } = useNotes(filters);
  const { data: tags } = useTags();
  const { data: activeNote, isLoading: loadingNote } = useNote(selectedId ?? undefined);
  const softDelete = useSoftDeleteNote();
  const queryClient = useQueryClient();

  const tagOptions = useMemo(() => tags ?? [], [tags]);

  // Khi đã chọn note (không phải draft) & chưa có editing → nạp bản sao để chỉnh
  const liveNote = activeNote ?? null;
  useEffect(() => {
    if (liveNote && (!editing || editing.id !== liveNote.id)) {
      setEditing({ ...liveNote });
    }
    // note đã load xong → hết trạng thái chuyển note
    setSwitching(false);
  }, [liveNote, editing]);

  // Nội dung soạn hiển thị: ưu tiên editing (source mới nhất)
  function patchEditing(patch: Partial<SafeNote>) {
    setEditing((d) => (d ? { ...d, ...patch } : d));
  }

  async function handleSelect(note: NoteListItem) {
    // Giữ editor hiển thị liên tục (không xoá editing) để tránh chớp giữa skeleton/editor;
    // chỉ cập nhật nội dung khi note mới load xong.
    setSwitching(true);
    setSelectedId(note.id);
    const full = await notesApi.byId(note.id);
    setEditing({ ...full });
  }

  async function handleCreate() {
    // Tạo DRAFT cục bộ (chưa gọi API) — chỉ POST khi người dùng bấm Lưu.
    // Điều này tránh lỗi 400 "Tiêu đề không được để trống" khi đang soạn note trống.
    setSelectedId(null);
    setEditing({
      id: "",
      ownerId: "",
      title: "",
      content: "",
      status: "draft",
      deletedAt: null,
      shareToken: null,
      createdAt: "",
      updatedAt: "",
      tags: [],
    });
  }

  async function handleSave() {
    if (!editing) return;
    const body = {
      title: editing.title.trim() || "Ghi chú mới",
      content: editing.content,
      status: editing.status,
      tagNames: editing.tags,
    };
    if (editing.id) {
      // Note đã có → update (giữ id)
      const saved = await notesApi.update(editing.id, body);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["notes", "detail", editing.id] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setEditing({ ...saved });
      setSelectedId(saved.id);
    } else {
      // Draft mới → tạo
      const saved = await notesApi.create(body);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setEditing({ ...saved });
      setSelectedId(saved.id);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    await softDelete.mutateAsync(editing.id);
    setEditing(null);
    setSelectedId(null);
  }

  /** Sau publish/share đổi → refetch detail + list để state editor cập nhật */
  async function refreshCurrent() {
    if (!selectedId) return;
    queryClient.invalidateQueries({ queryKey: ["notes"] });
    queryClient.invalidateQueries({ queryKey: ["notes", "detail", selectedId] });
    const full = await notesApi.byId(selectedId);
    setEditing({ ...full });
  }

  const editorNote = editing;

  return (
    <AppShell
      title="Tất cả ghi chú"
      subtitle="Markdown Notes"
      fullBleed
      hideTopBar
    >
      <div className="flex h-full min-h-0 overflow-hidden">
        {/* Cột trái: danh sách note */}
        <aside className="flex w-72 shrink-0 flex-col border-r bg-card">
          {/* Header: tìm kiếm + tạo */}
          <div className="space-y-2 p-2.5">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm ghi chú…"
                  className="h-8 pl-8 text-sm"
                />
              </div>
              <button
                onClick={() => handleCreate()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border hover:bg-accent"
                title="Tạo ghi chú"
                aria-label="Tạo ghi chú"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {/* Bộ lọc trạng thái (gọn, thay cho tabs riêng) */}
            <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5 text-xs">
              {filterTabs.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setStatus(t.value === "list" ? "all" : t.value)}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1 transition-colors",
                    (status === "all" ? "list" : status) === t.value
                      ? "bg-background font-medium shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {/* Chọn tag */}
            <Select value={tag} onValueChange={(v) => setTag(v as string | "all")}>
              <SelectTrigger className="h-8 w-full text-xs">
                <SelectValue placeholder="Chọn tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tag</SelectItem>
                {tagOptions.map((t) => (
                  <SelectItem key={t.name} value={t.name}>
                    {t.name} ({t.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-1.5 [scrollbar-gutter:stable]">
            {isLoading && (
              <>
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </>
            )}
            {!isLoading && (notes ?? []).length === 0 && (
              <div className="px-3 py-10 text-center text-sm text-muted-foreground">
                Không có ghi chú.
              </div>
            )}
            {(notes ?? []).map((n) => (
              <NoteListItemCard
                key={n.id}
                title={n.title}
                tags={n.tags}
                timestamp={n.updatedAt}
                snippet={n.title}
                active={selectedId === n.id}
                onClick={() => handleSelect(n)}
              />
            ))}
          </div>
        </aside>

        {/* Cột phải: editor chia đôi */}
        <section className="flex min-w-0 flex-1 flex-col">
          {switching || (loadingNote && !editorNote) ? (
            <EditorSkeleton />
          ) : editorNote ? (
            <SplitNoteEditor
              key={editorNote.id}
              note={editorNote}
              onChangeTitle={(v) => patchEditing({ title: v })}
              onChangeContent={(v) => patchEditing({ content: v })}
              onAddTag={(t) =>
                setEditing((d) =>
                  d && !d.tags.includes(t) ? { ...d, tags: [...d.tags, t] } : d,
                )
              }
              onRemoveTag={(t) =>
                setEditing((d) =>
                  d ? { ...d, tags: d.tags.filter((x) => x !== t) } : d,
                )
              }
              onChangeStatus={(s) => patchEditing({ status: s })}
              onSave={handleSave}
              onDelete={handleDelete}
              onChanged={refreshCurrent}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center text-muted-foreground">
              <p className="text-sm">Chọn một ghi chú bên trái để soạn thảo.</p>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

const filterTabs = [
  { value: "list" as const, label: "Tất cả" },
  { value: "draft" as const, label: "Bản nháp" },
  { value: "published" as const, label: "Đã xuất bản" },
];

/** Skeleton mô phỏng bố cục editor (tiêu đề + metadata + body) — hiện khi đang load note */
function EditorSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden" data-testid="editor-skeleton">
      {/* Header: tiêu đề + nút chế độ */}
      <div className="flex items-start justify-between gap-3 border-b px-5 py-3">
        <Skeleton className="h-8 w-2/3" />
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      {/* Metadata */}
      <div className="flex items-center gap-2 border-b px-5 py-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-28" />
      </div>
      {/* Body */}
      <div className="flex flex-1 gap-6 p-6">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-3/6" />
        </div>
      </div>
    </div>
  );
}
