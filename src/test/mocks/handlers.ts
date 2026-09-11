import { http, HttpResponse } from "msw";
import {
  getDb,
  seedDb,
  findUserByEmail,
  findUserById,
  findNoteById,
  findNoteByShareToken,
  noteTags,
  toSafeNote,
  listTagsWithCount,
  makeNote,
  randomUuidTagId,
} from "./db";
import type { Note, NoteStatus } from "@/types";
import type { MockUser } from "./db";

/** Envelope chuẩn backend */
const ok = (data?: unknown, message?: string) =>
  HttpResponse.json({ success: true, message, data });
const fail = (status: number, message: string, details?: unknown[]) =>
  HttpResponse.json({ success: false, message, details }, { status });

const nowIso = () => new Date().toISOString();

/** Giải mã JWT giả lập: token = "mock:<role>:<id>" — tiện cho test */
function parseAuth(req: Request): { id: string; role: string } | null {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const m = /^mock:(admin|user):(.+)$/.exec(token);
  if (!m) return null;
  return { role: m[1], id: m[2] };
}

function bearer(userId: string, role: string) {
  return `mock:${role}:${userId}`;
}

export const handlers = [
  // ── health ────────────────────────────────────────────────
  http.get("/api/v1/health", () => ok({ status: "ok", time: nowIso() })),

  // ── auth ──────────────────────────────────────────────────
  http.post("/api/v1/auth/login", async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    const user = findUserByEmail(body?.email ?? "");
    if (!user || user.password !== body?.password) {
      return fail(401, "Email hoặc mật khẩu không đúng");
    }
    const { password: _p, ...safe } = user;
    return ok({ token: bearer(user.id, user.role), user: safe });
  }),

  http.post("/api/v1/auth/register", async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      email: string;
      password: string;
    };
    if (findUserByEmail(body?.email ?? "")) {
      return fail(409, "Email này đã được đăng ký");
    }
    const db = getDb();
    const user: MockUser = {
      id: crypto.randomUUID(),
      name: body?.name ?? "",
      email: body?.email ?? "",
      password: body?.password ?? "",
      role: "user",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.users.push(user);
    const { password: _p, ...safe } = user;
    return ok({ token: bearer(user.id, user.role), user: safe });
  }),

  // ── users ─────────────────────────────────────────────────
  http.get("/api/v1/users/me", ({ request }) => {
    const auth = parseAuth(request);
    if (!auth) return fail(401, "Chưa đăng nhập");
    const user = findUserById(auth.id);
    if (!user) return fail(404, "Không tìm thấy người dùng");
    const { password: _p, ...safe } = user;
    return ok(safe);
  }),

  http.get("/api/v1/users/stats", ({ request }) => {
    const auth = parseAuth(request);
    if (!auth) return fail(401, "Chưa đăng nhập");
    if (auth.role !== "admin") return fail(403, "Không đủ quyền");
    const db = getDb();
    return ok({
      total: db.users.length,
      admins: db.users.filter((u) => u.role === "admin").length,
      users: db.users.filter((u) => u.role !== "admin").length,
    });
  }),

  http.get("/api/v1/users", ({ request }) => {
    const auth = parseAuth(request);
    if (!auth) return fail(401, "Chưa đăng nhập");
    if (auth.role !== "admin") return fail(403, "Không đủ quyền");
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.toLowerCase() ?? "";
    const role = url.searchParams.get("role");
    const rows = getDb()
      .users.filter((u) => (role ? u.role === role : true))
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .map(({ password: _p, ...safe }) => safe);
    return ok(rows);
  }),

  http.patch("/api/v1/users/:id/role", async ({ request, params }) => {
    const auth = parseAuth(request);
    if (!auth) return fail(401, "Chưa đăng nhập");
    if (auth.role !== "admin") return fail(403, "Không đủ quyền");
    const user = findUserById(params.id as string);
    if (!user) return fail(404, "Không tìm thấy người dùng");
    const body = (await request.json()) as { role: string };
    if (body.role === "admin" || body.role === "user") user.role = body.role;
    user.updatedAt = nowIso();
    return ok({ ...user });
  }),

  http.delete("/api/v1/users/:id", ({ request, params }) => {
    const auth = parseAuth(request);
    if (!auth) return fail(401, "Chưa đăng nhập");
    if (auth.role !== "admin") return fail(403, "Không đủ quyền");
    const id = params.id as string;
    if (id === auth.id) return fail(400, "Không thể tự xoá tài khoản của chính mình");
    const db = getDb();
    db.users = db.users.filter((u) => u.id !== id);
    return new HttpResponse(null, { status: 204 });
  }),

  // ── notes ─────────────────────────────────────────────────
  http.post("/api/v1/notes", async ({ request }) => {
    const auth = parseAuth(request);
    if (!auth) return fail(401, "Chưa đăng nhập");
    const body = (await request.json()) as {
      title: string;
      content?: string;
      status?: NoteStatus;
      tagNames?: string[];
    };
    // Giống backend notes.schemas.ts: title bắt buộc ≥ 1 ký tự
    if (!body?.title?.trim()) {
      return fail(400, "Tiêu đề không được để trống", [{ field: "body.title" }]);
    }
    const db = getDb();
    const note = makeNote(auth.id, {
      title: body?.title ?? "",
      content: body?.content ?? "",
      status: body?.status ?? "draft",
    });
    db.notes.push(note);
    if (body?.tagNames?.length) {
      for (const name of body.tagNames) {
        const tag = db.tags.find((t) => t.ownerId === auth.id && t.name === name);
        const tagId = tag ? tag.id : randomUuidTagId();
        if (!tag) db.tags.push({ id: tagId, ownerId: auth.id, name });
        db.noteTags.push({ noteId: note.id, tagId });
      }
    }
    return ok(toSafeNote(note), "Đã tạo ghi chú");
  }),

  http.get("/api/v1/notes", ({ request }) => {
    const auth = parseAuth(request);
    if (!auth) return fail(401, "Chưa đăng nhập");
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.toLowerCase() ?? "";
    const status = url.searchParams.get("status");
    const tag = url.searchParams.get("tag");
    const rows = getDb()
      .notes.filter(
        (n) =>
          n.ownerId === auth.id &&
          !n.deletedAt &&
          (!status || n.status === status) &&
          (!tag || noteTags(n.id).includes(tag)) &&
          (!q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)),
      )
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .map((n) => ({
        id: n.id,
        title: n.title,
        status: n.status,
        tags: noteTags(n.id),
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      }));
    return ok(rows);
  }),

  http.get("/api/v1/notes/trash", ({ request }) => {
    const auth = parseAuth(request);
    if (!auth) return fail(401, "Chưa đăng nhập");
    const rows = getDb()
      .notes.filter((n) => n.ownerId === auth.id && n.deletedAt)
      .map((n) => ({
        id: n.id,
        title: n.title,
        status: n.status,
        tags: noteTags(n.id),
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      }));
    return ok(rows);
  }),

  http.get("/api/v1/notes/:id", ({ request, params }) => {
    const auth = parseAuth(request);
    if (!auth) return fail(401, "Chưa đăng nhập");
    const note = findNoteById(params.id as string);
    if (!note || note.ownerId !== auth.id || note.deletedAt) {
      return fail(404, "Không tìm thấy ghi chú");
    }
    return ok(toSafeNote(note));
  }),

  http.get("/api/v1/notes/:id/raw", ({ request, params }) => {
    const auth = parseAuth(request);
    if (!auth) return fail(401, "Chưa đăng nhập");
    const note = findNoteById(params.id as string);
    if (!note || note.ownerId !== auth.id || note.deletedAt) {
      return fail(404, "Không tìm thấy ghi chú");
    }
    return new HttpResponse(note.content, {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }),

  http.patch("/api/v1/notes/:id", async ({ request, params }) => {
    const auth = parseAuth(request);
    if (!auth) return fail(401, "Chưa đăng nhập");
    const note = findNoteById(params.id as string);
    if (!note || note.ownerId !== auth.id || note.deletedAt) {
      return fail(404, "Không tìm thấy ghi chú");
    }
    const body = (await request.json()) as Partial<Note> & { tagNames?: string[] };
    if (body.title !== undefined) note.title = body.title;
    if (body.content !== undefined) note.content = body.content;
    if (body.status !== undefined) note.status = body.status;
    if (body.tagNames !== undefined) {
      const db = getDb();
      const names = Array.from(new Set(body.tagNames.map((name) => name.trim()).filter(Boolean)));
      db.noteTags = db.noteTags.filter((link) => link.noteId !== note.id);
      for (const name of names) {
        let tag = db.tags.find((item) => item.ownerId === auth.id && item.name === name);
        if (!tag) {
          tag = { id: randomUuidTagId(), ownerId: auth.id, name };
          db.tags.push(tag);
        }
        db.noteTags.push({ noteId: note.id, tagId: tag.id });
      }
    }
    note.updatedAt = nowIso();
    return ok(toSafeNote(note), "Đã cập nhật ghi chú");
  }),

  http.delete("/api/v1/notes/:id", ({ request, params }) => {
    const auth = parseAuth(request);
    if (!auth) return fail(401, "Chưa đăng nhập");
    const note = findNoteById(params.id as string);
    if (!note || note.ownerId !== auth.id || note.deletedAt) {
      return fail(404, "Không tìm thấy ghi chú");
    }
    note.deletedAt = nowIso();
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("/api/v1/notes/trash/:id/restore", ({ request, params }) => {
    const auth = parseAuth(request);
    if (!auth) return fail(401, "Chưa đăng nhập");
    const note = findNoteById(params.id as string);
    if (!note || note.ownerId !== auth.id || !note.deletedAt) {
      return fail(404, "Không tìm thấy ghi chú trong thùng rác");
    }
    note.deletedAt = null;
    note.updatedAt = nowIso();
    return ok(toSafeNote(note), "Đã khôi phục ghi chú");
  }),

  http.delete("/api/v1/notes/trash/:id", ({ request, params }) => {
    const auth = parseAuth(request);
    if (!auth) return fail(401, "Chưa đăng nhập");
    const db = getDb();
    const note = findNoteById(params.id as string);
    if (!note || note.ownerId !== auth.id || !note.deletedAt) {
      return fail(404, "Không tìm thấy ghi chú trong thùng rác");
    }
    db.notes = db.notes.filter((n) => n.id !== note.id);
    db.noteTags = db.noteTags.filter((nt) => nt.noteId !== note.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("/api/v1/notes/:id/share", ({ request, params }) => {
    const auth = parseAuth(request);
    if (!auth) return fail(401, "Chưa đăng nhập");
    const note = findNoteById(params.id as string);
    if (!note || note.ownerId !== auth.id || note.deletedAt) {
      return fail(404, "Không tìm thấy ghi chú");
    }
    const shareToken = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    note.shareToken = shareToken;
    return ok({ shareToken, url: `/public/notes/${shareToken}` });
  }),

  http.delete("/api/v1/notes/:id/share", ({ request, params }) => {
    const auth = parseAuth(request);
    if (!auth) return fail(401, "Chưa đăng nhập");
    const note = findNoteById(params.id as string);
    if (!note || note.ownerId !== auth.id || note.deletedAt) {
      return fail(404, "Không tìm thấy ghi chú");
    }
    note.shareToken = null;
    return ok({ shareToken: null });
  }),

  // ── tags ──────────────────────────────────────────────────
  http.get("/api/v1/tags", ({ request }) => {
    const auth = parseAuth(request);
    if (!auth) return fail(401, "Chưa đăng nhập");
    return ok(listTagsWithCount(auth.id));
  }),

  http.delete("/api/v1/tags/:name", ({ request, params }) => {
    const auth = parseAuth(request);
    if (!auth) return fail(401, "Chưa đăng nhập");
    const name = decodeURIComponent(params.name as string);
    const db = getDb();
    const tag = db.tags.find((t) => t.ownerId === auth.id && t.name === name);
    if (!tag) return fail(404, "Không tìm thấy tag");
    const tagId = tag.id;
    db.tags = db.tags.filter((t) => t.id !== tagId);
    db.noteTags = db.noteTags.filter((nt) => nt.tagId !== tagId);
    return new HttpResponse(null, { status: 204 });
  }),

  // ── public ────────────────────────────────────────────────
  http.get("/api/v1/public/notes/:shareToken", ({ params }) => {
    const note = findNoteByShareToken(params.shareToken as string);
    if (!note || note.deletedAt) return fail(404, "Không tìm thấy ghi chú");
    return ok({ id: note.id, title: note.title, content: note.content, updatedAt: note.updatedAt });
  }),
];

/** Tiện ích khác: export seedDb để test gọi lại */
export { seedDb };
