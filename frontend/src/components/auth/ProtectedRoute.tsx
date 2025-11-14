import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "@/lib/axios";
import { clearAuthData } from "@/lib/auth";

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

  const allowedRolesKey = useMemo(
    () => JSON.stringify(allowedRoles ?? []),
    [allowedRoles]
  );
  const normalizedAllowedRoles = useMemo(() => {
    try {
      const parsed: string[] = JSON.parse(allowedRolesKey);
      return parsed.map((role) => role.toLowerCase());
    } catch {
      return [];
    }
  }, [allowedRolesKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const getStoredToken = () =>
      localStorage.getItem("auth_token") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("auth_token");

    const verifyAuthorization = async () => {
      const token = getStoredToken();

      if (!token) {
        setStatus("unauthenticated");
        setRedirectPath("/auth/login");
        return;
      }

      try {
        const response = await api.get("/users/me");
        if (cancelled) return;

        const user = response.data?.data || response.data?.user || null;
        const normalizedRole = String(user?.role || "").toLowerCase();

        if (!normalizedRole) {
          setStatus("unauthenticated");
          setRedirectPath("/auth/login");
          return;
        }

        if (user?._id) {
          localStorage.setItem("user_id", user._id);
        }
        if (user?.role) {
          localStorage.setItem("user_role", user.role);
        }
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
        }

        if (
          !normalizedAllowedRoles.length ||
          normalizedAllowedRoles.includes(normalizedRole)
        ) {
          setStatus("authorized");
          return;
        }

        const fallback = fallbackByRole[normalizedRole] || "/";
        setRedirectPath(fallback);
        setStatus("forbidden");
      } catch (error: any) {
        if (cancelled) return;

        console.error("ProtectedRoute authorization error:", error);
        if (error?.response?.status === 401) {
          clearAuthData();
          setRedirectPath("/auth/login");
          setStatus("unauthenticated");
          return;
        }

        const storedRole = localStorage.getItem("user_role") || "";
        const fallback = fallbackByRole[storedRole.toLowerCase()] || "/";
        setRedirectPath(fallback);
        setStatus("forbidden");
      }
    };

    verifyAuthorization();

    return () => {
      cancelled = true;
    };
  }, [allowedRolesKey, normalizedAllowedRoles]);

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
