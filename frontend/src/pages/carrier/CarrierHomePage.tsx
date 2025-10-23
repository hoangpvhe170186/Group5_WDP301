import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CarrierDashboard } from "@/components/carrier-dashboard";
import { socket } from "@/lib/socket"; // ⚡ socket client

export default function CarrierHomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    const token = localStorage.getItem("auth_token");
    const userId = localStorage.getItem("user_id");

    if (!token) {
      navigate("/auth/login");
      return;
    }
    if (role?.toLowerCase() !== "carrier") {
      navigate("/");
      return;
    }

    // ⚡ Khi carrier vào trang dashboard => join socket room
    if (userId) {
      socket.emit("join", { id: userId, role: "carrier" });
      console.log(`🟢 Joined socket as carrier ${userId}`);
    }

    // Cleanup khi rời trang
    return () => {
      socket.off("join");
    };
  }, [navigate]);

  return <CarrierDashboard />;
}
