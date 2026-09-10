import { useEffect, useState } from "react";
import {
  AuthenticateWithRedirectCallback,
  useAuth as useClerkAuth,
} from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isClerkEnabled } from "@/lib/auth-mode";

/**
 * Trang trung gian luồng SSO Clerk (OAuth quay về `redirectUrl` = /sso-callback).
 *
 * QUAN TRỌNG: theo tài liệu Clerk, route trỏ tới `redirectUrl` PHẢI render
 * `<AuthenticateWithRedirectCallback />` (hoặc gọi `Clerk.handleRedirectCallback()`)
 * để HOÀN TẤT luồng OAuth — nếu thiếu, attempt không bao giờ được resume nên
 * không tạo được phiên (trước đây trang chỉ hiện spinner → tưởng lỗi "chưa hoàn tất").
 *
 * Component tự: tạo session (kể cả tài khoản mới), chuyển hướng về
 * `redirectUrlComplete` đã khai báo lúc bấm nút ("/"), hoặc sang các URL
 * dự phòng khi cần bước bổ sung (2FA / tiếp tục đăng ký…).
 * Trang chỉ giữ vai trò hiển thị "đang xử lý" và gợi ý khi mắc kẹt quá lâu.
 */
export function SsoCallbackPage() {
  // Chế độ legacy (không có Clerk) không bao giờ tới đây bằng luồng thật,
  // nhưng vẫn xử lý để người dùng gõ tay URL không bị crash.
  if (!isClerkEnabled) {
    return (
      <div className="flex min-h-full items-center justify-center p-4">
        <Card className="mx-auto w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-xl">Trang này chỉ dùng với Clerk SSO</CardTitle>
            <CardDescription>
              Ứng dụng đang chạy chế độ đăng nhập mật khẩu (chưa đặt
              VITE_CLERK_PUBLISHABLE_KEY). Hãy quay lại trang đăng nhập.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/login">Về trang đăng nhập</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  return <ClerkSsoCallback />;
}

function ClerkSsoCallback() {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const navigate = useNavigate();

  // Sau 9s chưa thấy phiên → nghi lỗi thật (cancelled OAuth / cấu hình dashboard),
  // hiển thị gợi ý thay vì đứng im. Nếu Clerk xử lý xong sau đó, nó vẫn tự điều hướng.
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setStuck(true), 9000);
    return () => window.clearTimeout(timer);
  }, []);

  // Đề phòng: nếu phiên đã có (Clerk tự chuyển về redirectUrlComplete trước đó
  // chưa kịp), đưa thẳng về trang chính.
  useEffect(() => {
    if (isLoaded && isSignedIn) navigate("/", { replace: true });
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      {/*
        Bước bắt buộc để hoàn tất OAuth (resume attempt do ClerkSsoPanel khởi tạo).
        Component trả null và tự điều hướng — đặt TRƯỚC phần UI chờ.
      */}
      <AuthenticateWithRedirectCallback
        signInUrl="/login"
        signUpUrl="/register"
        afterSignInUrl="/"
        afterSignUpUrl="/"
        firstFactorUrl="/login"
        secondFactorUrl="/login"
      />

      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            {stuck && isLoaded && !isSignedIn
              ? "Đăng nhập chưa hoàn tất"
              : "Đang xử lý đăng nhập…"}
          </CardTitle>
          <CardDescription>
            {stuck && isLoaded && !isSignedIn
              ? "Phiên đăng nhập chưa được tạo. Hãy mở F12 → Console xem lỗi Clerk (thường do chưa bật Google/GitHub trong Clerk Dashboard, hoặc chưa thêm http://localhost:5173 vào Allowed origins), rồi thử lại."
              : "Vui lòng chờ trong giây lát, chúng tôi đang hoàn tất phiên đăng nhập của bạn."}
          </CardDescription>
        </CardHeader>
        {stuck && isLoaded && !isSignedIn && (
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/login">Về trang đăng nhập</Link>
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
