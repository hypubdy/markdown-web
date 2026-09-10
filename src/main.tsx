import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { queryClient } from "@/lib/query-client";
import { router } from "@/app/router";
import { AuthProvider } from "@/features/auth/auth-context";
import { ThemeProvider } from "@/app/theme-context";
import { clerkPublishableKey, isClerkEnabled } from "@/lib/auth-mode";
import "@/index.css";

const appTree = (
  <ThemeProvider>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </ThemeProvider>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* Chế độ Clerk (SSO): bọc ClerkProvider để dùng hooks Clerk (useAuth/useSignIn…).
          Legacy (không có VITE_CLERK_PUBLISHABLE_KEY): cây cũ, không cần Clerk. */}
      {isClerkEnabled ? (
        <ClerkProvider
          publishableKey={clerkPublishableKey!}
          afterSignOutUrl="/login"
        >
          {appTree}
        </ClerkProvider>
      ) : (
        appTree
      )}
      <Toaster position="top-right" richColors theme="system" />
    </QueryClientProvider>
  </StrictMode>,
);
