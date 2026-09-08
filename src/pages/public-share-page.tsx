import { useParams } from "react-router-dom";
import { usePublicNote } from "@/features/public/public-hooks";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { FileText, ExternalLink } from "lucide-react";

export function PublicSharePage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { data: note, isLoading, isError, error } = usePublicNote(shareToken);

  return (
    <div className="flex min-h-full flex-col">
      {/* Header ngang full width */}
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/90 px-5 backdrop-blur">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </span>
          <span className="font-medium">Markdown Notes</span>
          <span className="hidden text-muted-foreground/70 sm:inline">· Ghi chú công khai</span>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/login">
            <ExternalLink /> Mở app
          </a>
        </Button>
      </header>

      {/* Nội dung rộng hơn */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
        {isLoading && <Skeleton className="h-64 w-full" />}

        {isError && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-20 text-center text-muted-foreground">
            <p className="text-sm font-medium">Không thể xem ghi chú này.</p>
            <p className="text-xs">
              {(error as Error)?.message || "Link có thể đã bị thu hồi hoặc không hợp lệ."}
            </p>
          </div>
        )}

        {note && (
          <article>
            <header className="border-b pb-5">
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                {note.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Cập nhật {formatDate(note.updatedAt)}
              </p>
            </header>
            <div className="mt-8 rounded-xl border bg-card p-6 sm:p-8 lg:p-10">
              <MarkdownPreview content={note.content} />
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
