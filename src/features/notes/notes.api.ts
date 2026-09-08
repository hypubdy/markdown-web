import { apiRequest } from "@/lib/api-client";
import { authToken } from "@/lib/auth-token";
import type {
  CreateNoteBody,
  Note,
  NoteListItem,
  NoteListParams,
  SafeNote,
  ShareResult,
  UpdateNoteBody,
} from "@/types";

const PATH = "/api/v1/notes";

const token = () => authToken.get();

/** Query dùng chung cho danh sách/trash — loại bỏ giá trị rỗng */
function cleanQuery(q: NoteListParams) {
  return {
    q: q.q?.trim() || undefined,
    status: q.status,
    tag: q.tag?.trim() || undefined,
    page: q.page,
    limit: q.limit,
  };
}

export const notesApi = {
  /** POST /notes — tạo note */
  create(body: CreateNoteBody): Promise<SafeNote> {
    return apiRequest<SafeNote>(PATH, { method: "POST", token: token(), body });
  },

  /** GET /notes — danh sách note SỐNG của mình (backend trả mảng phẳng) */
  list(params: NoteListParams = {}): Promise<NoteListItem[]> {
    return apiRequest<NoteListItem[]>(PATH, {
      token: token(),
      query: cleanQuery(params),
    });
  },

  /** GET /notes/:id — chi tiết note */
  byId(id: string): Promise<SafeNote> {
    return apiRequest<SafeNote>(`${PATH}/${id}`, { token: token() });
  },

  /** GET /notes/:id/raw — nội dung markdown thuần (text/markdown) */
  raw(id: string): Promise<string> {
    return apiRequest<string>(`${PATH}/${id}/raw`, { token: token(), raw: true });
  },

  /** PATCH /notes/:id — sửa một phần */
  update(id: string, body: UpdateNoteBody): Promise<SafeNote> {
    return apiRequest<SafeNote>(`${PATH}/${id}`, {
      method: "PATCH",
      token: token(),
      body,
    });
  },

  /** DELETE /notes/:id — soft-delete (vào thùng rác) */
  softDelete(id: string): Promise<void> {
    return apiRequest<void>(`${PATH}/${id}`, { method: "DELETE", token: token() });
  },
};

export const trashApi = {
  /** GET /notes/trash — danh sách note đã soft-delete */
  list(): Promise<NoteListItem[]> {
    return apiRequest<NoteListItem[]>(`${PATH}/trash`, { token: token() });
  },

  /** POST /notes/trash/:id/restore — khôi phục */
  restore(id: string): Promise<SafeNote> {
    return apiRequest<SafeNote>(`${PATH}/trash/${id}/restore`, {
      method: "POST",
      token: token(),
    });
  },

  /** DELETE /notes/trash/:id — xoá HẲN */
  hardDelete(id: string): Promise<void> {
    return apiRequest<void>(`${PATH}/trash/${id}`, {
      method: "DELETE",
      token: token(),
    });
  },
};

export const shareApi = {
  /** POST /notes/:id/share — bật public share */
  enable(id: string): Promise<ShareResult> {
    return apiRequest<ShareResult>(`${PATH}/${id}/share`, {
      method: "POST",
      token: token(),
    });
  },

  /** DELETE /notes/:id/share — thu hồi share */
  disable(id: string): Promise<{ shareToken: null }> {
    return apiRequest<{ shareToken: null }>(`${PATH}/${id}/share`, {
      method: "DELETE",
      token: token(),
    });
  },
};

/** Loại Note để làm mẫu kiểu dữ liệu nội bộ (giữ import để tree-shake vẫn rõ ràng) */
export type { Note };
