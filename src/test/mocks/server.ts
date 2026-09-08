import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/** MSW server cho test (node) — chặn fetch và mô phỏng backend */
export const server = setupServer(...handlers);
