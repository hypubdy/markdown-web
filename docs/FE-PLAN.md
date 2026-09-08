# FRONTEND PLAN — App quản lý Ghi chú Markdown (ReactJS)

> Trạng thái: **SPEC CHÍNH THỨC (đã chốt)** — kế thừa backend `markdown-api`.
> Nền tảng: **Vite + React 18 + TypeScript + React Router + TanStack Query + shadcn/ui**,
> trong project `markdown-app` (thư mục cạnh `markdown-api`).

---

## 1. Mục tiêu & phạm vi (ĐÃ CHỐT)

Frontend quản lý ghi chú Markdown theo tài khoản, giao tiếp với backend Express
(`markdown-api`) qua HTTP `/api/v1`. UI theo phong cách **DeepSeek Harness** (sidebar +
top bar + panel nội dung) dùng **shadcn/ui**.

**Quyết định đã chốt:**
- [x] Vite + React 18 + TS (`strict`); không dùng Next.js (không cần SSR).
- [x] React Router (client routing) + TanStack Query (cache/fetch) + shadcn/ui (Radix + Tailwind).
- [x] **JWT trong localStorage**, gửi qua header `Authorization: Bearer <token>`.
- [x] V1 gồm: **Auth** · **Notes CRUD + editor markdown + preview** · **Tags** ·
      **Thùng rác** · **Public share** · **Admin users**.
- [x] Không làm ở v1: Folder, Lịch sử phiên bản, dark-mode toggle (đã sẵn token dark).

---

## 2. Kiến trúc thư mục (theo feature, mirror backend)

