import { authToken } from "@/lib/auth-token";
import { seedDb, getDb, makeUser, type MockUser } from "@/test/mocks/db";

/**
 * FIxture dùng chung cho test — mirror `prepare()` của backend:
 * mở một owner (admin/user) trong DB mock + ký session đúng id của owner đó.
 * Idempotent: chỉ seed khi DB chưa có user; không xoá notes/tags của test.
 */

export interface OwnerSession {
  id: string;
  email: string;
  role: "admin" | "user";
}

export function makeOwnerSession(options: { role?: "admin" | "user"; email?: string } = {}): OwnerSession {
  const role = options.role ?? "user";
  if (getDb().users.length === 0) seedDb();

  let owner = getDb().users.find((u) => u.role === role);
  if (!owner) {
    owner = makeUser({
      email: options.email ?? `owner-${Date.now()}@example.com`,
      role,
    });
    getDb().users.push(owner);
  }
  authToken.set(`mock:${role}:${owner.id}`);
  return { id: owner.id, email: owner.email, role };
}

/** Xoá session (đăng xuất) */
export function clearOwnerSession(): void {
  authToken.clear();
}

export type { MockUser };
