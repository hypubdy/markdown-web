import { apiRequest } from "@/lib/api-client";
import { authToken } from "@/lib/auth-token";
import type { TagCount } from "@/types";

const PATH = "/api/v1/tags";

const token = () => authToken.get();

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
