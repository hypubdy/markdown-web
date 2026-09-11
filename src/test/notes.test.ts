import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderTestApp } from "@/test/support/test-app";
import { seedDb, getDb, makeUser, makeNote } from "@/test/mocks/db";
import { makeOwnerSession } from "@/test/support/fixtures";

/**
 * DATA-DRIVEN TEST — module notes (mirror `tests/notes.test.ts` của backend).
 * Phần UI dùng bảng case OBJECT (Nguyên tắc giống `runCaseSuite` backend),
 * phần API kiểm tra client qua MSW với dữ liệu thật trong DB mock.
 */

// ── 1) UI: bảng case dạng object ──────────────────────────────────
interface NotesUiCase {
  name: string;
  route: string;
  signedIn?: boolean;
  act?: (user: ReturnType<typeof userEvent.setup>) => Promise<void>;
  expectText?: string;
  expectByRole?: { role: string; name: string };
  expectRole?: { role: string; name?: string; placeholder?: string };
  expectAbsent?: string;
}

const uiCases: NotesUiCase[] = [
  {
    name: "Chưa đăng nhập → vào / bị chuyển hướng về trang Đăng nhập",
    route: "/",
    expectByRole: { role: "button", name: "Đăng nhập" },
  },
  {
    name: "Đăng nhập admin → bấm 'Tạo ghi chú' mở editor soạn thảo",
    route: "/",
    signedIn: true,
    act: async (user) => {
      // đợi app load xong rồi bấm nút tạo (có 2 nút: toolbar + list — bấm cái đầu)
      const buttons = await screen.findAllByRole("button", { name: "Tạo ghi chú" });
      await user.click(buttons[0]);
    },
    expectRole: { role: "textbox", name: "", placeholder: "Tiêu đề ghi chú" },
  },
];

describe("UI luồng notes (bảng case object)", () => {
  beforeEach(() => {
    seedDb();
  });

  for (const c of uiCases) {
    it(c.name, async () => {
      const user = userEvent.setup();
      if (c.signedIn) makeOwnerSession({ role: "admin" });
      render(renderTestApp(c.route));
      // Đợi auth guard/resolve xong rồi mới act (async: me query qua MSW)
      await c.act?.(user);
      if (c.expectText)
        await waitFor(() => expect(screen.getByText(c.expectText!)).toBeTruthy());
      if (c.expectByRole)
        await waitFor(() =>
          expect(
            screen.getByRole(c.expectByRole!.role, { name: c.expectByRole!.name }),
          ).toBeTruthy(),
        );
      if (c.expectRole) {
        const rule = c.expectRole;
        const opts = { name: rule.name };
        if (rule.placeholder) {
          await waitFor(() =>
            expect(screen.getByPlaceholderText(rule.placeholder!)).toBeTruthy(),
          );
        } else {
          await waitFor(() =>
            expect(screen.getByRole(rule.role, opts)).toBeTruthy(),
          );
        }
      }
      if (c.expectAbsent)
        expect(screen.queryByText(c.expectAbsent)).toBeNull();
    });
  }

  it("note detail có thể chọn nhãn có sẵn rồi lưu", async () => {
    makeOwnerSession();
    const { notesApi } = await import("@/features/notes/notes.api");
    await notesApi.create({ title: "Note có nhãn", content: "", tagNames: ["nhan-co-san"] });
    const target = await notesApi.create({ title: "Note cần gắn nhãn", content: "" });
    const user = userEvent.setup();

    render(renderTestApp(`/notes/${target.id}`));

    const tagSelect = await screen.findByRole("combobox", { name: "Chọn nhãn có sẵn" });
    await user.selectOptions(tagSelect, "nhan-co-san");

    expect(screen.getByLabelText("Xoá tag nhan-co-san")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(async () => {
      const saved = await notesApi.byId(target.id);
      expect(saved.tags).toEqual(["nhan-co-san"]);
    });
  });
});

// ── 2) API client + MSW (dữ liệu thật trong DB mock) ───────────────
describe("Notes API (data-driven qua MSW)", () => {
  beforeEach(() => {
    seedDb();
  });

  it("tạo note kèm tag → trả note có tags, xuất hiện trong danh sách", async () => {
    makeOwnerSession();
    const { notesApi } = await import("@/features/notes/notes.api");

    const created = await notesApi.create({
      title: "Học Markdown",
      content: "# Tiêu đề",
      status: "published",
      tagNames: ["markdown", "hoc"],
    });

    expect(created.title).toBe("Học Markdown");
    expect(created.tags).toEqual(expect.arrayContaining(["hoc", "markdown"]));

    const list = await notesApi.list();
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe("Học Markdown");
    expect(list[0].tags).toContain("markdown");
  });

  it("note của chủ khác không lộ trong danh sách của mình", async () => {
    const { notesApi } = await import("@/features/notes/notes.api");
    makeOwnerSession();

    const db = getDb();
    const userB = makeUser({ name: "User B", email: "b@example.com" });
    db.users.push(userB);
    db.notes.push(makeNote(userB.id, { title: "Note cua B" }));

    const list = await notesApi.list();
    expect(list.every((n) => n.title !== "Note cua B")).toBe(true);
  });

  it("tạo note với title rỗng → backend trả 400 (không được phép)", async () => {
    makeOwnerSession();
    const { notesApi } = await import("@/features/notes/notes.api");
    const { ApiError } = await import("@/lib/api-client");
    await expect(
      notesApi.create({ title: "", content: "abc" }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
