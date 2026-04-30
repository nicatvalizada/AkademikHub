import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { NotificationToaster } from "@/components/ui/NotificationToaster";
import { Spinner } from "@/components/ui/Spinner";

const LoginPage = lazy(() =>
  import("@/features/auth/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("@/features/auth/RegisterPage").then((m) => ({
    default: m.RegisterPage,
  })),
);
const ArticleDetailPage = lazy(() =>
  import("@/features/articles/ArticleDetailPage").then((m) => ({
    default: m.ArticleDetailPage,
  })),
);
const ArticleEditorPage = lazy(() =>
  import("@/features/articles/ArticleEditorPage").then((m) => ({
    default: m.ArticleEditorPage,
  })),
);
const ArticlesPage = lazy(() =>
  import("@/features/articles/ArticlesPage").then((m) => ({
    default: m.ArticlesPage,
  })),
);
const MyArticlesPage = lazy(() =>
  import("@/features/articles/MyArticlesPage").then((m) => ({
    default: m.MyArticlesPage,
  })),
);
const ArchivePage = lazy(() =>
  import("@/features/articles/ArchivePage").then((m) => ({
    default: m.ArchivePage,
  })),
);
const ArticleTrashPage = lazy(() =>
  import("@/features/articles/ArticleTrashPage").then((m) => ({
    default: m.ArticleTrashPage,
  })),
);
const ComponentsPage = lazy(() =>
  import("@/features/components/ComponentsPage").then((m) => ({
    default: m.ComponentsPage,
  })),
);
const DashboardHome = lazy(() =>
  import("@/features/dashboard/DashboardHome").then((m) => ({
    default: m.DashboardHome,
  })),
);
const PlaceholderPage = lazy(() =>
  import("@/features/dashboard/PlaceholderPage").then((m) => ({
    default: m.PlaceholderPage,
  })),
);
const TestCreatePage = lazy(() =>
  import("@/features/tests/TestCreatePage").then((m) => ({
    default: m.TestCreatePage,
  })),
);
const TestDetailPage = lazy(() =>
  import("@/features/tests/TestDetailPage").then((m) => ({
    default: m.TestDetailPage,
  })),
);
const TestsPage = lazy(() =>
  import("@/features/tests/TestsPage").then((m) => ({ default: m.TestsPage })),
);

const FallbackLoader = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
    <Spinner />
  </div>
);

export function App() {
  return (
    <>
      <NotificationToaster />
      <Suspense fallback={<FallbackLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="app" element={<DashboardLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardHome />} />
              <Route path="articles" element={<ArticlesPage />} />
              <Route path="articles/mine" element={<MyArticlesPage />} />
              <Route path="articles/archive" element={<ArchivePage />} />
              <Route path="articles/trash" element={<ArticleTrashPage />} />
              <Route path="articles/new" element={<ArticleEditorPage />} />
              <Route path="articles/:id" element={<ArticleDetailPage />} />
              <Route path="articles/:id/edit" element={<ArticleEditorPage />} />
              <Route path="tests" element={<TestsPage />} />
              <Route path="tests/new" element={<TestCreatePage />} />
              <Route path="tests/:id/edit" element={<TestCreatePage />} />
              <Route path="tests/:id" element={<TestDetailPage />} />
              <Route path="components" element={<ComponentsPage />} />
              <Route
                path="leaderboard"
                element={
                  <PlaceholderPage
                    title="Lider lövhəsi"
                    body="Reytinq və nailiyyətlər modulu tezliklə əlavə olunacaq."
                  />
                }
              />
              <Route element={<ProtectedRoute roles={["researcher"]} />}>
                <Route
                  path="electro"
                  element={
                    <PlaceholderPage
                      title="Elektro modulu"
                      body="Komponent kitabxanası (Faza 3)."
                    />
                  }
                />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
