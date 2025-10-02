import { Outlet } from "react-router-dom";
import HomeHeader from "../components/HomeHeader";
import HomeFooter from "../components/HomeFooter";

export default function HomeLayout() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <HomeHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <HomeFooter />
    </div>
  );
}