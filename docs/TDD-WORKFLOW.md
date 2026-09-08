# TDD WORKFLOW + PHÂN CHIA SUBAGENT — Frontend Markdown (ReactJS)

> Dùng chung với `docs/FE-PLAN.md` (spec) khi bắt đầu triển khai.
> Nguyên tắc: **RED → GREEN → REFACTOR**, mỗi feature đi qua đủ 3 bước,
> **thực thi bởi subagent chuyên vai** với hợp đồng (contract) rõ ràng —
> MIRROR `markdown-api/docs/TDD-WORKFLOW.md` nhưng áp cho React frontend.

---

## 1. Vòng TDD áp dụng cho stack này

**Đỏ (RED)** — viết test trước (đúng hành vi theo spec FE-PLAN), chạy thấy FAIL đúng lý do:
- Test data-driven: thêm **case object** vào `src/test/*.test.{ts,tsx}`
  (`{ name, route, seed, act, expect }` cho UI + `{ name, before, act, expect }` cho API).
- "Fail đúng lý do" = fail vì chức năng chưa có / chưa có endpoint (404) / component chưa render,
  KHÔNG fail vì syntax/đặt tên sai.

**Xanh (GREEN)** — code tối thiểu để test pass, theo đúng kiến trúc feature hiện có:
1. `features/<tên>/*.api.ts` (gọi `apiRequest`) + `types/index.ts`.
2. `features/<tên>/*-hooks.ts` (TanStack Query) + `lib/query-keys.ts`.
3. Component/page + mount vào `app/router.tsx` (+ guard nếu cần).

**Refactor** — giữ test xanh, dọn code: đúng pattern (api client, query-keys, shadcn),
DRY (không import vòng), đặt tên tiếng Việt mạch lạc, không scope-creep.

**Định nghĩa "xanh" (gate mỗi feature):**
```bash
npm run typecheck          # tsc --noEmit (strict)
npm test                   # vitest + MSW (jsdom)
npm run build              # vite build (production)
npm run lint               # eslint (flat config)
```

---

## 2. Team subagent — vai trò, đầu vào/đầu ra

| # | Vai (agent) | Nhiệm vụ | Đầu vào → Đầu ra | Cấm |
|---|---|---|---|---|
| A | **Spec Agent (FE)** | Chuyển 1 user story trong `FE-PLAN.md` thành: case test + fixture + acceptance list | `docs/FE-PLAN.md` → doc `/docs/tdd-slices/<feature>.cases.md` | Sửa code/test |
| B | **Red Agent (FE)** | Viết/bổ sung test (case object trong `src/test/*`, seed qua MSW `mocks/db.ts` + `fixtures.ts`); chạy xác nhận FAIL đúng lý do | case spec → `src/test/<feature>.test.{ts,tsx}` đang đỏ | Sửa code production |
| C | **Green Agent (API/Feature)** | Implement `features/<tên>/*.api.ts` + `types` + hàm gọi MSW nếu cần | interface/contract từ spec → `features/<tên>/*` | Sửa test |
| D | **Green Agent (UI)** | Implement hooks (TanStack Query) + components/page + mount route/guard | routes spec → `features/<tên>/*-hooks.ts`, component, `app/router.tsx` | Sửa test |
| E | **Refactor/Quality Agent (FE)** | Review theo pattern chuẩn; chạy typecheck+build+lint+test giữ xanh | toàn bộ code feature → báo cáo + patch nhỏ | Đổi hành vi/API |
| F | **Integration/DB Agent (FE)** | Smoke end-to-end với backend thật (proxy `/api`), chạy `dev`, curl đúng luồng | built app + backend đang chạy → báo cáo end-to-end | Sửa logic |

*Ghi chú:* các agent viết code (C, D) làm việc trên **các file khác nhau** nên có thể chạy
song song sau khi Red chốt contract; B luôn trước C/D; E và F là cổng chặn sau cùng.

---

