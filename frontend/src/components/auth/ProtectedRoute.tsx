import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: string[];
};

const fallbackByRole: Record<string, string> = {
  admin: "/admin/dashboard",
  seller: "/seller/home",
  carrier: "/carrier/home",
  driver: "/carrier/home",
  customer: "/",
};

export default function ProtectedRoute({
  children,
  allowedRoles = [],
}: ProtectedRouteProps) {
  const location = useLocation();
  const [status, setStatus] = useState<
    "checking" | "unauthenticated" | "forbidden" | "authorized"
  >("checking");
  const [redirectPath, setRedirectPath] = useState<string>("/");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token =
      localStorage.getItem("auth_token") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("auth_token");
    const role = localStorage.getItem("user_role") || "";
    const normalizedRole = role.toLowerCase();

    if (!token) {
      setStatus("unauthenticated");
      setRedirectPath("/auth/login");
      return;
    }

    if (!allowedRoles.length) {
      setStatus("authorized");
      return;
    }

    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

    if (normalizedAllowed.includes(normalizedRole)) {
      setStatus("authorized");
      return;
    }

    const fallback = fallbackByRole[normalizedRole] || "/";
    setRedirectPath(fallback);
    setStatus("forbidden");
  }, [allowedRoles]);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Navigate to={redirectPath} replace state={{ from: location.pathname }} />
    );
  }

  if (status === "forbidden") {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

