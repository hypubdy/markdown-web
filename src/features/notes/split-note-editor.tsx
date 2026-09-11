import { useEffect, useState } from "react";
import { MarkdownEditor } from "@/components/markdown-editor";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NoteActionsBar } from "@/features/notes/note-actions-bar";
import {
  Pencil,
  PanelRight,
  Eye,
  X,
  Plus,
  Loader2,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import type { SafeNote } from "@/types";

export type EditorMode = "edit" | "split" | "preview";

export interface SplitNoteEditorProps {
  note: SafeNote;
  onChangeTitle: (value: string) => void;
  onChangeContent: (value: string) => void;
  onAddTag: (name: string) => void;
  onRemoveTag: (name: string) => void;
  availableTags?: string[];
  onSave?: () => void;
  onDelete?: () => void;
  /** gọi sau khi chia sẻ thay đổi (để parent cập nhật note) */
  onChanged?: () => void;
  /** quay lại danh sách note trên màn hình mobile */
  onBack?: () => void;
  saving?: boolean;
  className?: string;
}

/** Giao diện editor chia đôi như ảnh: tiêu đề + dòng tag + source/preview */
export function SplitNoteEditor({
  note,
  onChangeTitle,
  onChangeContent,
  onAddTag,
  onRemoveTag,
  availableTags = [],
  onSave,
  onDelete,
  onChanged,
  onBack,
  saving,
  className,
}: SplitNoteEditorProps) {
  const [mode, setMode] = useState<EditorMode>("preview");
  const [tagInput, setTagInput] = useState("");

  // Ctrl/Cmd+S để lưu — giữ đúng lời nhắc hiển thị trên nút lưu
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave?.();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onSave]);

  function commitTag() {
    const t = tagInput.trim().replace(/^#/, "");
    if (!t) return;
    onAddTag(t);
    setTagInput("");
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      {/* Header: tiêu đề + các nút chế độ xem + lưu */}
      <div className="flex flex-col gap-2 border-b px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-1.5">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-8 w-8 shrink-0 md:hidden"
              title="Quay lại danh sách"
              aria-label="Quay lại danh sách"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <input
            value={note.title}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="Tiêu đề ghi chú"
            className="min-w-0 w-full bg-transparent text-xl font-semibold leading-tight outline-none placeholder:text-muted-foreground sm:text-2xl"
          />
        </div>
        <div className="flex shrink-0 items-center justify-between gap-1 sm:justify-end">
          <ModeButton
            active={mode === "edit"}
            onClick={() => setMode("edit")}
            title="Chỉ soạn thảo"
          >
            <Pencil className="h-4 w-4" />
          </ModeButton>
          <ModeButton
            active={mode === "split"}
            onClick={() => setMode("split")}
            title="Chia đôi (soạn + xem)"
          >
            <PanelRight className="h-4 w-4" />
          </ModeButton>
          <ModeButton
            active={mode === "preview"}
            onClick={() => setMode("preview")}
            title="Chỉ xem trước"
          >
            <Eye className="h-4 w-4" />
          </ModeButton>
          {onSave && (
            <>
              <div className="mx-1.5 h-5 w-px bg-border" />
              <Button
                size="sm"
                onClick={onSave}
                disabled={saving}
                className="gap-1.5"
                title="Ctrl+S để lưu"
                aria-label="Lưu thay đổi"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span aria-hidden="true" className="sm:hidden">{saving ? "Lưu…" : "Lưu"}</span>
                <span aria-hidden="true" className="hidden sm:inline">{saving ? "Đang lưu…" : "Lưu thay đổi"}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Dòng metadata: tags */}
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2 text-xs sm:px-5">
        <span className="text-muted-foreground">{note.tags.length} tag</span>
        <div className="order-3 flex min-w-0 basis-full flex-wrap items-center gap-1.5 sm:order-none sm:ml-2 sm:flex-1 sm:basis-auto">
          {note.tags.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1 px-1.5 py-0 text-[11px]">
              {t}
              <button
                type="button"
                onClick={() => onRemoveTag(t)}
                className="ml-0.5 rounded-full hover:text-destructive"
                aria-label={`Xoá tag ${t}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="order-4 flex min-w-0 flex-1 items-center gap-1 sm:order-none sm:flex-none">
          <select
            value=""
            onChange={(event) => onAddTag(event.target.value)}
            aria-label="Chọn nhãn có sẵn"
            className="h-7 min-w-0 flex-1 rounded-md border border-input bg-transparent px-2 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring sm:w-28 sm:flex-none"
          >
            <option value="" disabled>
              Chọn nhãn
            </option>
            {availableTags
              .filter((tag) => !note.tags.includes(tag))
              .map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
          </select>
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                commitTag();
              }
            }}
            onBlur={commitTag}
            placeholder="Thêm tag"
            className="h-7 min-w-0 flex-1 text-xs sm:w-24 sm:flex-none"
          />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={commitTag}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        {/* Thao tác chia sẻ + xoá */}
        <NoteActionsBar note={note} onChanged={onChanged} className="order-2 ml-auto sm:order-none" />
        {note.id && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="order-2 h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive sm:order-none"
            onClick={onDelete}
            title="Xoá ghi chú"
            aria-label="Xoá ghi chú"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Thân chính: tuỳ theo chế độ */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        {mode !== "preview" && (
          <div
            className={cn(
              "min-h-0 min-w-0 flex-1",
              mode === "split" && "border-b md:border-b-0 md:border-r",
            )}
          >
            <MarkdownEditor
              value={note.content}
              onChange={onChangeContent}
              readOnly={false}
            />
          </div>
        )}
        {mode !== "edit" && (
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-muted/20 p-3 [scrollbar-gutter:stable] sm:p-5">
            <MarkdownPreview content={note.content} />
          </div>
        )}
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="icon"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="h-8 w-8"
    >
      {children}
    </Button>
  );
}
