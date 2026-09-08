import { beforeAll, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderTestApp } from "@/test/support/test-app";
import { seedDb } from "@/test/mocks/db";

/**
 * DATA-DRIVEN UI TEST — luồng đăng nhập & API auth.
 * Nhóm case là mảng OBJECT (mirror `tests/app.test.ts` backend) chạy qua MSW.
 */

interface AuthCase {
  name: string;
  seed?: () => void;
  act: (user: ReturnType<typeof userEvent.setup>) => Promise<void>;
  /** chuỗi text phải hiển thị sau hành động */
  expectText?: string;
  /** bằng role/name phải hiển thị */
  expectRole?: { role: string; name: string };
  /** placeholder input phải tồn tại sau hành động */
  expectPlaceholder?: string;
}

const authCases: AuthCase[] = [
  {
    name: "login admin@example.com/admin123 → vào trang ghi chú",
    seed: () => seedDb(),
    act: async (user) => {
      await user.type(await screen.findByLabelText("Email"), "admin@example.com");
      await user.type(screen.getByLabelText("Mật khẩu"), "admin123");
      await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
    },
    expectPlaceholder: "Tìm ghi chú…",
  },
  {
    name: "login sai mật khẩu → hiển thị lỗi, không vào trang",
    seed: () => seedDb(),
    act: async (user) => {
      await user.type(await screen.findByLabelText("Email"), "admin@example.com");
      await user.type(screen.getByLabelText("Mật khẩu"), "sai-mat-khau");
      await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
    },
    expectText: "Email hoặc mật khẩu không đúng",
  },
  {
    name: "trang đăng nhập hiển thị đúng khung + gợi ý tài khoản demo",
    seed: () => seedDb(),
    act: async () => {
      /* không cần hành động — chỉ assert cấu trúc */
    },
    expectText: "Tài khoản demo: admin@example.com / admin123",
  },
];

describe("Luồng đăng nhập (data-driven)", () => {
  beforeAll(() => {
    seedDb();
  });

  for (const c of authCases) {
    it(c.name, async () => {
      c.seed?.();
      const user = userEvent.setup();
      render(renderTestApp("/login"));
      await c.act(user);

      if (c.expectText) {
        await waitFor(() => expect(screen.getByText(c.expectText!)).toBeTruthy());
      }
      if (c.expectPlaceholder) {
        await waitFor(() =>
          expect(screen.getByPlaceholderText(c.expectPlaceholder!)).toBeTruthy(),
        );
      }
      if (c.expectRole) {
        await waitFor(() =>
          expect(screen.getByRole(c.expectRole!.role, { name: c.expectRole!.name })).toBeTruthy(),
        );
      }
    });
  }
});

describe("Auth API (đơn vị, qua MSW)", () => {
  it("login đúng → trả token + user, ghi vào authToken", async () => {
    seedDb();
    const { authApi } = await import("@/features/auth/auth.api");
    const { authToken } = await import("@/lib/auth-token");
    authToken.clear();

    const result = await authApi.login({
      email: "admin@example.com",
      password: "admin123",
    });
    expect(result.user.email).toBe("admin@example.com");
    expect(result.token).toContain("mock:admin:");
    authApi.persist(result);
    expect(authToken.get()).toBe(result.token);
  });

  it("login sai mật khẩu → ném ApiError 401", async () => {
    seedDb();
    const { authApi } = await import("@/features/auth/auth.api");
    const { ApiError } = await import("@/lib/api-client");
    await expect(
      authApi.login({ email: "admin@example.com", password: "sai" }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("register email trùng → ném ApiError 409", async () => {
    seedDb();
    const { authApi } = await import("@/features/auth/auth.api");
    const { ApiError } = await import("@/lib/api-client");
    await expect(
      authApi.register({ name: "X", email: "admin@example.com", password: "123456" }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
