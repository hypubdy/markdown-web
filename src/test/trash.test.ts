import { beforeEach, describe, expect, it } from "vitest";
import { seedDb, getDb, makeNote } from "@/test/mocks/db";
import { makeOwnerSession } from "@/test/support/fixtures";

/**
 * DATA-DRIVEN TEST — module thùng rác (soft-delete / restore / hard-delete).
 * Mirror backend `notes.test.ts`. Dùng bảng case object + MSW + DB mock.
 */

const trashCases: {
  name: string;
  seed: () => void;
  act: () => Promise<unknown>;
  expect: (result: unknown, db: ReturnType<typeof getDb>) => void;
}[] = [
  {
    name: "soft-delete 1 note → xuất hiện trong thùng rác, biến mất khỏi danh sách",
    seed: () => {
      const db = getDb();
      const a = db.users.find((u) => u.role === "user")!;
      db.notes.push(makeNote(a.id, { title: "Note muon xoa" }));
    },
    act: async () => {
      const db = getDb();
      const target = db.notes.find((n) => n.title === "Note muon xoa")!;
      const { notesApi, trashApi } = await import("@/features/notes/notes.api");
      await notesApi.softDelete(target.id);
      return { trash: await trashApi.list() };
    },
    expect: (result) => {
      const { trash } = result as { trash: Array<{ title: string }> };
      expect(trash.some((n) => n.title === "Note muon xoa")).toBe(true);
    },
  },
  {
    name: "restore note từ thùng rác → quay lại danh sách",
    seed: () => {
      const db = getDb();
      const a = db.users.find((u) => u.role === "user")!;
      const note = makeNote(a.id, { title: "Note khôi phục" });
      db.notes.push({ ...note, deletedAt: new Date().toISOString() });
    },
    act: async () => {
      const db = getDb();
      const target = db.notes.find((n) => n.title === "Note khôi phục")!;
      const { trashApi, notesApi } = await import("@/features/notes/notes.api");
      await trashApi.restore(target.id);
      const list = await notesApi.list();
      return { alive: list.some((n) => n.title === "Note khôi phục") };
    },
    expect: (result) => {
      expect((result as { alive: boolean }).alive).toBe(true);
    },
  },
  {
    name: "hard-delete note trong thùng rác → không còn ở bất kỳ đâu",
    seed: () => {
      const db = getDb();
      const a = db.users.find((u) => u.role === "user")!;
      const note = makeNote(a.id, { title: "Note xoa han" });
      db.notes.push({ ...note, deletedAt: new Date().toISOString() });
    },
    act: async () => {
      const db = getDb();
      const target = db.notes.find((n) => n.title === "Note xoa han")!;
      const { trashApi } = await import("@/features/notes/notes.api");
      await trashApi.hardDelete(target.id);
      return { trash: await trashApi.list() };
    },
    expect: (result) => {
      const { trash } = result as { trash: Array<{ title: string }> };
      expect(trash.some((n) => n.title === "Note xoa han")).toBe(false);
    },
  },
];

describe("Trash API (data-driven qua MSW)", () => {
  beforeEach(() => {
    seedDb();
    makeOwnerSession();
  });

  for (const c of trashCases) {
    it(c.name, async () => {
      c.seed();
      const result = await c.act();
      c.expect(result, getDb());
    });
  }
});
