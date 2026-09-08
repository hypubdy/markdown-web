import "@testing-library/jest-dom/vitest";
import { afterAll, beforeAll, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "@/test/mocks/server";

// MSW: bật interceptor cho toàn bộ suite
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());
