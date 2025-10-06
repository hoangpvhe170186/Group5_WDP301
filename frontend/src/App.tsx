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
// ... các trang khác: /portal (role), /login, ...

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/profile/:userId" element={<UserProfile />} />
        {/* <Route path="/portal" element={<RolePortal />} /> */}
          <Route path="/auth" element={<AuthPage />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="verify-otp" element={<VerifyOtpPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          {/* {/* <Route path="verify-otp" element={<VerifyOtpPage />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
