import React from "react";
import HeroSection from "../components/sections/HeroSection";
import FeatureSection from "../components/sections/FeatureSection";
import ServiceSection from "../components/sections/ServiceSection";
import VehicleSection from "../components/sections/VehicleSection";
import BlogSection from "../components/sections/BlogSection";
import FAQSection from "../components/sections/FAQSection";

 import HomeHeader from "../components/HomeHeader";
 import HomeFooter from "../components/HomeFooter";

export default function HomePage() {
  return (
    <>
    <HomeHeader /> 
      <main className="min-h-screen bg-white">
        <HeroSection />
        <FeatureSection />
        <ServiceSection />
        <VehicleSection />
        <BlogSection />
        <FAQSection />
      </main>
     <HomeFooter />
    </>
  );
}
