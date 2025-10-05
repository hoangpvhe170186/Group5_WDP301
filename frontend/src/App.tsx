// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import RegisterPage from "./components/auth/register";
import LoginPage from "./components/auth/login";
import VerifyOtpPage from "./components/auth/verifyOTP";


// ... các trang khác: /portal (role), /login, ...

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />}>
          <Route path="login" element={<LoginPage />} />
          {/* <Route path="register" element={<RegisterPage />} /> */}
          {/* <Route path="verify-otp" element={<VerifyOtpPage />} /> */}
        </Route>
     
      </Routes>
    </BrowserRouter>
  );
}
