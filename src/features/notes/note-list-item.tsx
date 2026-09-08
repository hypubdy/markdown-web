import { Badge } from "@/components/ui/badge";
import { formatDate, truncate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { TagCount } from "@/types";

export interface NoteListItemCardProps {
  title: string;
  tags: string[];
  timestamp: string;
  /** dòng mô tả ngắn (excerpt) */
  snippet?: string;
  active?: boolean;
  onClick: () => void;
  /** đếm theo tag (màu) — tuỳ chọn */
  tagCounts?: TagCount[];
}

/** Một dòng trong danh sách note bên trái — mật độ gọn, phân cấp rõ */
export function NoteListItemCard({
  title,
  tags,
  timestamp,
  snippet,
  active,
  onClick,
}: NoteListItemCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full rounded-md px-3 py-2 text-left transition-colors",
        active
          ? "border border-primary/20 bg-primary/8"
          : "border border-transparent hover:bg-accent/50",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-medium">{title}</span>
        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
          {formatDate(timestamp)}
        </span>
      </div>
      {snippet && (
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground/80">
          {truncate(snippet, 110)}
        </p>
      )}
      {tags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {tags.slice(0, 4).map((t) => (
            <Badge
              key={t}
              variant="secondary"
              className="px-1.5 py-0 text-[10px] font-normal"
            >
              {t}
            </Badge>
          ))}
        </div>
      )}
    </button>
  );
}
