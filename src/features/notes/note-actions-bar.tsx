import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useEnableShare,
  useDisableShare,
} from "@/features/notes/notes-actions-hooks";
import {
  Globe,
  GlobeLock,
  Link as LinkIcon,
  Loader2,
  Copy,
} from "lucide-react";
import type { SafeNote } from "@/types";

export interface NoteActionsBarProps {
  note: SafeNote;
  onChanged?: () => void;
  className?: string;
}

/**
 * Thanh thao tác chia sẻ công khai (bật/thu hồi + copy link) cho một note.
 * Trạng thái nháp/xuất bản vẫn được backend hỗ trợ nhưng không hiển thị trên UI.
 */
export function NoteActionsBar({ note, onChanged, className }: NoteActionsBarProps) {
  const enableShare = useEnableShare();
  const disableShare = useDisableShare(note.id);
  const [shareOpen, setShareOpen] = useState(false);

  const isShared = !!note.shareToken;

  const publicUrl = note.shareToken
    ? `${window.location.origin}/public/notes/${note.shareToken}`
    : "";

  // Note chưa lưu → chưa có id → chưa thể chia sẻ
  if (!note.id) {
    return <span className="text-xs text-muted-foreground">Lưu để chia sẻ</span>;
  }

  async function toggleShare() {
    if (isShared) {
      await disableShare.mutateAsync();
    } else {
      await enableShare.mutateAsync(note.id);
      toast.success("Đã copy link công khai");
      setShareOpen(true);
    }
    onChanged?.();
  }

  function copyUrl() {
    if (publicUrl) {
      navigator.clipboard?.writeText(publicUrl).catch(() => undefined);
      toast.success("Đã copy link");
    }
  }

  return (
    <>
      <div className={cn("flex items-center gap-1.5", className)}>
        {/* Share */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (isShared) setShareOpen(true);
            else toggleShare();
          }}
          disabled={enableShare.isPending || disableShare.isPending}
          className="gap-1.5"
          title={isShared ? "Xem/quản lý link chia sẻ" : "Bật chia sẻ công khai"}
        >
          {enableShare.isPending || disableShare.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isShared ? (
            <Globe className="h-3.5 w-3.5" />
          ) : (
            <GlobeLock className="h-3.5 w-3.5" />
          )}
          {isShared ? "Đang chia sẻ" : "Chia sẻ"}
        </Button>

        {isShared && (
          <Badge variant="outline" className="h-6 gap-1 px-2 text-[11px] text-primary">
            <LinkIcon className="h-3 w-3" /> Công khai
          </Badge>
        )}
      </div>

      {/* Dialog quản lý link chia sẻ */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Chia sẻ công khai</DialogTitle>
            <DialogDescription>
              Bất kỳ ai có link đều xem được ghi chú này (không cần đăng nhập).
            </DialogDescription>
          </DialogHeader>

          {isShared ? (
            <div className="space-y-3">
              {/* Khung link: URL tự xuống dòng, nút copy cố định bên phải */}
              <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-2.5">
                <LinkIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 break-all text-xs text-muted-foreground">
                  {publicUrl}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  onClick={copyUrl}
                  title="Copy link"
                  aria-label="Copy link"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Mở thử link ở chế độ ẩn danh để kiểm tra, hoặc copy gửi cho người khác.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ghi chú chưa được chia sẻ. Bấm nút bên dưới để lấy link công khai.
            </p>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            <div>
              {isShared && (
                <Button variant="outline" size="sm" asChild>
                  <a href={publicUrl} target="_blank" rel="noreferrer">
                    <LinkIcon className="h-3.5 w-3.5" /> Mở link
                  </a>
                </Button>
              )}
            </div>
            {isShared ? (
              <Button
                variant="destructive"
                onClick={() => {
                  disableShare.mutateAsync().then(() => {
                    onChanged?.();
                    setShareOpen(false);
                  });
                }}
                disabled={disableShare.isPending}
              >
                Thu hồi chia sẻ
              </Button>
            ) : (
              <Button
                onClick={toggleShare}
                disabled={enableShare.isPending}
                className="gap-1.5"
              >
                {enableShare.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Bật chia sẻ
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
