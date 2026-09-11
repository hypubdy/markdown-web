/**
 * Cơ sở dữ liệu trong-memory cho MSW mock — phản ánh hành vi backend `markdown-api`.
 * Mỗi suite test có thể gọi `seedDb()` để chuẩn hoá dữ liệu trước khi chạy case.
 */
import { randomUUID } from "node:crypto";
import type {
  SafeUser,
  Note,
  NoteStatus,
  SafeNote,
  TagCount,
  UserRole,
} from "@/types";

export interface MockUser extends SafeUser {
  password: string;
}

export interface MockTag {
  id: string;
  ownerId: string;
  name: string;
}

export interface MockNoteTag {
  noteId: string;
  tagId: string;
}

export type MockNote = Note;

export interface MockDb {
  users: MockUser[];
  notes: MockNote[];
  tags: MockTag[];
  noteTags: MockNoteTag[];
}

let db: MockDb = {
  users: [],
  notes: [],
  tags: [],
  noteTags: [],
};

const nowIso = () => new Date().toISOString();

export function makeUser(overrides: Partial<MockUser> = {}): MockUser {
  const createdAt = nowIso();
  return {
    id: randomUUID(),
    name: "Người dùng",
    email: `${Date.now()}-u@example.com`,
    password: "matkhau123",
    role: "user",
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

export function makeNote(
  ownerId: string,
  overrides: Partial<MockNote> = {},
): MockNote {
  const createdAt = nowIso();
  return {
    id: randomUUID(),
    ownerId,
    title: "Ghi chú mới",
    content: "",
    status: "draft",
    deletedAt: null,
    shareToken: null,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

/** Seed dữ liệu chuẩn: chỉ users (admin + user A) — không notes/tags.
 *  Note/tag do từng test tự tạo qua API (MSW) để cô lập & xác định. */
export function seedDb(): MockDb {
  db = {
    users: [],
    notes: [],
    tags: [],
    noteTags: [],
  };

  const admin = makeUser({
    name: "Quản Trị",
    email: "admin@example.com",
    password: "admin123",
    role: "admin",
  });
  const user = makeUser({ name: "User A", email: "user@example.com" });

  db.users = [admin, user];

  return db;
}

export function getDb(): MockDb {
  return db;
}

/** Xoá sạch dữ liệu sau mỗi case khi cần cô lập */
export function resetDb(): void {
  db = { users: [], notes: [], tags: [], noteTags: [] };
}

export function findUserByEmail(email: string): MockUser | undefined {
  return db.users.find((u) => u.email === email);
}

export function findUserById(id: string): MockUser | undefined {
  return db.users.find((u) => u.id === id);
}

export function findNoteById(id: string): MockNote | undefined {
  return db.notes.find((n) => n.id === id);
}

export function findNoteByShareToken(token: string): MockNote | undefined {
  return db.notes.find((n) => n.shareToken === token);
}

export function noteTags(noteId: string): string[] {
  return db.noteTags
    .filter((nt) => nt.noteId === noteId)
    .map((nt) => db.tags.find((t) => t.id === nt.tagId)?.name ?? "")
    .filter(Boolean)
    .sort();
}

export function toSafeNote(note: MockNote, tags: string[] = noteTags(note.id)): SafeNote {
  return { ...note, tags };
}

export function listTagsWithCount(ownerId: string): TagCount[] {
  const map = new Map<string, number>();
  // A tag is independent from its note links. Detaching the last link must
  // not delete the tag; DELETE /tags/:name is the explicit delete operation.
  for (const tag of db.tags) {
    if (tag.ownerId === ownerId) map.set(tag.name, 0);
  }
  for (const nt of db.noteTags) {
    const tag = db.tags.find((t) => t.id === nt.tagId);
    if (!tag || tag.ownerId !== ownerId) continue;
    const note = db.notes.find((n) => n.id === nt.noteId);
    if (!note || note.deletedAt) continue;
    map.set(tag.name, (map.get(tag.name) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function tagsForOwner(ownerId: string): MockTag[] {
  return db.tags.filter((t) => t.ownerId === ownerId);
}

export function statusOf(note: MockNote): NoteStatus {
  return note.status;
}

export function roleOf(user: MockUser): UserRole {
  return user.role;
}

/** Sinh id cho tag (đơn giản, dùng cho mock) */
export function randomUuidTagId(): string {
  return randomUUID();
}
