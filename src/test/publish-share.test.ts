import { beforeEach, describe, expect, it } from "vitest";
import { seedDb, getDb, makeNote } from "@/test/mocks/db";
import { makeOwnerSession } from "@/test/support/fixtures";

/**
 * DATA-DRIVEN TEST — module publish & public share.
 * Backend hỗ trợ: PATCH status (draft/published) + POST/DELETE share + GET public.
 * Kiểm tra client qua MSW + DB mock (bảng case object).
 */

const cases: {
  name: string;
  seed: () => void;
  act: () => Promise<unknown>;
  expect: (result: unknown) => void;
}[] = [
  {
    name: "publish note → status published; unpublish → draft",
    seed: () => {
      const db = getDb();
      const a = db.users.find((u) => u.role === "user")!;
      db.notes.push(makeNote(a.id, { title: "Note publish", status: "draft" }));
    },
    act: async () => {
      const db = getDb();
      const note = db.notes.find((n) => n.title === "Note publish")!;
      const { notesApi } = await import("@/features/notes/notes.api");
      const published = await notesApi.update(note.id, { status: "published" });
      const back = await notesApi.update(note.id, { status: "draft" });
      return { published: published.status, back: back.status };
    },
    expect: (result) => {
      const r = result as { published: string; back: string };
      expect(r.published).toBe("published");
      expect(r.back).toBe("draft");
    },
  },
  {
    name: "enable share → trả shareToken + url; public xem được không cần đăng nhập",
    seed: () => {
      const db = getDb();
      const a = db.users.find((u) => u.role === "user")!;
      db.notes.push(makeNote(a.id, { title: "Note share", status: "published" }));
    },
    act: async () => {
      const db = getDb();
      const note = db.notes.find((n) => n.title === "Note share")!;
      const { shareApi, notesApi } = await import("@/features/notes/notes.api");
      const { publicApi } = await import("@/features/public/public.api");

      const r = await shareApi.enable(note.id);
      const refreshed = await notesApi.byId(note.id);
      // Gọi public endpoint không cần token → mô phỏng qua publicApi (không gắn token)
      const pub = await publicApi.note(r.shareToken);
      return {
        shareToken: r.shareToken,
        url: r.url,
        noteShare: refreshed.shareToken,
        pubType: typeof pub.title,
      };
    },
    expect: (result) => {
      const r = result as { shareToken: string; url: string; noteShare: string; pubType: string };
      expect(r.shareToken).toBeTruthy();
      expect(r.url).toContain("/public/notes/");
      expect(r.noteShare).toBe(r.shareToken);
      expect(r.pubType).toBe("string");
    },
  },
  {
    name: "revoke share → shareToken null, public không còn xem được",
    seed: () => {
      const db = getDb();
      const a = db.users.find((u) => u.role === "user")!;
      db.notes.push(makeNote(a.id, { title: "Note revoke", status: "published" }));
    },
    act: async () => {
      const db = getDb();
      const note = db.notes.find((n) => n.title === "Note revoke")!;
      const { shareApi, notesApi } = await import("@/features/notes/notes.api");
      const { publicApi } = await import("@/features/public/public.api");

      const r = await shareApi.enable(note.id);
      await shareApi.disable(note.id);
      const refreshed = await notesApi.byId(note.id);

      // public endpoint giờ phải lỗi 404
      let publicStatus = 0;
      try {
        await publicApi.note(r.shareToken);
      } catch (e) {
        publicStatus = (e as { status: number }).status;
      }
      return { revokedToken: refreshed.shareToken, publicStatus };
    },
    expect: (result) => {
      const r = result as { revokedToken: null; publicStatus: number };
      expect(r.revokedToken).toBeNull();
      expect(r.publicStatus).toBe(404);
    },
  },
];

describe("Publish & Public share API (data-driven qua MSW)", () => {
  beforeEach(() => {
    seedDb();
    makeOwnerSession();
  });

  for (const c of cases) {
    it(c.name, async () => {
      c.seed();
      const result = await c.act();
      c.expect(result);
    });
  }
});
