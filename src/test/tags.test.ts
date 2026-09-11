import { beforeEach, describe, expect, it } from "vitest";
import { getDb, seedDb } from "@/test/mocks/db";
import { makeOwnerSession } from "@/test/support/fixtures";
import type { TagCount } from "@/types";

/**
 * DATA-DRIVEN TEST — module tags (mirror backend `tests/notes.test.ts` phần tags).
 * Bảng case OBJECT; dữ liệu tạo qua API thật (MSW) để kiểm chứng count/ownership.
 */

interface TagsCase {
  name: string;
  /** chuẩn bị dữ liệu note+tag trước case */
  before?: () => Promise<void>;
  act: () => Promise<unknown>;
  expect: (result: unknown) => void;
}

const tagsCases: TagsCase[] = [
  {
    name: "tạo note kèm 2 tag → list tags trả đúng count 1 cho mỗi tag",
    before: async () => {
      const { notesApi } = await import("@/features/notes/notes.api");
      await notesApi.create({
        title: "Học Markdown",
        content: "# md",
        tagNames: ["markdown", "hoc"],
      });
    },
    act: async () => {
      const { tagsApi } = await import("@/features/tags/tags.api");
      return tagsApi.list();
    },
    expect: (result) => {
      const tags = result as TagCount[];
      expect(tags).toEqual(
        expect.arrayContaining([
          { name: "markdown", count: 1 },
          { name: "hoc", count: 1 },
        ]),
      );
    },
  },
  {
    name: "xoá tag của chủ khác / không tồn tại → 404",
    before: async () => {
      /* không có gì */
    },
    act: async () => {
      const { tagsApi } = await import("@/features/tags/tags.api");
      try {
        await tagsApi.remove("khong-ton-tai");
        return { status: 0 };
      } catch (e) {
        return { status: (e as { status: number }).status };
      }
    },
    expect: (result) => {
      expect((result as { status: number }).status).toBe(404);
    },
  },
  {
    name: "xoá tag của mình → 204, tag không còn trong list",
    before: async () => {
      const { notesApi } = await import("@/features/notes/notes.api");
      await notesApi.create({
        title: "Note tag tam",
        content: "",
        tagNames: ["can-xoa"],
      });
    },
    act: async () => {
      const { tagsApi } = await import("@/features/tags/tags.api");
      await tagsApi.remove("can-xoa");
      return tagsApi.list();
    },
    expect: (result) => {
      const tags = result as TagCount[];
      expect(tags.some((t) => t.name === "can-xoa")).toBe(false);
    },
  },
  {
    name: "gỡ tag khỏi một note → chỉ xoá liên kết, không xoá tag dùng ở note khác",
    before: async () => {
      const { notesApi } = await import("@/features/notes/notes.api");
      await notesApi.create({ title: "Note A", content: "", tagNames: ["giu-lai"] });
      await notesApi.create({ title: "Note B", content: "", tagNames: ["giu-lai"] });
    },
    act: async () => {
      const { notesApi } = await import("@/features/notes/notes.api");
      const { tagsApi } = await import("@/features/tags/tags.api");
      const notes = await notesApi.list();
      const noteA = notes.find((note) => note.title === "Note A");
      if (!noteA) throw new Error("Không tìm thấy Note A trong test");

      const updated = await notesApi.update(noteA.id, { tagNames: [] });
      const tags = await tagsApi.list();
      return { updated, tags };
    },
    expect: (result) => {
      const { updated, tags } = result as {
        updated: { tags: string[] };
        tags: TagCount[];
      };
      expect(updated.tags).toEqual([]);
      expect(tags).toContainEqual({ name: "giu-lai", count: 1 });
      expect(getDb().noteTags).toHaveLength(1);
      expect(getDb().tags.some((tag) => tag.name === "giu-lai")).toBe(true);
    },
  },
];

describe("Tags API (data-driven qua MSW)", () => {
  beforeEach(() => {
    seedDb();
    makeOwnerSession();
  });

  for (const c of tagsCases) {
    it(c.name, async () => {
      await c.before?.();
      const result = await c.act();
      c.expect(result);
    });
  }
});
