import { useState } from "react";
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
} from "lucide-react";
import type { NoteStatus, SafeNote } from "@/types";

export type EditorMode = "edit" | "split" | "preview";

export interface SplitNoteEditorProps {
  note: SafeNote;
  onChangeTitle: (value: string) => void;
  onChangeContent: (value: string) => void;
  onAddTag: (name: string) => void;
  onRemoveTag: (name: string) => void;
  onChangeStatus?: (status: NoteStatus) => void;
  onSave?: () => void;
  onDelete?: () => void;
  /** gọi sau khi trạng thái/chia sẻ thay đổi (để parent cập nhật note) */
  onChanged?: () => void;
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
  onChangeStatus,
  onSave,
  onDelete,
  onChanged,
  saving,
  className,
}: SplitNoteEditorProps) {
  const [mode, setMode] = useState<EditorMode>("preview");
  const [tagInput, setTagInput] = useState("");

  function commitTag() {
    const t = tagInput.trim().replace(/^#/, "");
    if (!t) return;
    onAddTag(t);
    setTagInput("");
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      {/* Header: tiêu đề + các nút chế độ xem */}
      <div className="flex items-start justify-between gap-3 border-b px-5 py-3">
        <input
          value={note.title}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder="Tiêu đề ghi chú"
          className="w-full bg-transparent text-2xl font-semibold leading-tight outline-none placeholder:text-muted-foreground"
        />
        <div className="flex shrink-0 items-center gap-1">
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
        </div>
      </div>

      {/* Dòng metadata: trạng thái + tags */}
      <div className="flex items-center gap-2 border-b px-5 py-2 text-xs">
        <SelectStatus
          value={note.status}
          onChange={(v) => onChangeStatus?.(v as NoteStatus)}
        />
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{note.tags.length} tag</span>
        <div className="ml-2 flex flex-1 flex-wrap items-center gap-1.5">
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
        <div className="flex items-center gap-1">
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
            className="h-7 w-24 text-xs"
          />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={commitTag}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        {/* Thao tác publish / chia sẻ */}
        <NoteActionsBar note={note} onChanged={onChanged} className="ml-auto" />
      </div>

      {/* Thân chính: tuỳ theo chế độ */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {mode !== "preview" && (
          <div className={cn("min-w-0 flex-1", mode === "split" && "border-r")}>
            <MarkdownEditor
              value={note.content}
              onChange={onChangeContent}
              readOnly={false}
            />
          </div>
        )}
        {mode !== "edit" && (
          <div className="min-w-0 flex-1 overflow-y-auto overscroll-contain bg-muted/20 p-5 [scrollbar-gutter:stable]">
            <MarkdownPreview content={note.content} />
          </div>
        )}
      </div>

      {/* Footer: lưu + xoá (gọn) */}
      {(onSave || onDelete) && (
        <div className="flex items-center justify-between border-t px-5 py-2">
          <div>
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" /> Xoá
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Ctrl+S để lưu
            </span>
            {onSave && (
              <Button size="sm" onClick={onSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Lưu thay đổi
              </Button>
            )}
          </div>
        </div>
      )}
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

function SelectStatus({
  value,
  onChange,
}: {
  value: NoteStatus;
  onChange: (value: NoteStatus) => void;
}) {
  // Dùng select nguyên bản để gọn; trạng thái draft/published
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as NoteStatus)}
      className="h-7 rounded-md border border-input bg-transparent px-2 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
    >
      <option value="draft">Bản nháp</option>
      <option value="published">Đã xuất bản</option>
    </select>
  );
}
