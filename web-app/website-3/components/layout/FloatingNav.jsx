'use client';


import { usePathname, useRouter } from 'next/navigation';
import ComicSocialIcons from '../ui/ComicSocialIcons';


import React, { useEffect, useRef, useState } from 'react';

export default function FloatingNav({ items = ['Home', 'Team', 'Gallery','Events'] }) {
  const pathname = usePathname();
  const router = useRouter();
  const routes = ['/', '/team', '/gallery', '/events'];
  const activeIndex = routes.findIndex(route => pathname === route);

  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const hideTimeout = useRef(null);

  // Auto-hide after interval
  useEffect(() => {
    if (visible) {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      hideTimeout.current = setTimeout(() => setVisible(false), 3000); // 3 seconds
    }
    return () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, [visible]);

  // Hide on scroll up, show on scroll down
  useEffect(() => {
    lastScrollY.current = typeof window !== 'undefined' ? window.scrollY : 0;
    const handleScroll = () => {
      const currentScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
      if (currentScrollY < lastScrollY.current) {
        // Scrolling up
        setVisible(false);
      } else {
        // Scrolling down
        setVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Show on mouse interaction
  useEffect(() => {
    const showNav = () => setVisible(true);
    window.addEventListener('mousemove', showNav);
    window.addEventListener('touchstart', showNav);
    return () => {
      window.removeEventListener('mousemove', showNav);
      window.removeEventListener('touchstart', showNav);
    };
  }, []);

  return (
    <>
      <div
        className={`text-black fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500 ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Tilted Shadow Background */}
        <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 -rotate-2" />
        {/* Main Nav Container */}
        <div className="relative bg-white border-4 border-black p-1.5 flex gap-2 sm:gap-4 max-w-full overflow-x-auto">
          {items.map((item, idx) => (
            <button 
              key={item} 
              onClick={() => router.push(routes[idx])}
              className={`px-4 py-1 font-normal font-comic uppercase text-sm sm:text-base border-2 border-transparent hover:bg-[#FFD700] hover:border-black transition-colors whitespace-nowrap ${idx === activeIndex ? 'bg-[#FFD700] border-black' : ''}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {/* Comic Social Icons at right bottom - hidden on mobile */}
      <div className="hidden sm:block fixed bottom-8 right-8 z-50">
        <ComicSocialIcons />
      </div>
    </>
  );
}
