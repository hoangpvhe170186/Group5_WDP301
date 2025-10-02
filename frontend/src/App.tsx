// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
// ... các trang khác: /portal (role), /login, ...

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* <Route path="/portal" element={<RolePortal />} /> */}
      </Routes>
    </BrowserRouter>
  );
}
