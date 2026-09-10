import { Link } from "react-router-dom";
import { RegisterForm } from "@/features/auth/register-form";
import { ClerkSsoPanel } from "@/features/auth/clerk-sso-panel";
import { isClerkEnabled } from "@/lib/auth-mode";
import { FileText } from "lucide-react";

export function RegisterPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 p-4">
      <Link to="/" className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <FileText className="h-5 w-5" />
        </span>
        <span className="text-lg font-semibold">Markdown Notes</span>
      </Link>
      {isClerkEnabled ? (
        <ClerkSsoPanel mode="register" />
      ) : (
        <RegisterForm />
      )}
    </div>
  );
}