## 3. Pipeline theo Phase (khớp `FE-PLAN.md`)

```
GO ─► [P1 shell]    Spec(A) → Red(B): test shell render + api-client
     → Green D (sidebar/top-bar/app-shell) ─► E Refactor ─► GATE(1): typecheck+tests+build xanh
     │
     ▼
  [P2 auth]         Spec(A) → Red(B): test login/register/me (MSW)
     → Green C (auth.api) → D (auth-context, hooks, login/register page + guards) → E → GATE(2)
     → F: smoke login thật qua backend ─► "Phase 2 xong"
     │
     ▼
  [P3 notes]        Lặp lại vòng TDD: CRUD + editor markdown + preview + filters
     │
     ▼
  [P4 tags/trash/share]  Red(B) bổ sung case tags/trash/public, chạy data-driven
     │
     ▼
  [P5 admin + tài liệu]  Red(B) admin users; Spec(A) chốt README + FE-PLAN/TDD-WORKFLOW cập nhật
     ─► FINAL GATE: mọi test cũ + mới xanh; build/typecheck/lint OK; README đầy đủ
```

Mỗi **slice feature** (vd: "editor markdown + preview", "public share") chạy lại đúng 1 vòng
A→B→C/D→E→F trước khi sang slice kế — tránh gom quá nhiều thay đổi 1 lượt.

---

## 4. Hợp đồng giữa các agent (bắt buộc)

1. Mỗi agent nhận **1 task đơn nhất** + phạm vi file rõ ràng; không sửa file ngoài phạm vi.
2. Agent B (Red) và C/D (Green) **không sửa file của nhau** — nếu test sai thiết kế, quay lại
   Spec Agent (A) sửa spec, không "sửa test cho qua".
3. Mọi agent trả về: **danh sách file đã tạo/sửa + output kiểm chứng** (đỏ/xanh thế nào).
4. Không bỏ qua gate: trước khi bàn giao phase, phải chạy đủ lệnh mục 1.
5. Trạng thái làm việc ghi vào `docs/tdd-status.md` (feature, slice, RED/GREEN/REFACTOR, gate).
6. **Không import vòng**; mọi import dùng alias `@/*`; component dùng shadcn `@/components/ui/*`.

---

## 5. Definition of Done (toàn bộ feature frontend)

- [ ] Shell khung (sidebar + top bar + content panel) kiểu Harness render đúng, responsive.
- [ ] Auth: đăng nhập/đăng ký/xem me; JWT lưu localStorage; guard redirect đúng.
- [ ] Notes: CRUD + editor markdown (2 tab write/preview) + render preview an toàn (react-markdown).
- [ ] Tags: gán khi soạn, lọc theo tag, xoá tag.
- [ ] Thùng rác: soft-delete → restore → hard-delete.
- [ ] Public share: bật/thu hồi + trang xem không cần đăng nhập.
- [ ] Admin users: stats + đổi role + xoá user (chỉ admin).
- [ ] Bộ test data-driven (case object) mới + cũ: **tất cả xanh** ở `npm test`.
- [ ] `npm run typecheck` + `npm run build` + `npm run lint` xanh.
- [ ] README + seed/demo cập nhật.

---

## 6. Cách khởi động

Khi bạn nói **"GO — chạy TDD pipeline (frontend)"**:
- Bước 1: tôi chạy Phase 1 theo pipeline trên bằng subagent: Spec Agent → Red Agent →
  Green Agent(s) → Refactor Agent → Integration Agent, mỗi lượt thu hồi kết quả và báo cáo
  trước khi sang bước kế.
- Mỗi slice mới (editor, tags, trash, share, admin...) được xử lý tuần tự như 1 vòng TDD đầy đủ.
- Nếu một agent báo blocker (vd test thiết kế sai, contract API lệch backend), dừng pipeline,
  tôi tổng hợp và quay lại Spec Agent sửa spec rồi chạy lại — không "chữa cháy" trong code.
