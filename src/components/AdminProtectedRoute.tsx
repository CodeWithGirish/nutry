import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "super_admin";
}

const AdminProtectedRoute = ({
  children,
  requiredRole = "admin",
}: AdminProtectedRouteProps) => {
  const { adminSession, isAuthenticated, loading, checkSession } =
    useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || !checkSession()) {
        navigate("/admin-login", { replace: true });
        return;
      }

      // Check role permissions
      if (
        requiredRole === "super_admin" &&
        adminSession?.role !== "super_admin"
      ) {
        navigate("/admin-login", { replace: true });
        return;
      }
    }
  }, [
    isAuthenticated,
    loading,
    adminSession,
    navigate,
    checkSession,
    requiredRole,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-lg">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !adminSession) {
    return null; // Will redirect in useEffect
  }

  // Check role access
  if (requiredRole === "super_admin" && adminSession.role !== "super_admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-300 mb-6">
            You don't have permission to access this area.
          </p>
          <button
            onClick={() => navigate("/admin-login")}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
