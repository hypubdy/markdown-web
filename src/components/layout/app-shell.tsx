import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface AppShellProps {
  title: string;
  subtitle?: string;
  /** Tabs hiển thị ở đầu content (bên dưới topbar) — tuỳ trang */
  tabs?: { value: string; label: string }[];
  tabValue?: string;
  onTabChange?: (v: string) => void;
  /** true → content chiếm toàn bộ chiều cao (không padding/scroll bao ngoài) */
  fullBleed?: boolean;
  /** true → không render TopBar (trang chủ/editor tự quản lý phần đầu) */
  hideTopBar?: boolean;
  /** Khối nội dung chính của trang */
  children: ReactNode;
}

/**
 * Shell layout kiểu DeepSeek Harness:
 * ┌──────────┬───────────────────────────┐
 * │ sidebar  │ topbar? (title + mode)    │
 * │ (rail/56)├───────────────────────────┤
 * │          │ tabs? + content (full-height)
 * └──────────┴───────────────────────────┘
 * - Nút thu gọn sidebar nằm ở HEADER sidebar (không phụ thuộc TopBar).
 * - `hideTopBar` bỏ hẳn thanh tiêu đề cho các trang editor (vd notes) để tối đa diện tích.
 */
export function AppShell({
  title,
  subtitle,
  tabs,
  tabValue,
  onTabChange,
  fullBleed = false,
  hideTopBar = false,
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="shrink-0 transition-all">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {!hideTopBar && <TopBar title={title} subtitle={subtitle} />}

        {tabs && tabs.length > 0 && (
          <div className="shrink-0 border-b px-4 pt-1.5">
            <Tabs value={tabValue} onValueChange={onTabChange}>
              <TabsList className="h-8 bg-transparent p-0">
                {tabs.map((t) => (
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                  >
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        <main
          className={cn(
            "min-h-0 flex-1",
            fullBleed ? "overflow-hidden" : "overflow-auto p-4",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

/** Tiện ích render Outlet trong shell khi dùng router */
export function AppShellOutlet(props: Omit<AppShellProps, "children">) {
  return (
    <AppShell {...props}>
      <Outlet />
    </AppShell>
  );
}
