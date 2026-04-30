import type { UserRole } from "@akademik/shared";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  roles?: UserRole[];
};

export function ProtectedRoute({ roles }: Props) {
  const { hydrated, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!hydrated) {
    return (
      <div className="auth-page">
        <Spinner label="Sessiya yoxlanılır" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles?.length && user && !roles.includes(user.role)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
}
