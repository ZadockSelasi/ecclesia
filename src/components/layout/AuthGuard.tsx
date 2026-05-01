import { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useStore } from "../../hooks/useStore";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { currentUser, appUser, loading } = useStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-black">
        <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!appUser) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
