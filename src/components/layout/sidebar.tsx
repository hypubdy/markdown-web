import { NavLink } from "react-router-dom";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/app/theme-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Trash2,
  Tags,
  Users,
  Settings,
  LogOut,
  Shield,
  PanelLeft,
  PanelLeftClose,
  Moon,
  Sun,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Ghi chú", icon: FileText, end: true },
  { to: "/trash", label: "Thùng rác", icon: Trash2 },
  { to: "/tags", label: "Tags", icon: Tags },
  { to: "/admin/users", label: "Người dùng", icon: Users, adminOnly: true },
];

export interface SidebarProps {
  /** true → chỉ hiện icon (rail hẹp) để tối đa diện tích nội dung */
  collapsed?: boolean;
  /** mở rộng / thu gọn sidebar */
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const items = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === "admin",
  );

  if (collapsed) {
    return (
      <aside className="flex h-full w-14 shrink-0 flex-col border-r bg-sidebar">
        <div className="flex h-12 items-center justify-center">
          <button
            onClick={onToggle}
            title="Mở sidebar"
            aria-label="Mở sidebar"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <PanelLeft className="h-[18px] w-[18px]" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col items-center gap-1 py-2">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              aria-label={item.label}
              className={({ isActive }) =>
                cn(
                  "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )
              }
            >
              <item.icon className="h-[18px] w-[18px]" />
            </NavLink>
          ))}
        </nav>
        <div className="flex justify-center border-t p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                title={user?.name ?? "Người dùng"}
                aria-label="Tài khoản"
                className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{user?.name?.slice(0, 1).toUpperCase() || "?"}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>
                {user?.name ?? "Người dùng"}
                <span className="block text-xs font-normal text-muted-foreground">
                  {user?.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === "dark" ? <Sun /> : <Moon />}
                {theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
              </DropdownMenuItem>
              {user?.role === "admin" && (
                <DropdownMenuItem asChild>
                  <NavLink to="/admin/users">
                    <Shield /> Quản lý người dùng
                  </NavLink>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut /> Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r bg-sidebar">
      {/* Header */}
      <div className="flex h-12 items-center gap-2 px-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <FileText className="h-4 w-4" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-sm font-semibold">markdown</span>
          <span className="text-[10px] text-muted-foreground">notes studio</span>
        </div>
        <button
          onClick={onToggle}
          title="Thu gọn sidebar"
          aria-label="Thu gọn sidebar"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2 py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer: user + theme trong menu tài khoản */}
      <div className="border-t p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left hover:bg-accent">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{user?.name?.slice(0, 1).toUpperCase() || "?"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-medium">{user?.name || "…"}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="uppercase text-xs text-muted-foreground">
              {user?.role === "admin" ? "Quản trị viên" : "Người dùng"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={toggleTheme}>
              {theme === "dark" ? <Sun /> : <Moon />}
              {theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <NavLink to="/admin/users">
                <Settings /> Cài đặt
              </NavLink>
            </DropdownMenuItem>
            {user?.role === "admin" && (
              <DropdownMenuItem asChild>
                <NavLink to="/admin/users">
                  <Shield /> Quản lý người dùng
                </NavLink>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut /> Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
