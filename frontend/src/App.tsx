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
import AdminDashboard from "./pages/AdminDashboard";
import Seller from "./pages/SellerPage";
import OrderCreatePage from "./pages/OrderCreatePage";
import OrderSearchPage from "./pages/OrderSearchPage";
import CarrierHomePage from "./pages/carrier/CarrierHomePage";
import OrderPreviewPage from "./components/OrderPreviewPage";
import SellerDriverApplications from "./components/seller/SellerDriverApplications";
import UserOrderLayout from "./layouts/User_Order_Layout";
import OrderTracking from "./components/user_order/order-tracking";
import ComparePage from "./components/carrier-dashboard/dashboard/compare";
import BlogDetail from "./pages/BlogDetail";
import DriverInterviewPage from "./components/carrier-dashboard/dashboard/DriverRecruitPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import CustomerChatPage from "./components/CustomerChatPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import PricingCard from "./components/PricingCard";
// ✅ Import trang Messages mới
import UserMessagesPage from "./pages/UserMessagesPage";
import EstimatePricePage from "./pages/EstimatePricePage";
import AdminDriverApplications from "./components/admin/AdminDriverApplications";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/tra-cuu-don-hang" element={<OrderSearchPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/pricing-info" element={<PricingCard packageName="Xe tải nhỏ" title="Bảng giá tham khảo" />} />
        <Route path="/blog/:slug" element={<BlogDetail />} />
        <Route path="/order-preview" element={<OrderPreviewPage />} />
        <Route path="/dat-hang" element={<OrderCreatePage />} />
         <Route path="/estimate-price" element={<EstimatePricePage />} />
        <Route path="/vehicles/:vehicleId/price" element={<VehiclePricingPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/profile/:userId" element={<UserProfile />} />
        <Route path="/thanh-toan" element={<CheckoutPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/carrier/home" element={<CarrierHomePage />} />
        <Route path="/carrier/compare/:orderId" element={<ComparePage />} />
        
        <Route path="/auth" element={<AuthPage />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="verify-otp" element={<VerifyOtpPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
        </Route>
        
        {/* ✅ Route chat độc lập (giữ lại để seller có thể share link) */}
        <Route path="/chat/order/:orderId" element={<CustomerChatPage />} />
        
        <Route path="/seller/home" element={<Seller />} />
        <Route path="/driver-recruit" element={<DriverInterviewPage />} />
        <Route path="/seller/driver-applications" element={<SellerDriverApplications />} />
        <Route path="/admin/driver-applications" element={<AdminDriverApplications />} />
        {/* ✅ Thêm route Messages vào User Order Layout */}
        <Route path="/myorder" element={<UserOrderLayout />}>
          <Route path="tracking" element={<OrderTracking />} />
          <Route path="history" element={<OrderHistoryPage />} />
          <Route path="messages" element={<UserMessagesPage />} /> 
        </Route>
        
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-cancel" element={<PaymentCancel />} />
      </Routes>
    </BrowserRouter>
  );
}