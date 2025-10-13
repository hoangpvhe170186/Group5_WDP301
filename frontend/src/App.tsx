// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AuthPage from "./layouts/AuthLayout";
import UserProfilePage from "./pages/UserProfilePage";
import UserProfile from "./components/UserProfile";
import LoginPage from "./components/auth/loginform";
import RegisterPage from "./components/auth/registerform";
import VerifyOtpPage from "./components/auth/verify-otp";
import ForgotPasswordPage from "./components/auth/forgot-password";
import VehiclePricingPage from "./pages/VehiclePricingPage";

// ✅ IMPORT CARRIER PAGE
import CarrierHomePage from "./pages/carrier/CarrierHomePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/vehicles/:vehicleId/price" element={<VehiclePricingPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/profile/:userId" element={<UserProfile />} />

        {/* ✅ ROUTE CHO CARRIER */}
        <Route path="/carrier/home" element={<CarrierHomePage />} />

        <Route path="/auth" element={<AuthPage />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="verify-otp" element={<VerifyOtpPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}