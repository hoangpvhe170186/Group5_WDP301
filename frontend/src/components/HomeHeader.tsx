import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

// ✅ Bước 1: Định nghĩa một kiểu dữ liệu (interface) cho User
interface User {
  _id: string;
  full_name: string;
  email: string;
  role: string;
}

// ===================================================================
// Dropdown Component (Giữ nguyên code gốc của bạn vì nó không đổi)
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
// MobileMenu Component (Được cập nhật để sử dụng state 'user')
// ===================================================================
function MobileMenu({
  isScrolled,
  user,
  onLogout,
}: {
  isScrolled: boolean;
  user: User | null; // ✅ Nhận vào object user thay vì boolean
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
            {/* Các link menu */}
            <Link to="/bang-gia" className="block rounded-lg p-2 hover:bg-gray-50">Bảng giá</Link>
            {/* ...Thêm các link khác của bạn ở đây... */}

            <div className="mt-3 border-t pt-3">
              {user ? ( // ✅ Hiển thị dựa trên state 'user'
                <>
                  <div className="block rounded-lg p-2 font-semibold">
                    Hello, {user.full_name}
                  </div>
                  <Link to="/dashboard" className="block rounded-lg p-2 hover:bg-gray-50">Dashboard</Link>
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
// HomeHeader Component (Component chính đã được cập nhật)
// ===================================================================
export default function HomeHeader() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<null | string>(null);
  
  // ✅ Bước 2: Tạo state để lưu trữ thông tin người dùng
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Giữ lại logic lắng nghe sự kiện cuộn trang
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);

    // ✅ Bước 3: Đọc thông tin người dùng từ localStorage khi component tải
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem("user"); // Xóa dữ liệu lỗi
      }
    }

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ✅ Bước 4: Cập nhật hàm đăng xuất
  const onLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("auth_token");
    setUser(null); // Cập nhật UI ngay lập tức
    navigate("/");
  };

  const baseText = isScrolled ? "text-gray-700 hover:text-purple-600" : "text-white hover:text-gray-200";
  const btnOutline = isScrolled ? "border-gray-300 text-gray-700 hover:bg-gray-50" : "border-white text-white hover:bg-white hover:text-purple-600";

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-300 ${isScrolled ? "bg-white shadow-md" : "bg-transparent"}`}>
      <div className="flex w-full items-center justify-between px-4 sm:px-8 lg:px-12 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 font-bold">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 text-lg items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            HE
          </div>
          <span className="hidden sm:inline text-xl sm:text-2xl lg:text-3xl">
            <span className={`bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent ${isScrolled ? "" : "drop-shadow"}`}>
              Home Express
            </span>
          </span>
        </Link>

        {/* Navigation cho Desktop */}
        <nav className="hidden items-center gap-6 md:flex">
          {/* Các mục menu dropdown */}
          <Dropdown label="Dịch vụ" isScrolled={isScrolled} openKey="dichvu" currentOpen={openMenu} setCurrentOpen={setOpenMenu} btnClass="font-semibold">
            <Link to="/chuyen-nha" className="block rounded-lg px-3 py-2 hover:bg-gray-50">Chuyển nhà / Chuyển trọ</Link>
          </Dropdown>
          

          {/* ✅ Bước 5: Khối hiển thị Đăng nhập/Thông tin người dùng */}
          <div className="flex items-center gap-4">
            {user ? (
              // --- Khi đã đăng nhập ---
              <>
                <span className={`font-semibold ${baseText}`}>
                  Hello, {user.full_name}
                </span>
                <button onClick={onLogout} className={`rounded-xl border px-4 py-2 font-medium transition-all ${btnOutline}`}>
                  Đăng xuất
                </button>
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