```
markdown-app/
├── index.html
├── vite.config.ts            # alias @ → src; proxy /api → backend; vitest; manualChunks
├── tailwind.config.js        # token shadcn (theme sidebar/primary...)
├── components.json           # cấu hình shadcn/ui
├── src/
│   ├── main.tsx              # bootstrap: QueryClientProvider → RouterProvider → Toaster
│   ├── App.tsx               # AppProviders (cho test nhúng)
│   ├── index.css             # token CSS shadcn (light/dark)
│   ├── app/
│   │   ├── router.tsx        # createBrowserRouter + guards
│   │   └── guards.tsx        # RequireAuth / RequireAdmin / RedirectIfAuthenticated
│   ├── components/
│   │   ├── ui/               # ★ shadcn base (button, card, dialog, tabs, select...)
│   │   ├── layout/           # sidebar, top-bar, app-shell (khung kiểu Harness)
│   │   ├── markdown-preview.tsx  # render Markdown an toàn (react-markdown + GFM + Mermaid)
│   │   ├── markdown-editor.tsx   # ★ soạn thảo Markdown (CodeMirror 6: số dòng + syntax highlight)
│   │   └── mermaid.tsx           # render khối ```mermaid (lazy-load)
│   ├── features/             # ★ MỖI FEATURE = 1 THƯ MỤC
│   │   ├── auth/             #   auth.api.ts, auth-context.tsx, auth-hooks.ts, login/register-form
│   │   ├── users/            #   users.api.ts, users-hooks.ts (admin)
│   │   ├── notes/            #   notes.api.ts, notes-hooks.ts, notes-trash-hooks.ts, note-editor, note-list-item
│   │   ├── tags/             #   tags.api.ts, tags-hooks.ts
│   │   └── public/           #   public.api.ts, public-hooks.ts
│   ├── lib/
│   │   ├── api-client.ts     # ★ client fetch bọc envelope backend { success, data, message, details }
│   │   ├── auth-token.ts     #   jwt trong localStorage
│   │   ├── query-client.ts   #   QueryClient dùng chung
│   │   ├── query-keys.ts     #   một nơi đặt khoá cache
│   │   └── utils.ts          #   cn(), formatDate(), truncate()
│   ├── pages/                # notes, trash, tags, admin-users, login, register, public-share, not-found
│   ├── test/                 # ★ data-driven test engine + MSW mock
│   │   ├── setup.ts          #   bật MSW + cleanup
│   │   ├── support/          #   case-runner, run-case-suite, helpers, fixtures, test-app
│   │   └── mocks/            #   db.ts, handlers.ts, server.ts (MSW)
│   └── types/index.ts        # kiểu dữ liệu khớp hợp đồng backend
└── docs/                     # FE-PLAN.md, TDD-WORKFLOW.md, tdd-slices/*, tdd-status.md
```

---

## 3. Giải thích từng khối (mirror backend)

### 3.1. `lib/api-client.ts` — tương đương middleware/routes phía client
- `apiRequest<T>(path, { method, query, body, token, raw, signal })` trả về `T`.
- Luôn gắn `Authorization: Bearer <token>` nếu có.
- `2xx` → unwrap `envelope.data`; `204` → `undefined`; lỗi → ném `ApiError(status, message, details)`.
- `raw: true` trả `text` (dùng cho `GET /notes/:id/raw` → `text/markdown`).

### 3.2. `features/*` — tương đương module backend (routes + actions + schemas)
Mỗi feature có:
- `<name>.api.ts` — hàm gọi endpoint (bọc `apiRequest`): đóng gói request/response.
- `<name>-hooks.ts` — `useQuery`/`useMutation` của TanStack Query + key (lib/query-keys).
- form/component dùng chung (vd note-editor, login-form).

### 3.3. `lib/query-keys.ts` — single source of truth cho cache
`qk.me`, `qk.notes(filters)`, `qk.note(id)`, `qk.trash`, `qk.tags`, `qk.userStats`…
→ `invalidateQueries` theo prefix (`["notes"]`, `["tags"]`...) để cache đồng bộ khi CRUD.

### 3.4. `components/layout/*` — khung giao diện kiểu Harness
```
┌─────────┬──────────────────────────┐
│ sidebar │ topbar (title + mode + avatar)
│  nav    ├──────────────────────────┤
│  user   │ tabs + content panel     │
└─────────┴──────────────────────────┘
```
- `sidebar.tsx` — danh sách nav (Ghi chú, Thùng rác, Tags, Người dùng [admin]).
- `top-bar.tsx` — tiêu đề + "Standard mode" + avatar.
- `app-shell.tsx` — ghép sidebar/topbar/tabs/content; có nút thu gọn sidebar.

---

## 4. API — hợp đồng với backend `markdown-api` (ĐÃ CHỐT)

Trả lời đúng `{ success, data, message? }`; lỗi `{ success:false, message, details?:[...] }`.

| Method | Path | Token | FE function (api.*) | Trả về |
|---|---|---|---|---|
| POST | `/auth/register` | – | `authApi.register` | `{token, user}` |
| POST | `/auth/login` | – | `authApi.login` | `{token, user}` |
| GET | `/users/me` | ✓ | `usersApi.me` | `SafeUser` |
| GET | `/users/stats` | ✓(admin) | `usersApi.stats` | `{total,admins,users}` |
| GET | `/users?role=&q=` | ✓(admin) | `usersApi.list` | `SafeUser[]` |
| PATCH | `/users/:id/role` | ✓(admin) | `usersApi.updateRole` | `SafeUser` |
| DELETE | `/users/:id` | ✓(admin) | `usersApi.remove` | `void(204)` |
| POST | `/notes` | ✓ | `notesApi.create` | `SafeNote` |
| GET | `/notes?q=&status=&tag=&page=&limit=` | ✓ | `notesApi.list` | `NoteListItem[]` (phẳng) |
| GET | `/notes/:id` | ✓ | `notesApi.byId` | `SafeNote` |
| GET | `/notes/:id/raw` | ✓ | `notesApi.raw` | `text` |
| PATCH | `/notes/:id` | ✓ | `notesApi.update` | `SafeNote` |
| DELETE | `/notes/:id` | ✓ | `notesApi.softDelete` | `void(204)` |
| GET | `/notes/trash` | ✓ | `trashApi.list` | `NoteListItem[]` |
| POST | `/notes/trash/:id/restore` | ✓ | `trashApi.restore` | `SafeNote` |
| DELETE | `/notes/trash/:id` | ✓ | `trashApi.hardDelete` | `void(204)` |
| POST | `/notes/:id/share` | ✓ | `shareApi.enable` | `{shareToken,url}` |
| DELETE | `/notes/:id/share` | ✓ | `shareApi.disable` | `{shareToken:null}` |
| GET | `/tags` | ✓ | `tagsApi.list` | `TagCount[]` |
| DELETE | `/tags/:name` | ✓ | `tagsApi.remove` | `void(204)` |
| GET | `/public/notes/:token` | – | `publicApi.note` | `PublicNote` |

**Kiểu dữ liệu** (`src/types/index.ts`) khớp `src/types/index.ts` + `swagger/components.ts`
của backend (User/SafeUser, Note/SafeNote, NoteListItem, TagCount, PublicNote, AuthResult, UserStats).

---

## 5. Test (data-driven, mirror backend)

- **MSW** (`src/test/mocks/*`) chặn `fetch` và mô phỏng backend theo đúng hợp đồng; DB trong-memory.
- **Engine** (`src/test/support/case-runner.tsx`): mỗi test case là **OBJECT**
  `{ name, route, seed, act, expect }` + `runUiCaseSuite(cases, { renderApp })` —
  mirror `tests/support/{case-runner,run-case-suite}.ts` của backend.
- **API test** dùng trực tiếp `features/*.api.ts` qua MSW (kiểm tra client + contract).
- Chạy: `npm test` (vitest, jsdom, MSW), `npm run test:coverage`.

Bộ test mẫu: `src/test/{auth,notes,tags,trash,admin}.test.*`.

---

## 6. Phân rã công việc (Phase — khớp TDD-WORKFLOW.md)

| Phase | Nội dung | File chính |
|---|---|---|
| P1 | Shell khung + token + shadcn setup + lib/api-client | app-shell, sidebar, top-bar, lib/* |
| P2 | Auth (login/register/me) + guards + MSW cho auth | features/auth/*, app/guards |
| P3 | Notes CRUD + editor markdown + preview + MSW | features/notes/* |
| P4 | Tags + Thùng rác + Share public | features/tags, notes-trash-hooks, public |
| P5 | Admin users + test data-driven đầy đủ + README | features/users, test/*, docs/* |

---

## 7. Cài đặt & chạy

```bash
npm install
cp .env.example .env.local   # tuỳ chọn: VITE_API_TARGET=http://localhost:3000

npm run dev          # Vite dev (proxy /api → backend markdown-api)
npm run build        # đóng gói production (esbuild/rollup)
npm run preview      # xem bản build
npm run typecheck    # tsc --noEmit
npm test             # vitest run (MSW, data-driven)
npm run test:watch
npm run test:coverage
npm run lint         # eslint
```

Dev proxy mặc định trỏ `http://localhost:3000` (backend Express `markdown-api`).
