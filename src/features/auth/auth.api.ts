import { apiRequest } from "@/lib/api-client";
import { authToken } from "@/lib/auth-token";
import type {
  AuthResult,
  LoginBody,
  RegisterBody,
} from "@/types";

const PATH = "/api/v1/auth";

export const authApi = {
  /** Đăng ký → { token, user } */
  register(body: RegisterBody): Promise<AuthResult> {
    return apiRequest<AuthResult>(`${PATH}/register`, {
      method: "POST",
      body,
    });
  },

  /** Đăng nhập → { token, user } */
  login(body: LoginBody): Promise<AuthResult> {
    return apiRequest<AuthResult>(`${PATH}/login`, { method: "POST", body });
  },

  /** Lưu token + user sau khi đăng nhập/đăng ký */
  persist(result: AuthResult): void {
    authToken.set(result.token);
  },
};
