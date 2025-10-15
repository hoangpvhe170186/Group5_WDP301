import { Outlet } from "react-router-dom";
import Navbar from "../components//seller/Navbar";

export default function SellerLayout() {
  return (
    <>  
        <Navbar />
        <Outlet/>
    </>
  );
}