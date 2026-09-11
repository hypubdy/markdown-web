import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUsers, useUserStats } from "@/features/users/users-hooks";
import { usersApi } from "@/features/users/users.api";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Search, Trash2, Shield } from "lucide-react";
import type { UserRole } from "@/types";

export function AdminUsersPage() {
  const [q, setQ] = useState("");
  const queryClient = useQueryClient();
  const { data: stats } = useUserStats();
  const { data: users, isLoading } = useUsers({ q: q || undefined });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      usersApi.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", "stats"] });
      toast.success("Đã cập nhật vai trò");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", "stats"] });
      toast.success("Đã xoá người dùng");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell
      title="Người dùng"
      subtitle="Quản trị — chỉ dành cho admin"
      tabs={[
        { value: "list", label: "Danh sách" },
        { value: "stats", label: "Thống kê" },
      ]}
      tabValue="list"
    >
      <div className="mx-auto max-w-3xl space-y-4">
        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Tổng người dùng" value={stats?.total ?? "—"} />
          <StatCard label="Admin" value={stats?.admins ?? "—"} />
          <StatCard label="Người dùng thường" value={stats?.users ?? "—"} />
        </div>

        {/* Filter */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên / email…"
            className="pl-8"
          />
        </div>

        {/* List */}
        <div className="space-y-2">
          {isLoading && <Skeleton className="h-16 w-full" />}
          {(users ?? []).map((u) => (
            <div
              key={u.id}
              className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar>
                  <AvatarFallback>{u.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{u.name}</p>
                    <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                      {u.role === "admin" ? "Admin" : "User"}
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {u.email} · {formatDate(u.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 justify-end gap-2">
                <Select
                  value={u.role}
                  onValueChange={(v) =>
                    updateRole.mutate({ id: u.id, role: v as UserRole })
                  }
                >
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => remove.mutate(u.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          Lưu ý: bạn không thể xoá chính mình.
        </p>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
