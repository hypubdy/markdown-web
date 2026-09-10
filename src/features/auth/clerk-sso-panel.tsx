import { useState } from "react";
import { useSignIn } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ReactNode } from "react";

/**
 * Bảng đăng nhập SSO qua Clerk (OAuth social: Google / GitHub).
 * - Provider phải được bật trong Clerk Dashboard → "User & Authentication → Social connections".
 * - Lần đầu người dùng chưa có tài khoản: Clerk TỰ TẠO tài khoản khi bật sign-up
 *   (mặc định) — nên trang Đăng ký cũng dùng panel này.
 * - Luồng: bấm nút → Clerk điều hướng sang provider → quay về /sso-callback
 *   (hoàn tất tạo session) → chuyển về "/".
 */

type OauthStrategy = "oauth_google" | "oauth_github";

interface ProviderMeta {
  strategy: OauthStrategy;
  label: string;
  icon: ReactNode;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.46a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.29A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.57.38-2.29v-3.1H1.27a12 12 0 0 0 0 10.78l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.76c1.76 0 3.35.6 4.6 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.27 6.61l4.01 3.1C6.22 6.87 8.87 4.76 12 4.76Z"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 .3a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .3Z" />
    </svg>
  );
}

const PROVIDERS: ProviderMeta[] = [
  { strategy: "oauth_google", label: "Google", icon: <GoogleIcon /> },
  { strategy: "oauth_github", label: "GitHub", icon: <GithubIcon /> },
];

export interface ClerkSsoPanelProps {
  /** login: tiêu đề "Đăng nhập"; register: tiêu đề "Tạo tài khoản" */
  mode?: "login" | "register";
}

export function ClerkSsoPanel({ mode = "login" }: ClerkSsoPanelProps) {
  const { isLoaded, signIn } = useSignIn();
  const [pending, setPending] = useState<OauthStrategy | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLogin = mode === "login";

  async function start(strategy: OauthStrategy) {
    if (!isLoaded || !signIn) return;
    setError(null);
    setPending(strategy);
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        // Quay về trang callback để Clerk hoàn tất tạo session rồi về "/"
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/`,
      });
      // Hàm này điều hướng cả trang — nếu trở lại (vd huỷ OAuth) sẽ hiện lỗi dưới đây
    } catch (err) {
      setPending(null);
      setError(
        err instanceof Error
          ? err.message
          : "Không thể bắt đầu đăng nhập SSO. Vui lòng thử lại.",
      );
    }
  }

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">
          {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
        </CardTitle>
        <CardDescription>
          {isLogin
            ? "Đăng nhập bằng SSO (Google/GitHub) để quản lý ghi chú Markdown."
            : "Tài khoản được tạo tự động ở lần đăng nhập SSO đầu tiên."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {PROVIDERS.map((provider) => (
          <Button
            key={provider.strategy}
            type="button"
            variant="outline"
            className="w-full justify-start gap-3"
            disabled={!isLoaded || pending !== null}
            onClick={() => void start(provider.strategy)}
          >
            {provider.icon}
            {pending === provider.strategy
              ? "Đang chuyển đến nhà cung cấp…"
              : `${isLogin ? "Đăng nhập bằng" : "Tiếp tục với"} ${provider.label}`}
          </Button>
        ))}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <p className="text-xs text-muted-foreground">
          {isLogin
            ? "Chưa có tài khoản? Bấm đăng nhập — tài khoản sẽ được tạo tự động."
            : "Đã có tài khoản? Dùng nút đăng nhập để vào luôn — không cần đăng ký riêng."}
        </p>
      </CardContent>
    </Card>
  );
}
