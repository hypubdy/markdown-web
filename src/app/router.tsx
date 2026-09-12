import { createBrowserRouter, Navigate } from "react-router-dom";
import { RequireAdmin, RequireAuth, RequireDeveloperMode, RedirectIfAuthenticated } from "@/app/guards";
import { LoginPage } from "@/pages/login-page";
import { RegisterPage } from "@/pages/register-page";
import { SsoCallbackPage } from "@/pages/sso-callback-page";
import { NotesPage } from "@/pages/notes-page";
import { TrashPage } from "@/pages/trash-page";
import { TagsPage } from "@/pages/tags-page";
import { AdminUsersPage } from "@/pages/admin-users-page";
import { PublicSharePage } from "@/pages/public-share-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { DocumentWorkspacePage } from "@/features/workspace/document-workspace";
import type { ReactNode } from "react";

function withAuth(el: ReactNode) {
  return <RequireAuth>{el}</RequireAuth>;
}

function withAdmin(el: ReactNode) {
  return <RequireAdmin>{el}</RequireAdmin>;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <RedirectIfAuthenticated>
        <LoginPage />
      </RedirectIfAuthenticated>
    ),
  },
  {
    path: "/register",
    element: (
      <RedirectIfAuthenticated>
        <RegisterPage />
      </RedirectIfAuthenticated>
    ),
  },
  {
    path: "/",
    element: withAuth(<NotesPage />),
  },
  {
    path: "/workspace",
    element: withAuth(
      <RequireDeveloperMode>
        <DocumentWorkspacePage />
      </RequireDeveloperMode>,
    ),
  },
  {
    path: "/notes/:noteId",
    element: withAuth(<NotesPage />),
  },
  {
    path: "/trash",
    element: withAuth(<TrashPage />),
  },
  {
    path: "/tags",
    element: withAuth(<TagsPage />),
  },
  {
    path: "/admin/users",
    element: withAdmin(<AdminUsersPage />),
  },
  {
    path: "/public/notes/:shareToken",
    element: <PublicSharePage />,
  },
  {
    // Trang trung gian luồng SSO Clerk (OAuth quay về đây để hoàn tất phiên)
    path: "/sso-callback",
    element: <SsoCallbackPage />,
  },
  {
    path: "/404",
    element: <NotFoundPage />,
  },
  {
    path: "*",
    element: <Navigate to="/404" replace />,
  },
]);
