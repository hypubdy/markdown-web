import { beforeEach, describe, expect, it } from "vitest";
import { seedDb, getDb, makeUser } from "@/test/mocks/db";
import { makeOwnerSession } from "@/test/support/fixtures";

/**
 * DATA-DRIVEN TEST — module admin users (stats / role / xoá user).
 * Mirror backend `tests/app.test.ts`. Bảng case object + MSW + DB mock.
 */

const adminCases: {
  name: string;
  role: "admin" | "user";
  seed: () => void;
  act: () => Promise<unknown>;
  expect: (result: unknown, db: ReturnType<typeof getDb>) => void;
}[] = [
  {
    name: "admin xem stats → tổng đúng số user trong DB",
    role: "admin",
    seed: () => {
      seedDb();
    },
    act: async () => {
      const { usersApi } = await import("@/features/users/users.api");
      return usersApi.stats();
    },
    expect: (result) => {
      const stats = result as { total: number; admins: number; users: number };
      expect(stats.total).toBe(getDb().users.length);
      expect(stats.admins + stats.users).toBe(stats.total);
    },
  },
  {
    name: "user thường gọi stats → 403 (không phải admin)",
    role: "user",
    seed: () => {
      seedDb();
    },
    act: async () => {
      const { usersApi } = await import("@/features/users/users.api");
      try {
        await usersApi.stats();
        return { status: 0 }; // không lỗi → fail
      } catch (e) {
        return { status: (e as { status: number }).status };
      }
    },
    expect: (result) => {
      expect((result as { status: number }).status).toBe(403);
    },
  },
  {
    name: "admin đổi role user → admin, stats.admins tăng",
    role: "admin",
    seed: () => {
      const db = getDb();
      const victim = makeUser({ name: "Nạn Nhân", email: "victim@example.com" });
      db.users.push(victim);
    },
    act: async () => {
      const { usersApi } = await import("@/features/users/users.api");
      const db = getDb();
      const victim = db.users.find((u) => u.email === "victim@example.com")!;
      await usersApi.updateRole(victim.id, "admin");
      return usersApi.stats();
    },
    expect: (result) => {
      const stats = result as { admins: number };
      expect(stats.admins).toBe(2); // admin seed + victim giờ làm admin
    },
  },
  {
    name: "admin xoá user → list không còn user đó",
    role: "admin",
    seed: () => {
      const db = getDb();
      const victim = makeUser({ name: "Bị Xoá", email: "xoa@example.com" });
      db.users.push(victim);
    },
    act: async () => {
      const { usersApi } = await import("@/features/users/users.api");
      const db = getDb();
      const victim = db.users.find((u) => u.email === "xoa@example.com")!;
      await usersApi.remove(victim.id);
      return usersApi.list();
    },
    expect: (result) => {
      const list = result as Array<{ email: string }>;
      expect(list.some((u) => u.email === "xoa@example.com")).toBe(false);
    },
  },
];

describe("Admin users API (data-driven qua MSW)", () => {
  beforeEach(() => {
    seedDb();
  });

  for (const c of adminCases) {
    it(c.name, async () => {
      c.seed();
      makeOwnerSession({ role: c.role });
      const result = await c.act();
      c.expect(result, getDb());
    });
  }
});
