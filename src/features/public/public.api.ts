import { apiRequest } from "@/lib/api-client";
import type { PublicNote } from "@/types";

const PATH = "/api/v1/public";

export const publicApi = {
  /** GET /public/notes/:shareToken — xem note công khai, KHÔNG cần đăng nhập */
  note(shareToken: string): Promise<PublicNote> {
    return apiRequest<PublicNote>(`${PATH}/notes/${encodeURIComponent(shareToken)}`);
  },
};
