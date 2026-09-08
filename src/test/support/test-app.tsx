import { Route, Routes, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/features/auth/auth-context";
import { ThemeProvider } from "@/app/theme-context";
import { LoginPage } from "@/pages/login-page";
import { RegisterPage } from "@/pages/register-page";
import { NotesPage } from "@/pages/notes-page";
import { TrashPage } from "@/pages/trash-page";
import { TagsPage } from "@/pages/tags-page";
import { AdminUsersPage } from "@/pages/admin-users-page";
import { PublicSharePage } from "@/pages/public-share-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { RequireAuth, RequireAdmin, RedirectIfAuthenticated } from "@/app/guards";

/** Cây route (không có provider) — mirror `app/router.tsx` dùng <Routes> thuần */
function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RedirectIfAuthenticated>
            <LoginPage />
          </RedirectIfAuthenticated>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAuthenticated>
            <RegisterPage />
          </RedirectIfAuthenticated>
        }
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <NotesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/trash"
        element={
          <RequireAuth>
            <TrashPage />
          </RequireAuth>
        }
      />
      <Route
        path="/tags"
        element={
          <RequireAuth>
            <TagsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAdmin>
            <AdminUsersPage />
          </RequireAdmin>
        }
      />
      <Route path="/public/notes/:shareToken" element={<PublicSharePage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

/**
 * Dựng toàn bộ cây app cho test: QueryClient MỚI mỗi lần (cô lập cache)
 * + AuthProvider + MemoryRouter với route chỉ định.
 * Dùng cho `runUiCaseSuite({ renderApp: (route) => renderTestApp(route) })`.
 */
export function renderTestApp(initialRoute = "/") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={[initialRoute]}>
            <AppRoutes />
          </MemoryRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
