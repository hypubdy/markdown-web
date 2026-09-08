import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTags, useDeleteTag } from "@/features/tags/tags-hooks";
import { Tags, Trash2 } from "lucide-react";

export function TagsPage() {
  const { data: tags, isLoading } = useTags();
  const deleteTag = useDeleteTag();

  return (
    <AppShell title="Tags" subtitle="Nhãn gắn cho ghi chú">
      <div className="mx-auto max-w-2xl space-y-3">
        {isLoading && <Skeleton className="h-24 w-full" />}
        {!isLoading && (tags ?? []).length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center text-muted-foreground">
            <Tags className="h-8 w-8" />
            <p className="text-sm">Bạn chưa có tag nào.</p>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {(tags ?? []).map((tag) => (
            <TagCard
              key={tag.name}
              name={tag.name}
              count={tag.count}
              onDelete={() => deleteTag.mutate(tag.name)}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function TagCard({
  name,
  count,
  onDelete,
}: {
  name: string;
  count: number;
  onDelete: () => void;
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
      <Button
        size="icon"
        variant="ghost"
        onClick={onDelete}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
