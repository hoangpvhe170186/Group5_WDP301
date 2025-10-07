import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

/** Reusable Dropdown (hover to open, delayed close, items clickable) */
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
  openKey: "dichvu" | "tuyendung" | "vehe";
  currentOpen: null | "dichvu" | "tuyendung" | "vehe";
  setCurrentOpen: (k: null | "dichvu" | "tuyendung" | "vehe") => void;
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
    }, 140); // nhỏ thôi để không “tắt sớm”
  };

  return (
    <div
      className="relative"
      role="menu"
      onMouseEnter={open}
      onMouseLeave={scheduleClose}
    >
      <button
        className={`${btnClass} text-lg ${baseText}`}
        aria-haspopup="true"
        aria-expanded={currentOpen === openKey}
        // Click chỉ toggle mở/đóng menu, KHÔNG ngăn điều hướng của item bên trong
        onClick={() => setCurrentOpen(currentOpen === openKey ? null : openKey)}
        onKeyDown={(e) => {
          if (["Enter", " ", "ArrowDown"].includes(e.key)) open();
          if (["Escape"].includes(e.key)) setCurrentOpen(null);
        }}
      >
        {label} ▾
      </button>

      {currentOpen === openKey && (
        <div
          className="absolute left-0 top-full mt-2 w-56 rounded-xl border bg-white p-2 text-sm shadow-xl"
          role="menu"
          // Giữ mở khi di vào menu; rời ra mới bắt đầu đếm giờ đóng
          onMouseEnter={open}
          onMouseLeave={scheduleClose}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function HomeHeader() {
  const nav = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<null | "dichvu" | "tuyendung" | "vehe">(null);

  const isLoggedIn = Boolean(localStorage.getItem("role"));

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onLogout = () => {
    localStorage.removeItem("role");
    nav("/");
  };

  const baseText =
    isScrolled ? "text-gray-700 hover:text-purple-600" : "text-white hover:text-gray-200";
  const btnOutline =
    isScrolled
      ? "border-gray-300 text-gray-700 hover:bg-gray-50"
      : "border-white text-white hover:bg-white hover:text-purple-600";

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? "bg-white shadow-md" : "bg-transparent"
      }`}
    >
      <div className="flex w-full items-center justify-between px-12 py-6">
        <Link to="/" className="flex items-center gap-3 font-bold">
          <div className="flex h-12 w-12 text-lg items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            HE
          </div>
          <span className="text-3xl">
            <span
              className={`bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent ${
                isScrolled ? "" : "drop-shadow"
              }`}
            >
              Home Express
            </span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {/* Dịch vụ */}
          <Dropdown
            label="Dịch vụ"
            isScrolled={isScrolled}
            openKey="dichvu"
            currentOpen={openMenu}
            setCurrentOpen={setOpenMenu}
            btnClass="font-semibold"
          >
            <Link to="/chuyen-nha" className="block rounded-lg px-3 py-2 hover:bg-gray-50" role="menuitem">
              Chuyển nhà / Chuyển trọ
            </Link>
            <Link to="/chuyen-van-phong" className="block rounded-lg px-3 py-2 hover:bg-gray-50" role="menuitem">
              Chuyển văn phòng
            </Link>
            <Link to="/doi-xe" className="block rounded-lg px-3 py-2 hover:bg-gray-50" role="menuitem">
              Đội xe & Bảng xe (Van, Tải)
            </Link>
          </Dropdown>

          {/* Tuyển dụng */}
          <Dropdown
            label="Tuyển dụng"
            isScrolled={isScrolled}
            openKey="tuyendung"
            currentOpen={openMenu}
            setCurrentOpen={setOpenMenu}
          >
            <Link to="/tuyen-tai-xe" className="block rounded-lg px-3 py-2 hover:bg-gray-50" role="menuitem">
              Tuyển tài xế
            </Link>
            <Link to="/tuyen-boc-xep" className="block rounded-lg px-3 py-2 hover:bg-gray-50" role="menuitem">
              Tuyển người bốc xếp
            </Link>
          </Dropdown>

          <Link to="/bang-gia" className={`font-medium ${baseText}`}>
            Bảng giá
          </Link>

          {/* Về Home Express */}
          <Dropdown
            label="Về Home Express"
            isScrolled={isScrolled}
            openKey="vehe"
            currentOpen={openMenu}
            setCurrentOpen={setOpenMenu}
          >
            <Link to="/gioi-thieu" className="block rounded-lg px-3 py-2 hover:bg-gray-50" role="menuitem">
              Giới thiệu
            </Link>
            <Link to="/lien-he" className="block rounded-lg px-3 py-2 hover:bg-gray-50" role="menuitem">
              Liên hệ
            </Link>
            <Link to="/ho-tro" className="block rounded-lg px-3 py-2 hover:bg-gray-50" role="menuitem">
              Hỗ trợ & FAQ
            </Link>
          </Dropdown>

          {/* Quốc gia / ngôn ngữ (tĩnh) */}
          <span className={`text-sm ${baseText}`}>Việt Nam · Tiếng Việt</span>

          {/* Auth / Portal */}
          {isLoggedIn ? (
            <>
              <Link to="/portal" className={`font-medium ${baseText}`}>
                Portal
              </Link>
              <Link to="/dashboard" className={`font-medium ${baseText}`}>
                Dashboard
              </Link>
              <button
                onClick={onLogout}
                className={`rounded-xl border px-4 py-2 font-medium transition-all ${btnOutline}`}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth/login"
                className={`rounded-xl border px-4 py-2 font-medium transition-all ${btnOutline}`}
              >
                Đăng nhập
              </Link>
              <Link
                to="/auth/register"
                className="rounded-xl bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
              >
                Đăng ký
              </Link>
            </>
          )}
        </nav>

        {/* Mobile trigger giữ nguyên như bạn đang có */}
        <MobileMenu
          isScrolled={isScrolled}
          isLoggedIn={isLoggedIn}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}

/** ————— Mobile menu giữ nguyên code cũ của bạn ————— */
function MobileMenu({
  isScrolled,
  isLoggedIn,
  onLogout,
}: Readonly<{
  isScrolled: boolean;
  isLoggedIn: boolean;
  onLogout: () => void;
}>) {
  const [open, setOpen] = useState(false);
  const baseText =
    isScrolled ? "text-gray-700 hover:text-purple-600" : "text-white hover:text-gray-200";

  return (
    <div className="md:hidden">
      <button
        aria-label="Mở menu"
        className={`rounded-lg p-2 ${baseText}`}
        onClick={() => setOpen((v) => !v)}
      >
        ☰
      </button>

      {open && (
        <div className="absolute left-0 top-full w-full bg-white/95 p-4 shadow-lg backdrop-blur">
          <div className="space-y-2 text-gray-800">
            <Link to="/chuyen-nha" className="block rounded-lg p-2 hover:bg-gray-50">
              Dịch vụ: Chuyển nhà / Chuyển trọ
            </Link>
            <Link to="/chuyen-van-phong" className="block rounded-lg p-2 hover:bg-gray-50">
              Dịch vụ: Chuyển văn phòng
            </Link>
            <Link to="/doi-xe" className="block rounded-lg p-2 hover:bg-gray-50">
              Đội xe & Bảng xe
            </Link>
            <Link to="/tuyen-tai-xe" className="block rounded-lg p-2 hover:bg-gray-50">
              Tuyển tài xế
            </Link>
            <Link to="/tuyen-boc-xep" className="block rounded-lg p-2 hover:bg-gray-50">
              Tuyển người bốc xếp
            </Link>
            <Link to="/bang-gia" className="block rounded-lg p-2 hover:bg-gray-50">
              Bảng giá
            </Link>
            <Link to="/gioi-thieu" className="block rounded-lg p-2 hover:bg-gray-50">
              Giới thiệu
            </Link>
            <Link to="/lien-he" className="block rounded-lg p-2 hover:bg-gray-50">
              Liên hệ
            </Link>
            <Link to="/ho-tro" className="block rounded-lg p-2 hover:bg-gray-50">
              Hỗ trợ & FAQ
            </Link>

              <div className="mt-3 border-t pt-3">
                {isLoggedIn ? (
                  <>
                    <Link to="/portal" className="block rounded-lg p-2 hover:bg-gray-50">
                      Portal
                    </Link>
                    <Link to="/dashboard" className="block rounded-lg p-2 hover:bg-gray-50">
                      Dashboard
                    </Link>
                    <button
                      onClick={onLogout}
                      className="mt-1 w-full rounded-lg border p-2 text-left hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="block rounded-lg p-2 hover:bg-gray-50">
                      Đăng nhập
                    </Link>
                    <Link
                      to="/register"
                      className="mt-1 block rounded-lg bg-orange-500 p-2 text-center font-semibold text-white hover:bg-orange-600"
                    >
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
