import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CarrierDashboard } from "@/components/carrier-dashboard";

export default function CarrierHomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/auth/login");
      return;
    }
    if (role?.toLowerCase() !== "carrier") {
      navigate("/");
      return;
    }
  }, [navigate]);

  return <CarrierDashboard />;
}
