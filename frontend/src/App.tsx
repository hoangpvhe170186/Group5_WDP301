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
import CheckoutPage from "./pages/CheckoutPage";
// ... các trang khác: /portal (role), /login, ...
import AdminDashboard from "./pages/AdminDashboard";
import Seller from "./pages/SellerPage";
import OrderCreatePage from "./pages/OrderCreatePage";
import OrderSearchPage from "./pages/OrderSearchPage";
// ✅ IMPORT CARRIER PAGE
import CarrierHomePage from "./pages/carrier/CarrierHomePage";
import OrderPreviewPage from "./components/OrderPreviewPage";
// ✅ IMPORT USER ORDER
import SellerDriverApplications from "./components/seller/SellerDriverApplications";
import UserOrderLayout from "./layouts/User_Order_Layout";
import OrderTracking from "./components/user_order/order-tracking";
import ComparePage from "./components/carrier-dashboard/dashboard/compare";
import BlogDetail from "./pages/BlogDetail";
import DriverInterviewPage from "./components/carrier-dashboard/dashboard/DriverRecruitPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ✅ ROUTE MỚI CHO TRA CỨU ĐƠN HÀNG */}
        <Route path="/tra-cuu-don-hang" element={<OrderSearchPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/blog/:slug" element={<BlogDetail />} />
        <Route path="/order-preview" element={<OrderPreviewPage />} />
        <Route path="/dat-hang" element={<OrderCreatePage />} />
        <Route path="/vehicles/:vehicleId/price" element={<VehiclePricingPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/profile/:userId" element={<UserProfile />} />
        <Route path="/thanh-toan" element={<CheckoutPage />} />
        {/* <Route path="/portal" element={<RolePortal />} /> */}
        <Route path="/profile/:userId" element={<UserProfile />} />      
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/carrier/home" element={<CarrierHomePage />} />
        <Route path="/carrier/compare/:orderId" element={<ComparePage />} />
        <Route path="/auth" element={<AuthPage />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="verify-otp" element={<VerifyOtpPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
        </Route>
        <Route path="/seller/home" element={<Seller />}></Route>
        <Route path="/driver-recruit" element={<DriverInterviewPage />} />
        <Route path="/seller/driver-applications" element={<SellerDriverApplications />} />
        <Route path="/myorder" element={<UserOrderLayout />}>
          <Route path="tracking" element={<OrderTracking />} />
          <Route path="history" element={<OrderHistoryPage />} />
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
}