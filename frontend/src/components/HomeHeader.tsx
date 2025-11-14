import { Link, useNavigate } from "react-router-dom";
import { clearAuthData } from "@/lib/auth";
import { useEffect, useRef, useState } from "react";

// ✅ Bước 1: Định nghĩa một kiểu dữ liệu (interface) cho User
interface User {
  _id: string;
  full_name: string;
  email: string;
  role: string;
}

// ===================================================================
// Dropdown Component (Giữ nguyên)
// ===================================================================
function Dropdown({
  label,
  isScrolled,
  openKey,
  currentOpen,
  setCurrentOpen,
  children,
  btnClass = "font-medium",
}: {
  label: string;
  isScrolled: boolean;
  openKey: string;
  currentOpen: null | string;
  setCurrentOpen: (k: null | string) => void;
  children: React.ReactNode;
  btnClass?: string;
}) {
  const baseText = isScrolled ? "text-gray-700 hover:text-purple-600" : "text-white hover:text-gray-200";
  const closeTimer = useRef<number | null>(null);

  const open = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setCurrentOpen(openKey);
  };

  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setCurrentOpen(null);
      closeTimer.current = null;
    }, 140);
  };

  return (
    <div className="relative" role="menu" onMouseEnter={open} onMouseLeave={scheduleClose}>
      <button
        className={`${btnClass} text-lg ${baseText}`}
        aria-haspopup="true"
        aria-expanded={currentOpen === openKey}
        onClick={() => setCurrentOpen(currentOpen === openKey ? null : openKey)}
      >
        {label} ▾
      </button>
      {currentOpen === openKey && (
        <div
          className="absolute left-0 top-full mt-2 w-56 rounded-xl border bg-white p-2 text-sm shadow-xl"
          role="menu"
          onMouseEnter={open}
          onMouseLeave={scheduleClose}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ===================================================================
// MobileMenu Component (Giữ nguyên)
// ===================================================================
function MobileMenu({
  isScrolled,
  user,
  onLogout,
}: {
  isScrolled: boolean;
  user: User | null;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const baseText = isScrolled ? "text-gray-700" : "text-white";

  return (
    <div className="md:hidden">
      <button aria-label="Mở menu" className={`rounded-lg p-2 ${baseText}`} onClick={() => setOpen((v) => !v)}>
        ☰
      </button>
      {open && (
        <div className="absolute left-0 top-full w-full bg-white/95 p-4 shadow-lg backdrop-blur">
          <div className="space-y-2 text-gray-800">
            {/* Các link menu (có thể thêm các link khác vào đây nếu cần) */}
            <Link to="/chuyen-nha" className="block rounded-lg p-2 hover:bg-gray-50">Chuyển nhà / Chuyển trọ</Link>
            <Link to="/lien-he" className="block rounded-lg p-2 hover:bg-gray-50">Liên hệ</Link>
            <div className="mt-3 border-t pt-3">
              {user ? (
                <>
                  <div className="block rounded-lg p-2 font-semibold">
                    Hello, {user.full_name}
                  </div>
                  <Link to="/profile" className="block rounded-lg p-2 hover:bg-gray-50">Profile</Link>
                  <button onClick={onLogout} className="mt-1 w-full rounded-lg border p-2 text-left text-red-600 hover:bg-red-50">
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link to="/auth/login" className="block rounded-lg p-2 hover:bg-gray-50">Đăng nhập</Link>
                  <Link to="/auth/register" className="mt-1 block rounded-lg bg-orange-500 p-2 text-center font-semibold text-white hover:bg-orange-600">
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ===================================================================
// HomeHeader Component (Component chính đã được tích hợp)
// ===================================================================
export default function HomeHeader() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<null | string>(null);
  
  // ✅ State để lưu trữ thông tin người dùng
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Lắng nghe sự kiện cuộn trang
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);

    // Đọc thông tin người dùng từ localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem("user");
      }
    }

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ✅ Hàm đăng xuất
  const onLogout = () => {
    clearAuthData();
    setUser(null);
    navigate("/");
  };

  const baseText = isScrolled ? "text-gray-700 hover:text-purple-600" : "text-white hover:text-gray-200";
  const btnOutline = isScrolled ? "border-gray-300 text-gray-700 hover:bg-gray-50" : "border-white text-white hover:bg-white hover:text-purple-600";

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-300 ${isScrolled ? "bg-white shadow-md" : "bg-transparent"}`}>
      <div className="flex w-full items-center justify-between px-4 sm:px-8 lg:px-12 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 font-bold">
          <svg
                viewBox="0 0 24 24"
                className="w-10 h-10 text-orange-500"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" />
              </svg>
          <span className="hidden sm:inline text-xl sm:text-2xl lg:text-3xl">
            <span className={`bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent ${isScrolled ? "" : "drop-shadow"}`}>
              Home Express
            </span>
          </span>
        </Link>

        {/* ⭐️ Navigation cho Desktop (ĐÃ ĐƯỢC CẬP NHẬT) ⭐️ */}
        <nav className="hidden items-center gap-6 md:flex">
          {/* Dịch vụ */}
          <Dropdown label="Dịch vụ" isScrolled={isScrolled} openKey="dichvu" currentOpen={openMenu} setCurrentOpen={setOpenMenu} btnClass="font-semibold">
            <Link to="/chuyen-nha" className="block rounded-lg px-3 py-2 hover:bg-gray-50" role="menuitem">Chuyển nhà / Chuyển trọ</Link>
            <Link to="/chuyen-van-phong" className="block rounded-lg px-3 py-2 hover:bg-gray-50" role="menuitem">Chuyển văn phòng</Link>
            <Link to="/doi-xe" className="block rounded-lg px-3 py-2 hover:bg-gray-50" role="menuitem">Đội xe & Bảng xe (Van, Tải)</Link>
          </Dropdown>

          {/* Tuyển dụng */}
          <Dropdown label="Tuyển dụng" isScrolled={isScrolled} openKey="tuyendung" currentOpen={openMenu} setCurrentOpen={setOpenMenu}>
            <Link to="/driver-recruit" className="block rounded-lg px-3 py-2 hover:bg-gray-50" role="menuitem">Tuyển tài xế</Link>
          </Dropdown>


          {/* Về Home Express */}
          <Dropdown label="Về Home Express" isScrolled={isScrolled} openKey="vehe" currentOpen={openMenu} setCurrentOpen={setOpenMenu}>
            <Link to="/gioi-thieu" className="block rounded-lg px-3 py-2 hover:bg-gray-50" role="menuitem">Giới thiệu</Link>
            <Link to="/lien-he" className="block rounded-lg px-3 py-2 hover:bg-gray-50" role="menuitem">Liên hệ</Link>
            <Link to="/ho-tro" className="block rounded-lg px-3 py-2 hover:bg-gray-50" role="menuitem">Hỗ trợ & FAQ</Link>
          </Dropdown>
          
          {/* ✅ Khối hiển thị Đăng nhập/Thông tin người dùng */}
          <div className="flex items-center gap-4">
            {user ? (
              // --- Khi đã đăng nhập ---
              <>
                <Dropdown label={`Hello, ${user.full_name}`} isScrolled={isScrolled} openKey="userMenu" currentOpen={openMenu} setCurrentOpen={setOpenMenu} btnClass="font-semibold">
                   <Link to="/profile" className="block rounded-lg px-3 py-2 hover:bg-gray-50" role="menuitem">Profile</Link>
                   <Link to="/myorder/tracking" className="block rounded-lg px-3 py-2 hover:bg-gray-50" role="menuitem">My Order</Link>
                   <Link to="/myorder/history" className="block rounded-lg px-3 py-2 hover:bg-gray-50" role="menuitem">Lịch sử đơn hàng</Link>
                   <button onClick={onLogout} className="w-full text-left rounded-lg px-3 py-2 text-red-600 hover:bg-red-50" role="menuitem">
                     Đăng xuất
                   </button>
                </Dropdown>
              </>
            ) : (
              // --- Khi chưa đăng nhập ---
              <>
                <Link to="/auth/login" className={`rounded-xl border px-4 py-2 font-medium transition-all ${btnOutline}`}>
                  Đăng nhập
                </Link>
                <Link to="/auth/register" className="rounded-xl bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Navigation cho Mobile */}
        <MobileMenu
          isScrolled={isScrolled}
          user={user}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}
