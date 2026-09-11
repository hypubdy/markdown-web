import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/app/install-prompt";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { NoteListItemCard } from "@/features/notes/note-list-item";
import { SplitNoteEditor } from "@/features/notes/split-note-editor";
import { useNotes, useNote, useSoftDeleteNote } from "@/features/notes/notes-hooks";
import { useTags } from "@/features/tags/tags-hooks";
import { notesApi } from "@/features/notes/notes.api";
import { isMarkdownFile, readMarkdownFile } from "@/features/notes/markdown-file";
import { Download, FileUp, Plus, Search } from "lucide-react";
import type { NoteListItem, SafeNote } from "@/types";

export function NotesPage() {
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState<string | "all">("all");
  const { noteId } = useParams<{ noteId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const selectedId = noteId ?? null;

  /** Bản ghi đang được soạn (draft mới hoặc bản sao của note đã chọn) */
  const [editing, setEditing] = useState<SafeNote | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draggingFile, setDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** true khi đang tải note khác (chuyển note) → hiện Skeleton, tránh vỡ layout */
  const [switching, setSwitching] = useState(false);

  const serializeNote = (note: SafeNote) =>
    JSON.stringify({ title: note.title, content: note.content, status: note.status, tags: note.tags });
  const isDirty = !!editing && (!editing.id || serializeNote(editing) !== savedSnapshot);

  const filters = {
    q: search || undefined,
    tag: tag === "all" ? undefined : tag,
  };

  const { data: notes, isLoading } = useNotes(filters);
  const { data: searchableNotes } = useNotes({ q: search || undefined });
  const { data: tags } = useTags();
  const { data: activeNote, isLoading: loadingNote } = useNote(selectedId ?? undefined);
  const softDelete = useSoftDeleteNote();
  const queryClient = useQueryClient();
  const { canInstall, install } = useInstallPrompt();

  const tagOptions = useMemo(() => tags ?? [], [tags]);
  const allNotesCount = searchableNotes?.length ?? 0;

  // Khi đã chọn note (không phải draft) & chưa có editing → nạp bản sao để chỉnh
  const liveNote = activeNote ?? null;
  useEffect(() => {
    if (liveNote && (!editing || editing.id !== liveNote.id)) {
      setEditing({ ...liveNote });
      setSavedSnapshot(serializeNote(liveNote));
    }
    // note đã load xong → hết trạng thái chuyển note
    setSwitching(false);
  }, [liveNote, editing]);

  // Khi chuyển từ /notes/:id về / để tạo note, route mới có thể mount lại page.
  // Dùng location state để không làm mất draft cục bộ trong lần chuyển này.
  useEffect(() => {
    if (!location.state?.createNote) return;
    setSavedSnapshot(null);
    setEditing(createEmptyNote());
    navigate("/", { replace: true, state: null });
  }, [location.state, navigate]);

  // Nội dung soạn hiển thị: ưu tiên editing (source mới nhất)
  function patchEditing(patch: Partial<SafeNote>) {
    setEditing((d) => (d ? { ...d, ...patch } : d));
  }

  async function handleSelect(note: NoteListItem) {
    // Giữ editor hiển thị liên tục (không xoá editing) để tránh chớp giữa skeleton/editor;
    // chỉ cập nhật nội dung khi note mới load xong.
    setSwitching(true);
    navigate(`/notes/${encodeURIComponent(note.id)}`);
    const full = await notesApi.byId(note.id);
    setEditing({ ...full });
    setSavedSnapshot(serializeNote(full));
  }

  async function handleCreate() {
    // Tạo DRAFT cục bộ (chưa gọi API) — chỉ POST khi người dùng bấm Lưu.
    // Điều này tránh lỗi 400 "Tiêu đề không được để trống" khi đang soạn note trống.
    setSavedSnapshot(null);
    setEditing(createEmptyNote());
    if (location.pathname !== "/") {
      navigate("/", { state: { createNote: true } });
    }
  }

  async function handleOpenFile(file?: File) {
    if (!file) return;
    if (!isMarkdownFile(file)) {
      toast.error("Vui lòng chọn file có phần mở rộng .md");
      return;
    }

    const hasUnsavedChanges =
      !!editing &&
      (editing.id
        ? serializeNote(editing) !== savedSnapshot
        : Boolean(editing.title.trim() || editing.content || editing.tags.length));
    if (hasUnsavedChanges && !window.confirm("Thay đổi chưa lưu sẽ bị mất. Bạn vẫn muốn mở file mới?")) {
      return;
    }

    try {
      const draft = await readMarkdownFile(file);
      setSavedSnapshot(null);
      setEditing({ ...createEmptyNote(), ...draft });
      setSwitching(false);
      if (location.pathname !== "/") {
        navigate("/", { replace: true, state: null });
      }
      toast.success(`Đã mở ${file.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể đọc file Markdown");
    }
  }

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    void handleOpenFile(event.target.files?.[0]);
    event.target.value = "";
  }

  async function handleSave() {
    if (!editing || saving || !isDirty) return;
    setSaving(true);
    try {
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
      setSavedSnapshot(serializeNote(saved));
      navigate(`/notes/${encodeURIComponent(saved.id)}`, { replace: true });
    } else {
      // Draft mới → tạo
      const saved = await notesApi.create(body);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setEditing({ ...saved });
      setSavedSnapshot(serializeNote(saved));
      navigate(`/notes/${encodeURIComponent(saved.id)}`, { replace: true });
    }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    await softDelete.mutateAsync(editing.id);
    setEditing(null);
    navigate("/", { replace: true });
  }

  /** Sau publish/share đổi → refetch detail + list để state editor cập nhật */
  async function refreshCurrent() {
    if (!selectedId) return;
    queryClient.invalidateQueries({ queryKey: ["notes"] });
    queryClient.invalidateQueries({ queryKey: ["notes", "detail", selectedId] });
    const full = await notesApi.byId(selectedId);
    setEditing({ ...full });
    setSavedSnapshot(serializeNote(full));
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
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,text/markdown"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border hover:bg-accent"
                title="Mở file .md"
                aria-label="Mở file .md"
              >
                <FileUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleCreate()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border hover:bg-accent"
                title="Tạo ghi chú"
                aria-label="Tạo ghi chú"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div
              role="group"
              aria-label="Lọc theo nhãn"
              onWheel={(event) => {
                const element = event.currentTarget;
                if (element.scrollWidth <= element.clientWidth || event.deltaY === 0) return;
                event.preventDefault();
                element.scrollLeft += event.deltaY;
              }}
              className="flex items-center gap-1 overflow-x-auto rounded-full border bg-muted/25 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <TagFilterButton
                active={tag === "all"}
                count={allNotesCount}
                label="Tất cả"
                onClick={() => setTag("all")}
              />
              {tagOptions.map((item) => (
                <TagFilterButton
                  key={item.name}
                  active={tag === item.name}
                  count={item.count}
                  label={item.name}
                  onClick={() => setTag(item.name)}
                />
              ))}
            </div>
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
                active={selectedId === n.id}
                onClick={() => handleSelect(n)}
              />
            ))}
          </div>
        </aside>

        {/* Cột phải: editor chia đôi */}
        <section
          className="relative flex min-w-0 flex-1 flex-col"
          onDragOver={(event) => {
            if (Array.from(event.dataTransfer.types).includes("Files")) {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
              setDraggingFile(true);
            }
          }}
          onDragLeave={() => setDraggingFile(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDraggingFile(false);
            void handleOpenFile(event.dataTransfer.files?.[0]);
          }}
        >
          {draggingFile && (
            <div className="pointer-events-none absolute inset-3 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/10 text-sm font-medium text-primary">
              Thả file .md để mở thành draft
            </div>
          )}
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
              availableTags={tagOptions.map((item) => item.name)}
              onSave={handleSave}
               saving={saving}
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
      {canInstall && (
        <Button
          type="button"
          className="fixed bottom-4 right-4 z-20 gap-2 shadow-lg"
          onClick={() => void install()}
        >
          <Download className="h-4 w-4" />
          Cài ứng dụng
        </Button>
      )}
    </AppShell>
  );
}

function TagFilterButton({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
        active
          ? "bg-secondary text-secondary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      <span className="max-w-28 truncate">{label}</span>
      <span
        className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none ${
          active
            ? "bg-violet-500 text-white"
            : "bg-muted-foreground/15 text-muted-foreground"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function createEmptyNote(): SafeNote {
  return {
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
  };
}

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
