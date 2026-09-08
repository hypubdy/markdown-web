# Markdown Notes — Frontend (ReactJS)

Frontend cho backend **`markdown-api`** (Express + TS): app quản lý ghi chú **Markdown** theo tài khoản.
Giao diện theo phong cách **DeepSeek Harness** (sidebar + top bar + panel nội dung), dựng bằng **shadcn/ui**.

> Stack: **Vite + React 18 + TypeScript + React Router + TanStack Query + shadcn/ui**
> (Radix + Tailwind). Test data-driven bằng **Vitest + MSW**.

## Tính năng

- 🔐 **Auth** (đăng nhập / đăng ký / xem me) — JWT trong localStorage
- 📝 **Notes CRUD** + **editor markdown** (2 tab Viết / Xem trước) + render preview an toàn
- 🏷️ **Tags** — gán khi soạn, lọc theo tag, xoá tag
- 🗑️ **Thùng rác** — soft-delete → khôi phục → xoá vĩnh viễn
- 🌍 **Public share** — bật/thu hồi + trang xem không cần đăng nhập
- 👥 **Admin users** — thống kê, đổi role, xoá user (chỉ admin)

## Cài đặt & chạy

```bash
npm install
cp .env.example .env.local    # tuỳ chọn: VITE_API_TARGET=http://localhost:3000

npm run dev          # Vite dev (proxy /api → backend markdown-api trên :3000)
npm run build        # build production
npm run preview      # xem bản build
npm run typecheck    # tsc --noEmit
npm test             # vitest run (MSW)
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
