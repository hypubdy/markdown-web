# Markdown Notes — Frontend (ReactJS)

Frontend cho backend **`markdown-api`** (Express + TS): app quản lý ghi chú **Markdown** theo tài khoản.
Giao diện theo phong cách **DeepSeek Harness** (sidebar + top bar + panel nội dung), dựng bằng **shadcn/ui**.

> Stack: **Vite + React 18 + TypeScript + React Router + TanStack Query + shadcn/ui**
> (Radix + Tailwind). Test data-driven bằng **Vitest + MSW**.

## Tính năng

- 🔐 **Auth** — 2 chế độ theo env (xem mục SSO dưới):
  - **Clerk SSO** (mặc định khi có `VITE_CLERK_PUBLISHABLE_KEY`): đăng nhập bằng Google/GitHub.
  - **Legacy**: form email/mật khẩu → JWT trong localStorage (backend `AUTH_PROVIDER=local`).
- 📝 **Notes CRUD** + **editor markdown** (2 tab Viết / Xem trước) + render preview an toàn
- 🏷️ **Tags** — gán khi soạn, lọc theo tag, xoá tag
- 🗑️ **Thùng rác** — soft-delete → khôi phục → xoá vĩnh viễn
- 🌍 **Public share** — bật/thu hồi + trang xem không cần đăng nhập
- 👥 **Admin users** — thống kê, đổi role, xoá user (chỉ admin)

## Đăng nhập SSO qua Clerk (Google / GitHub)

Khi file env có `VITE_CLERK_PUBLISHABLE_KEY` (cùng instance Clerk backend dùng), trang
đăng nhập/đăng ký chuyển sang **SSO**: bấm nút Google/GitHub → Clerk điều hướng sang
provider → quay về `/sso-callback` → vào app.

- Backend phải chạy với `AUTH_PROVIDER=clerk` (xem README `markdown-api`) để chấp nhận
  Clerk *session token* gửi trong header `Authorization: Bearer <token>`.
- Tài khoản nội bộ **tự động tạo/đồng bộ theo email chính** của Clerk ở request đầu tiên.
- Khi bật SSO, form mật khẩu & tài khoản demo `admin@example.com` KHÔNG dùng được
  (backend trả 410 cho `/auth/login`, `/auth/register`).
- Cần cấu hình trong **Clerk Dashboard** (cùng instance với backend):
  **User & Authentication → Social connections**: bật Google/GitHub;
  **Application URLs / Allowed origins**: thêm `http://localhost:5173`.

Cách tạo quyền admin cho tài khoản SSO: set **public metadata** `role: "admin"` cho user
đó trên Clerk Dashboard (áp dụng lúc tài khoản nội bộ được tạo lần đầu), hoặc tự đổi role
bằng trang admin của app.

## Cài đặt & chạy

```bash
npm install
cp .env.example .env.local    # điền VITE_CLERK_PUBLISHABLE_KEY nếu muốn SSO qua Clerk

npm run dev          # Vite dev (proxy /api → backend markdown-api trên :3000)
npm run build        # build production
npm run preview      # xem bản build
npm run typecheck    # tsc --noEmit
npm test             # vitest run (MSW — luôn chạy chế độ legacy, không cần Clerk)
npm run test:watch
npm run test:coverage
npm run lint         # eslint
```

**Bật backend** (project `markdown-api`) song song rồi truy cập `http://localhost:5173`:

```bash
cd ../markdown-api
npm run dev          # chạy backend Express trên :3000
```

Tài khoản demo: `admin@example.com` / `admin123` (hoặc seed thêm user qua `npm run seed` ở backend).
> ⚠️ Tài khoản demo chỉ dùng được khi **KHÔNG** bật Clerk (bỏ trống `VITE_CLERK_PUBLISHABLE_KEY`
> và backend `AUTH_PROVIDER=local`). Chế độ Clerk SSO bỏ login mật khẩu (backend trả 410).

## Cấu trúc thư mục

```
src/
├── app/          # router + guards (RequireAuth / RequireAdmin / RedirectIfAuthenticated)
├── components/   # shadcn ui/*, layout/* (sidebar, top-bar, app-shell), markdown-preview
├── features/     # ★ mỗi feature 1 thư mục: auth, users, notes, tags, public
├── lib/          # api-client, auth-token, query-client, query-keys, utils
├── pages/        # notes, trash, tags, admin-users, login, register, public-share, not-found
├── types/        # kiểu dữ liệu khớp hợp đồng backend
└── test/         # ★ data-driven test engine + MSW mock (db, handlers, server)
```

Xem chi tiết kế hoạch & workflow tại [`docs/FE-PLAN.md`](docs/FE-PLAN.md) và
[`docs/TDD-WORKFLOW.md`](docs/TDD-WORKFLOW.md) (dành cho AI agent/subagent).

## Kiểm thử (data-driven)

Bộ test viết theo kiểu **data-driven** — mỗi test case là một **object** khai báo ngay trong file:

```ts
// vd src/test/notes.test.ts
const uiCases = [
  {
    name: "Đăng nhập admin → mở dialog Tạo ghi chú mới",
    route: "/",
    signedIn: true,
    act: async (user) => {
      await user.click(await screen.findByRole("button", { name: "Tạo note" }));
    },
    expectText: "Tạo ghi chú mới",
  },
];
```

- **MSW** chặn `fetch` và mô phỏng đúng hợp đồng backend (`src/test/mocks/*`), DB trong-memory.
- **API test** gọi trực tiếp `features/*.api.ts` qua MSW (kiểm tra client + contract + ownership).
- Muốn thêm test: thêm một object vào bảng case trong chính file test (xem `TDD-WORKFLOW.md`).

## Scripts

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | chạy dev server (Vite, proxy `/api`) |
| `npm run build` | đóng gói production (tách chunk react/query/ui/radix) |
| `npm run preview` | xem bản build |
| `npm run typecheck` | kiểm tra kiểu TypeScript (strict) |
| `npm test` / `npm run test:watch` | chạy / chạy lại test (vitest + MSW) |
| `npm run test:coverage` | báo cáo coverage |
| `npm run lint` | eslint (flat config) |
