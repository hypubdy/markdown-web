# SLICE SPEC — Phase 3: Notes CRUD + Editor Markdown (Frontend)

> Nguồn: `docs/FE-PLAN.md` — mục 4 (API) & mục 6 (Phase 3) + `docs/TDD-WORKFLOW.md`.
> Vai trò người dùng spec này: **Red Agent (FE)** (viết test đỏ) và **Green Agent (API/UI)** (implement).
> Phạm vi file spec này: **CHỈ module notes phía client** — `features/notes/*` + `types` + MSW.
> KHÔNG đụng: auth (Phase 2), tags/trash/public (Phase 4), admin (Phase 5).
> Pattern phải bám: `features/auth/*` (đã hoàn thành ở Phase 2).

---

## 0. Ràng buộc bất biến (contract dùng chung)

| # | Quy tắc | Áp dụng |
|---|---|---|
| R1 | Mọi request notes **bắt buộc** kèm `Authorization: Bearer <token>` (đã có trong `apiRequest`). | create/list/detail/raw/update/delete |
| R2 | `SafeNote = Note & { tags: string[] }` — backend luôn trả kèm `tags`. | create/byId/update |
| R3 | `NoteListItem` (danh sách) **KHÔNG có content** — dạng gọn `{id,title,status,tags,createdAt,updatedAt}`. | list/trash |
| R4 | Danh sách `/notes` trả **mảng phẳng** `NoteListItem[]` (không bọc pagination ở v1). | list |
| R5 | `q`/`status`/`tag` là bộ lọc tuỳ chọn; giá trị rỗng → bỏ khỏi query. | list |
| R6 | Nội dung markdown lấy qua `GET /notes/:id/raw` → `text` (để editor/render). | raw |
| R7 | Xoá note là **soft-delete** (vào thùng rác); thùng rác nằm ở Phase 4. | delete |

---

## 1. API client — `src/features/notes/notes.api.ts`

```typescript
export const notesApi = {
  create(body: CreateNoteBody): Promise<SafeNote>,
  list(params?: NoteListParams): Promise<NoteListItem[]>,
  byId(id: string): Promise<SafeNote>,
  raw(id: string): Promise<string>,
  update(id: string, body: UpdateNoteBody): Promise<SafeNote>,
  softDelete(id: string): Promise<void>,   // 204
};
```

- `CreateNoteBody = { title; content?; status?; tagNames?: string[] }`.
- `NoteListParams = { q?; status?; tag?; page?; limit? }` — `cleanQuery()` loại bỏ giá trị rỗng.
- Tất cả bọc qua `apiRequest` (đã có token, envelope, 204 → undefined).

## 2. Hooks — `src/features/notes/notes-hooks.ts`

| Hook | Query | Key | Invalidate sau mutate |
|---|---|---|---|
| `useNotes(params)` | list | `qk.notes(params)` | – |
| `useNote(id)` | byId | `qk.note(id)` | – |
| `useRawNote(id)` | raw | `qk.noteRaw(id)` | – |
| `useCreateNote()` | – | – | `["notes"]`, `["tags"]` |
| `useUpdateNote(id)` | – | – | `["notes"]`, `qk.note(id)`, `["tags"]` |
| `useSoftDeleteNote()` | – | – | `["notes"]`, `["notes","trash"]` |

## 3. UI Page — `src/pages/notes-page.tsx`

- Layout 2 cột: **trái** = bộ lọc (search, chọn tag, nút "Tạo note") + danh sách `NoteListItemCard`;
  **phải** = preview/detail (`MarkdownPreview` content từ raw hoặc note.content).
- `NoteListItemCard` (`features/notes/note-list-item.tsx`): menu ⋮ (Sửa / Chia sẻ / Xoá), badge tag, trạng thái.
- `NoteEditor` (`features/notes/note-editor.tsx`): dialog 2 tab **Viết / Xem trước**, chọn trạng thái, thêm tag (Enter/,).

## 4. Case kiểm thử cho Red Agent (FE)

### 4.1. Điều kiện chạy
- File test: `src/test/notes.test.ts` — vitest + MSW + jsdom.
- `beforeEach`: `seedDb()` (users user) + `makeOwnerSession()` (ký session đúng id).
- Data tạo qua API thật (MSW) — không nhồi DB tay cho case chính.

### 4.2. Bảng case

#### Nhóm UI (bảng case object)
| # | Case | Hành động | Expected |
|---|---|---|---|
| U1 | Chưa đăng nhập vào `/` | render(`/`) | bị redirect về `/login` (thấy button "Đăng nhập") |
| U2 | Đăng nhập admin mở editor | bấm "Tạo note" | dialog "Tạo ghi chú mới" hiện (field Tiêu đề) |

#### Nhóm API (data-driven qua MSW)
| # | Case | Expected |
|---|---|---|
| A1 | create note + 2 tag | trả `SafeNote` có `tags` chứa 2 tag; `list()` có 1 note |
| A2 | note của chủ khác | không xuất hiện trong `list()` của mình (cô lập ownership) |
| A3 | raw() | trả `string` (nội dung markdown thô) |

---

## 5. Gate Phase 3 & danh sách file sẽ tạo/sửa

1. `src/types/index.ts` — **sửa**: đã có `SafeNote`/`NoteListItem` (Phase 2).
2. `src/features/notes/notes.api.ts` — **tạo mới** (Green C).
3. `src/features/notes/notes-hooks.ts` — **tạo mới** (Green D).
4. `src/features/notes/note-editor.tsx`, `note-list-item.tsx` — **tạo mới** (Green D).
5. `src/pages/notes-page.tsx`, `src/app/router.tsx` — **tạo/sửa** (mount route).
6. `src/test/mocks/handlers.ts` — **sửa**: nhánh `/notes*` (đã có ở Phase 3 mock).
7. `src/test/notes.test.ts` — **tạo mới (Red Agent)**.

Gate: `npm run typecheck` xanh · `npm test` (mới + cũ) xanh · `npm run build` OK · `npm run lint` OK.
