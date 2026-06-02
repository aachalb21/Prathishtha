"use client";

import { ArrowDown } from "lucide-react";
import { useState, useEffect } from "react";

export default function ScrollIndicator({ 
  text = "SCROLL", 
  hideAfter = 100,
  position = "left" // "left" or "right"
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY < hideAfter);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hideAfter]);

  const positionClasses = position === "left" 
    ? "left-4 md:left-10 rotate-[-5deg]" 
    : "right-4 md:right-10 rotate-[5deg]";

  const slideDirection = position === "left" 
    ? "-translate-x-10" 
    : "translate-x-10";

  return (
    <div 
      className={`fixed ${positionClasses} top-[45%] text-black flex flex-col items-center z-50 transition-all duration-500 ease-in-out ${
        isVisible ? "opacity-100 translate-x-0" : `opacity-0 ${slideDirection} pointer-events-none`
      } hidden sm:flex`}
    >
      <div className="bg-white border-4 border-black px-2 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <span className="font-bangers text-lg [writing-mode:vertical-lr] tracking-widest rotate-180">
          {text}
        </span>
      </div>
      <ArrowDown
        size={32}
        className="text-white drop-shadow-[2px_2px_0_#000] mt-2 animate-bounce"
      />
    </div>
  );
}
