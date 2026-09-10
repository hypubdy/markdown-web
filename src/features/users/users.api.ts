import { apiRequest } from "@/lib/api-client";
import { resolveAccessToken } from "@/lib/auth-token";
import type {
  SafeUser,
  UserProfile,
  UserRole,
  UserStats,
} from "@/types";

const PATH = "/api/v1/users";

/** Token có thể là Promise — apiRequest tự await (Clerk lấy token mới mỗi request) */
const token = () => resolveAccessToken();

export const usersApi = {
  /** GET /users — danh sách user (admin). Lọc role / tìm q. */
  list(params: { role?: UserRole; q?: string } = {}): Promise<SafeUser[]> {
    return apiRequest<SafeUser[]>(PATH, {
      token: token(),
      query: { role: params.role, q: params.q },
    });
  },

  /** GET /users/stats — thống kê (admin) */
  stats(): Promise<UserStats> {
    return apiRequest<UserStats>(`${PATH}/stats`, { token: token() });
  },

  /** GET /users/me — user hiện tại */
  me(): Promise<SafeUser> {
    return apiRequest<SafeUser>(`${PATH}/me`, { token: token() });
  },

  /** GET /users/:id — chi tiết user */
  byId(id: string): Promise<SafeUser> {
    return apiRequest<SafeUser>(`${PATH}/${id}`, { token: token() });
  },

  /** GET /users/:id/profile — hồ sơ công khai gọn nhẹ */
  profile(id: string): Promise<UserProfile> {
    return apiRequest<UserProfile>(`${PATH}/${id}/profile`, { token: token() });
  },

  /** PATCH /users/:id/role — đổi role (admin) */
  updateRole(id: string, role: UserRole): Promise<SafeUser> {
    return apiRequest<SafeUser>(`${PATH}/${id}/role`, {
      method: "PATCH",
      token: token(),
      body: { role },
    });
  },

  /** DELETE /users/:id — xoá user (admin) */
  remove(id: string): Promise<void> {
    return apiRequest<void>(`${PATH}/${id}`, { method: "DELETE", token: token() });
  },
};
