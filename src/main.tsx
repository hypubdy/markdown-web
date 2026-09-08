import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { queryClient } from "@/lib/query-client";
import { router } from "@/app/router";
import { AuthProvider } from "@/features/auth/auth-context";
import { ThemeProvider } from "@/app/theme-context";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
      <Toaster position="top-right" richColors theme="system" />
    </QueryClientProvider>
  </StrictMode>,
);
