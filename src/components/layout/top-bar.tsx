import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/features/auth/auth-context";

export interface TopBarProps {
  title: string;
  subtitle?: string;
}

/** Thanh tiêu đề gọn cho các trang phụ (trash/tags/admin) — không có nút sidebar */
export function TopBar({ title, subtitle }: TopBarProps) {
  const { user } = useAuth();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="min-w-0 leading-tight">
        <span className="block truncate text-sm font-semibold">{title}</span>
        {subtitle && (
          <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
        )}
      </div>

      <Avatar className="h-8 w-8">
        <AvatarFallback>{user?.name?.slice(0, 1).toUpperCase() || "?"}</AvatarFallback>
      </Avatar>
    </header>
  );
}
