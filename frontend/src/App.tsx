// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import UserProfilePage from "./pages/UserProfilePage";
import UserProfile from "./components/UserProfile";
// ... các trang khác: /portal (role), /login, ...

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/profile/:userId" element={<UserProfile />} />
        {/* <Route path="/portal" element={<RolePortal />} /> */}
      </Routes>
    </BrowserRouter>
  );
}
