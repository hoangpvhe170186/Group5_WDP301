import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "@/lib/axios";
import { clearAuthData } from "@/lib/auth";
import { fallbackByRole } from "./ProtectedRoute";

type GuardState = "checking" | "allowed" | "blocked";

interface CustomerHomeGuardProps {
  children: React.ReactNode;
}

export default function CustomerHomeGuard({
  children,
}: CustomerHomeGuardProps) {
  const [state, setState] = useState<GuardState>("checking");
  const [redirectPath, setRedirectPath] = useState<string>("/");

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const token =
      localStorage.getItem("auth_token") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("auth_token");

    if (!token) {
      setState("allowed");
      return;
    }

    const checkRole = async () => {
      try {
        const response = await api.get("/users/me");
        if (cancelled) return;

        const user = response.data?.data || response.data?.user || null;
        const normalizedRole = String(user?.role || "").toLowerCase();

        if (normalizedRole === "customer") {
          setState("allowed");
          return;
        }

        if (!normalizedRole) {
          setState("allowed");
          return;
        }

        const fallback = fallbackByRole[normalizedRole] || "/";
        setRedirectPath(fallback);
        setState("blocked");
      } catch (error: any) {
        if (cancelled) return;

        if (error?.response?.status === 401) {
          clearAuthData();
          setState("allowed");
          return;
        }

        console.error("CustomerHomeGuard error:", error);
        setState("allowed");
      }
    };

    checkRole();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Đang kiểm tra phân quyền...
      </div>
    );
  }

  if (state === "blocked") {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

