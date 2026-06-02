
import ScrollIndicator from "@components/ui/ScrollIndicator";
import HeroSection from "@components/sections/HeroSection";
import AboutSection from "@components/sections/AboutSection";
import SponsersSection from "@components/sections/SponsersSection";
import ContactUS from "@components/sections/ContactusSection";
import Footer from "@components/layout/Footer";



export default function Home() {
  return (
    <main
      className={`min-h-screen bg-white  font-comic overflow-x-hidden`}
    >
      <ScrollIndicator />
      <HeroSection />
      <AboutSection />
      <SponsersSection />
      <ContactUS />
      <Footer/>
    </main>
  );
}
