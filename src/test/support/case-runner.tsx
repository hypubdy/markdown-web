/**
 * ENGINE CHUNG cho test data-driven phía frontend — mirror `tests/support/case-runner.ts`
 * của backend `markdown-api`, nhưng kéo theo render React thật + MSW mock.
 *
 * Mỗi test case là một OBJECT thuần, khai báo NGAY TRONG file test:
 *
 *   const cases: UiTestCase[] = [
 *     {
 *       name: "Đăng nhập admin → vào trang ghi chú",
 *       route: "/login",
 *       seed: { auth: true },
 *       act: async (screen, user) => {
 *         await user.type(screen.getByLabelText("Email"), "admin@example.com");
 *         await user.type(screen.getByLabelText("Mật khẩu"), "admin123");
 *         await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
 *       },
 *       expect: [
 *         { text: "Ghi chú Markdown", exists: true },
 *       ],
 *     },
 *   ];
 *
 *   runUiCaseSuite(cases, { label: "...", render: () => <LoginPage/> });
 *
 * Engine tự lo: render trang (hoặc toàn bộ app), seed MSW, chạy act, rồi assert theo bảng `expect`.
 * Cả `expect` và `saveValue` dùng placeholder `$var` được nạp từ `options.prepare()` / `saveResult`.
 */

import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";

/** Rule assert trong body cây DOM / text render ra */
export interface UiExpectRule {
  /** Chuỗi text phải (hoặc không) tồn tại trong document */
  text?: string;
  /** label/role/name tìm một phần tử */
  byRole?: { role: string; name?: string | RegExp };
  /** tồn tại (true) / không tồn tại (false) */
  exists?: boolean;
}

export interface UiTestCase {
  /** tên case — hiển thị trong báo cáo vitest */
  name: string;
  /** đường dẫn router (MemoryRouter initialEntries), vd "/login" */
  route?: string;
  /** seed MSW trước case: { auth: true } → seed admin+user; tuỳ chọn thêm db */
  seed?: { auth?: boolean };
  /** hành động người dùng trên màn hình (tuỳ chọn — case chỉ assert cũng được).
   *  Lưu ý: dùng `screen` import ở đầu file (như backend dùng supertest), không truyền param. */
  act?: (user: ReturnType<typeof userEvent.setup>) => Promise<void>;
  /** bảng rule assert sau khi act */
  expect?: UiExpectRule[];
}

export interface RunUiCaseSuiteOptions {
  /** tiêu đề describe */
  label?: string;
  /** render một trang cụ thể thay vì toàn bộ app */
  render?: () => ReactElement;
  /** render toàn bộ app với router (mặc định) */
  renderApp?: (route: string) => ReactElement;
  /** dữ liệu khởi tạo sẵn (có thể là placeholder "$var") */
  prepare?: () => Record<string, unknown>;
}

const DEFAULT_VARS: Record<string, unknown> = {};

/** Thay placeholder "$ten" trong chuỗi bằng biến */
function resolve(value: string, vars: Record<string, unknown>): string {
  return value.replace(/\$(\w+)/g, (_m, k: string) => {
    if (k in vars) return String(vars[k]);
    throw new Error(`Case tham chiếu biến chưa có: "$${k}"`);
  });
}

/** Kiểm tra một rule trên document */
function checkRule(rule: UiExpectRule): void {
  if (rule.text !== undefined) {
    const el = screen.queryByText(rule.text);
    if (rule.exists === false) {
      expect(el).toBeNull();
    } else {
      expect(el).toBeTruthy();
    }
  } else if (rule.byRole) {
    const el = screen.queryByRole(rule.byRole.role, { name: rule.byRole.name });
    if (rule.exists === false) {
      expect(el).toBeNull();
    } else {
      expect(el).toBeTruthy();
    }
  }
}

/**
 * Chạy một case UI:
 *  1) seed MSW nếu cần
 *  2) render trang/app vào route
 *  3) chạy act (nếu có)
 *  4) assert bảng expect
 */
export async function runUiCase(case_: UiTestCase, vars: Record<string, unknown>, options: RunUiCaseSuiteOptions) {
  const user = userEvent.setup();

  // Render
  const route = resolve(case_.route ?? "/", vars);
  if (options.renderApp) {
    render(options.renderApp(route));
  } else if (options.render) {
    render(options.render());
  } else {
    throw new Error("runUiCase cần options.renderApp hoặc options.render");
  }

  // Act
  if (case_.act) {
    await case_.act(user);
  }

  // Assert
  for (const rule of case_.expect ?? []) {
    await waitFor(() => checkRule(rule));
  }
}

/**
 * Đăng ký một suite test data-driven cho UI.
 * Tương tự `runCaseSuite` của backend: nhận bảng case (object) + tự đăng ký describe/it.
 */
export function runUiCaseSuite(cases: UiTestCase[], options: RunUiCaseSuiteOptions = {}) {
  const label = options.label ?? `UI — bảng test case (${cases.length} case)`;

  describe(label, () => {
    let vars: Record<string, unknown> = { ...DEFAULT_VARS };

    beforeAll(async () => {
      vars = { ...DEFAULT_VARS, ...((await options.prepare?.()) ?? {}) };
    });

    for (const case_ of cases) {
      it(case_.name, () => runUiCase(case_, vars, options));
    }
  });
}

export { screen };
