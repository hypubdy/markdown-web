# TDD STATUS — Frontend Markdown (nhật ký pipeline)

## Phase 1 (Shell + lib) — HOÀN THÀNH
- Scaffold Vite + React 18 + TS strict; shadcn/ui (token theme, 12+ component base).
- `lib/api-client.ts` (envelope + 204), `lib/auth-token.ts`, `lib/query-client.ts`, `lib/query-keys.ts`, `lib/utils.ts`.
- Layout khung Harness: `sidebar`, `top-bar`, `app-shell`.
- GATE: `tsc` xanh; build OK (manualChunks tách react/query/ui/radix).

## Phase 2 (Auth) — HOÀN THÀNH
- `features/auth/*`: api, context (user/login/register/logout), hooks, login/register form.
- Guards: `RequireAuth`, `RequireAdmin`, `RedirectIfAuthenticated`.
- MSW mock auth (`mocks/handlers.ts`): login/register/me.
- Quyết định: redirect sau login là **declarative qua `RedirectIfAuthenticated`** (đọc state mới nhất),
  không `navigate` trong `onSuccess` (tránh đọc stale context khi React batch).
- GATE: 6 test auth xanh (2 UI case + 3 API unit).

## Phase 3 (Notes CRUD + editor) — HOÀN THÀNH
- `features/notes/*`: api (create/list/byId/raw/update/softDelete), hooks (useNotes/useNote/useRawNote/useCreate/useUpdate/useSoftDelete),
  `note-editor` (2 tab write/preview), `note-list-item`.
- `pages/notes-page` (2 cột: filter+list / preview), route mount `/`.
- Notes đổi role: owner check qua MSW; note của chủ khác → 404/không lọt list.
- GATE: test notes xanh.

## Phase 4 (Tags + Trash + Share public) — HOÀN THÀNH
- `features/tags/*` (list/remove), `features/notes/notes-trash-hooks` (restore/hardDelete/share enable/disable), `features/public/*`.
- `pages/trash-page`, `pages/tags-page`, `pages/public-share-page`.
- GATE: test tags + trash xanh.

## Phase 5 (Admin users + tài liệu) — HOÀN THÀNH
- `features/users/*` (stats/list/updateRole/remove), `pages/admin-users-page` (stats card + role select + delete), route `/admin/users` (RequireAdmin).
- Tài liệu: `docs/FE-PLAN.md`, `docs/TDD-WORKFLOW.md`, `docs/tdd-slices/phase3-notes.md`, `docs/tdd-status.md`, `README.md`.

## Tổng kết pipeline
- Suite: **20 test** (5 file test — auth 6, notes 4, tags 3, trash 3, admin 4), đều **data-driven**:
  UI dùng bảng case object (case-runner/run-case-suite) + API dùng case object qua MSW.
- SDK: `npm test` (vitest + MSW) · `npm run typecheck` (strict) · `npm run build` (chunk) · `npm run lint` đều xanh.
- Ghi chú môi trường: vite build & vitest cần esbuild spawn (pipestdio); trong sandbox hạn chế
  phải chạy với quyền mở rộng — trên máy thật không cần.
