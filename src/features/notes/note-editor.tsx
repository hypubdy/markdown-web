import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarkdownPreview } from "@/components/markdown-preview";
import { useCreateNote, useUpdateNote } from "@/features/notes/notes-hooks";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { NoteStatus, SafeNote } from "@/types";

export interface NoteEditorProps {
  /** note hiện có (edit) hoặc undefined (create) */
  note?: SafeNote;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (note: SafeNote) => void;
}

/** Chuyển "a, b, c" → mảng tag đã trim, bỏ rỗng, giữ tối đa 20 */
function parseTags(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  ).slice(0, 20);
}

export function NoteEditor({ note, open, onOpenChange, onSaved }: NoteEditorProps) {
  const isEdit = !!note;
  const createMutation = useCreateNote();
  const updateMutation = useUpdateNote(note?.id);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<NoteStatus>("draft");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Nạp dữ liệu khi mở edit
  useEffect(() => {
    if (open) {
      setTitle(note?.title ?? "");
      setContent(note?.content ?? "");
      setStatus(note?.status ?? "draft");
      setTags(note?.tags ?? []);
      setTagInput("");
    }
  }, [open, note]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSave() {
    const tagNames = [...tags];
    const trimmed = tagInput.trim();
    if (trimmed) {
      const extra = parseTags(trimmed);
      for (const t of extra) if (!tagNames.includes(t)) tagNames.push(t);
    }

    const body = { title, content, status, tagNames };
    if (isEdit && note) {
      const updated = await updateMutation.mutateAsync(body);
      onSaved?.(updated);
    } else {
      const created = await createMutation.mutateAsync(body);
      onSaved?.(created);
    }
    onOpenChange(false);
  }

  function addTag(raw: string) {
    const t = raw.trim().replace(/,+$/g, "").replace(/^#/, "");
    if (!t) return;
    setTags((prev) => (prev.includes(t) ? prev : [...prev, t].slice(0, 20)));
    setTagInput("");
  }

  function removeTag(t: string) {
    setTags((prev) => prev.filter((x) => x !== t));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Sửa ghi chú" : "Tạo ghi chú mới"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note-title">Tiêu đề</Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tiêu đề ghi chú"
            />
          </div>

          <Tabs defaultValue="write" className="w-full">
            <TabsList>
              <TabsTrigger value="write">Viết</TabsTrigger>
              <TabsTrigger value="preview">Xem trước</TabsTrigger>
            </TabsList>
            <TabsContent value="write">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Viết Markdown…"
                className="min-h-[260px] font-mono text-sm"
              />
            </TabsContent>
            <TabsContent value="preview">
              <div className="min-h-[260px] rounded-md border bg-muted/40 p-4">
                <MarkdownPreview content={content} />
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as NoteStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Bản nháp</SelectItem>
                  <SelectItem value="published">Xuất bản</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
                onBlur={() => addTag(tagInput)}
                placeholder="Gõ tag rồi Enter (vd: markdown, demo)"
              />
            </div>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="gap-1">
                  #{t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="ml-1 rounded-full hover:text-destructive"
                    aria-label={`Xoá tag ${t}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={onSave} disabled={isPending || !title.trim()}>
            {isPending ? "Đang lưu…" : "Lưu ghi chú"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
