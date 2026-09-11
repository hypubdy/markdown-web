import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotes } from "@/features/notes/notes-hooks";
import {
  useAddTag,
  useDeleteTag,
  useRenameTag,
  useTags,
} from "@/features/tags/tags-hooks";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";

export function TagsPage() {
  const { data: tags, isLoading } = useTags();
  const { data: notes } = useNotes({ limit: 100 });
  const addTag = useAddTag();
  const deleteTag = useDeleteTag();
  const renameTag = useRenameTag();

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [noteId, setNoteId] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [tagToRename, setTagToRename] = useState("");
  const [renameValue, setRenameValue] = useState("");

  const noteOptions = notes ?? [];

  function openAddDialog() {
    setNewName("");
    setNoteId(noteOptions[0]?.id ?? "");
    setAddOpen(true);
  }

  function submitAdd() {
    const name = newName.trim();
    const note = noteOptions.find((item) => item.id === noteId);
    if (!name || name.length > 30 || !note) return;

    addTag.mutate(
      { noteId: note.id, currentTags: note.tags, name },
      { onSuccess: () => setAddOpen(false) },
    );
  }

  function openRenameDialog(name: string) {
    setTagToRename(name);
    setRenameValue(name);
    setRenameOpen(true);
  }

  function submitRename() {
    const to = renameValue.trim();
    if (!tagToRename || !to || to.length > 30) return;
    if (to === tagToRename) {
      setRenameOpen(false);
      return;
    }

    renameTag.mutate(
      { from: tagToRename, to },
      { onSuccess: () => setRenameOpen(false) },
    );
  }

  return (
    <AppShell title="Tags" subtitle="Nhãn gắn cho ghi chú">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold">Quản lý nhãn</h1>
            <p className="text-sm text-muted-foreground">
              Thêm nhãn vào ghi chú, đổi tên hoặc xoá nhãn.
            </p>
          </div>
          <Button
            onClick={openAddDialog}
            disabled={noteOptions.length === 0}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
            Thêm nhãn
          </Button>
        </div>

        {noteOptions.length === 0 && !isLoading && (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            Hãy tạo ít nhất một ghi chú trước khi thêm nhãn.
          </p>
        )}

        {isLoading && <Skeleton className="h-24 w-full" />}
        {!isLoading && (tags ?? []).length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center text-muted-foreground">
            <Tags className="h-8 w-8" />
            <p className="text-sm">Bạn chưa có nhãn nào.</p>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {(tags ?? []).map((tag) => (
            <TagCard
              key={tag.name}
              name={tag.name}
              count={tag.count}
              onEdit={() => openRenameDialog(tag.name)}
              onDelete={() => deleteTag.mutate(tag.name)}
              disabled={deleteTag.isPending || renameTag.isPending}
            />
          ))}
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm nhãn</DialogTitle>
            <DialogDescription>
              Nhãn sẽ được gắn vào ghi chú bạn chọn.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-tag-name">Tên nhãn</Label>
              <Input
                id="new-tag-name"
                value={newName}
                maxLength={30}
                onChange={(event) => setNewName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submitAdd();
                  }
                }}
                placeholder="Ví dụ: công việc"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-note">Gắn vào ghi chú</Label>
              <select
                id="tag-note"
                value={noteId}
                onChange={(event) => setNoteId(event.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {noteOptions.map((note) => (
                  <option key={note.id} value={note.id}>
                    {note.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Huỷ
            </Button>
            <Button
              onClick={submitAdd}
              disabled={addTag.isPending || !newName.trim() || !noteId}
            >
              {addTag.isPending ? "Đang thêm…" : "Thêm nhãn"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi tên nhãn</DialogTitle>
            <DialogDescription>
              Tên mới sẽ được cập nhật trên tất cả ghi chú đang dùng nhãn này.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-tag-name">Tên nhãn mới</Label>
            <Input
              id="rename-tag-name"
              value={renameValue}
              maxLength={30}
              onChange={(event) => setRenameValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitRename();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Huỷ
            </Button>
            <Button
              onClick={submitRename}
              disabled={renameTag.isPending || !renameValue.trim()}
            >
              {renameTag.isPending ? "Đang cập nhật…" : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function TagCard({
  name,
  count,
  onEdit,
  onDelete,
  disabled,
}: {
  name: string;
  count: number;
  onEdit: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Tags className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium">#{name}</p>
          <p className="text-xs text-muted-foreground">{count} ghi chú</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={onEdit}
          disabled={disabled}
          title={`Đổi tên nhãn ${name}`}
          aria-label={`Đổi tên nhãn ${name}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onDelete}
          disabled={disabled}
          title={`Xoá nhãn ${name}`}
          aria-label={`Xoá nhãn ${name}`}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
