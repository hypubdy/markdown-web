import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrash, useRestoreNote, useHardDeleteNote } from "@/features/notes/notes-trash-hooks";
import { formatDate } from "@/lib/utils";
import { Trash2, RotateCcw, FileText } from "lucide-react";
import type { NoteListItem } from "@/types";

export function TrashPage() {
  const { data: trash, isLoading } = useTrash();
  const restore = useRestoreNote();
  const hardDelete = useHardDeleteNote();

  return (
    <AppShell title="Thùng rác" subtitle="Ghi chú đã xoá mềm">
      <div className="mx-auto max-w-2xl space-y-3">
        {isLoading && (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        )}
        {!isLoading && (trash ?? []).length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center text-muted-foreground">
            <Trash2 className="h-8 w-8" />
            <p className="text-sm">Thùng rác đang trống.</p>
          </div>
        )}
        {(trash ?? []).map((note) => (
          <TrashItem
            key={note.id}
            note={note}
            onRestore={() => restore.mutate(note.id)}
            onDelete={() => hardDelete.mutate(note.id)}
          />
        ))}
      </div>
    </AppShell>
  );
}

function TrashItem({
  note,
  onRestore,
  onDelete,
}: {
  note: NoteListItem;
  onRestore: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="truncate text-sm font-medium">{note.title}</span>
          {note.tags.slice(0, 3).map((t) => (
            <Badge key={t} variant="secondary" className="text-[10px] px-1.5">
              #{t}
            </Badge>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Xoá lúc {formatDate(note.updatedAt)}
        </p>
      </div>
      <div className="flex shrink-0 justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onRestore} className="flex-1 sm:flex-none">
          <RotateCcw /> Khôi phục
        </Button>
        <Button size="sm" variant="destructive" onClick={onDelete} className="flex-1 sm:flex-none">
          <Trash2 /> Xoá hẳn
        </Button>
      </div>
    </div>
  );
}
