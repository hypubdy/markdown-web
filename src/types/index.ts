/**
 * Kiểu dữ liệu phía client — phản ánh đúng hợp đồng API của backend `markdown-api`.
 * Mọi response của backend có dạng chuẩn:
 *   { success: true, data: ... }                (thành công)
 *   { success: false, message: string, details?: [...] }  (lỗi)
 */

export type UserRole = "admin" | "user";
export type NoteStatus = "draft" | "published";

/** User an toàn (không bao giờ có passwordHash) */
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/** Payload JWT gắn vào req.user */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: SafeUser;
}

/** Hồ sơ công khai gọn nhẹ (không lộ email) */
export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface UserStats {
  total: number;
  admins: number;
  users: number;
}

/** Một note đầy đủ (kèm mảng tags) */
export interface Note {
  id: string;
  ownerId: string;
  title: string;
  content: string;
  status: NoteStatus;
  deletedAt: string | null;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Note kèm tags (backend gửi `Note & { tags: string[] }`) */
export type SafeNote = Note & { tags: string[] };

/** Dạng gọn cho danh sách note (KHÔNG content) */
export interface NoteListItem {
  id: string;
  title: string;
  status: NoteStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NoteListParams {
  q?: string;
  status?: NoteStatus;
  tag?: string;
  page?: number;
  limit?: number;
}

export interface NoteListResult {
  items: NoteListItem[];
  total: number;
}

export interface CreateNoteBody {
  title: string;
  content?: string;
  status?: NoteStatus;
  tagNames?: string[];
}

export interface UpdateNoteBody {
  title?: string;
  content?: string;
  status?: NoteStatus;
  tagNames?: string[];
}

export interface ShareResult {
  shareToken: string;
  url: string;
}

/** Note public (xem không cần đăng nhập) */
export interface PublicNote {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface TagCount {
  name: string;
  count: number;
}

/** Chi tiết lỗi validate (mảng các object dạng { field?, message? }) */
export interface ApiErrorDetail {
  field?: string;
  message?: string;
}

/** Envelope chuẩn của backend */
export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  details?: ApiErrorDetail[];
}
