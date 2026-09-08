import { Link } from "react-router-dom";
import { LoginForm } from "@/features/auth/login-form";
import { FileText } from "lucide-react";

export function LoginPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 p-4">
      <Link to="/" className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <FileText className="h-5 w-5" />
        </span>
        <span className="text-lg font-semibold">Markdown Notes</span>
      </Link>
      <LoginForm />
      <p className="text-xs text-muted-foreground">
        Tài khoản demo: admin@example.com / admin123
      </p>
    </div>
  );
}
