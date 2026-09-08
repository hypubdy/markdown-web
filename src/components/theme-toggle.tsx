import { Button } from "@/components/ui/button";
import { useTheme } from "@/app/theme-context";
import { Moon, Sun } from "lucide-react";

export interface ThemeToggleProps {
  /** class bổ sung (để chỉnh kích thước / vị trí) */
  className?: string;
}

/** Nút bật/tắt theme dark/light */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      className={className}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
