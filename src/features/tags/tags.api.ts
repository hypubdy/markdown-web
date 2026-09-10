import { apiRequest } from "@/lib/api-client";
import { resolveAccessToken } from "@/lib/auth-token";
import type { TagCount } from "@/types";

const PATH = "/api/v1/tags";

/** Token có thể là Promise — apiRequest tự await (Clerk lấy token mới mỗi request) */
const token = () => resolveAccessToken();

export const tagsApi = {
  /** GET /tags — tags của mình kèm count note đang sống */
  list(): Promise<TagCount[]> {
    return apiRequest<TagCount[]>(PATH, { token: token() });
  },

  /** DELETE /tags/:name — xoá tag khỏi mọi note */
  remove(name: string): Promise<void> {
    return apiRequest<void>(`${PATH}/${encodeURIComponent(name)}`, {
      method: "DELETE",
      token: token(),
    });
  },
};
