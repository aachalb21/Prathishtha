"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Menu, X, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/Service/Stores";

const navLinks = [
  { name: "Aurum", href: "/events/aurum" },
  { name: "Olympus", href: "/events/olympus" },
  { name: "Verve", href: "/events/verve" },
  { name: "Yuva", href: "/events/yuva" },
  {
    name: "Leaderboard",
    href: "/leaderboard",
    icon: <Trophy size={18} className="inline ml-1 -mt-1" strokeWidth={2.5} />,
  },
  {
    name: "Dept Leaderboard",
    href: "/department-leaderboard",
    icon: <span className="inline ml-1 -mt-1">🏆</span>,
  },
];

function NavigationMobile() {
  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
    }, 250);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  return (
    <>
      {/* Inline styles for animations */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(-100%);
            opacity: 0;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        @keyframes staggerIn {
          from {
            transform: translateX(-20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .drawer-open {
          animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .drawer-close {
          animation: slideOut 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .overlay-open {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .overlay-close {
          animation: fadeOut 0.25s ease-out forwards;
        }
        .nav-item {
          animation: staggerIn 0.3s ease-out forwards;
          opacity: 0;
        }
      `}</style>

      <nav className="md:hidden fixed top-0 left-0 w-full z-50">
        {/* Top bar with hamburger */}
        <div className="relative flex items-center justify-between bg-linear-to-r from-purple-600 to-blue-500 border-b-4 border-black px-4 py-3">
          <div className="h-full flex items-center justify-center gap-3 ">
            <Image
              src="/Assets/Logo/sakec_white.png"
              alt="Prathistha Logo"
              width={80}
              height={40}
              className="h-10 w-auto"
              onClick={()=>router.push('https://sakec.ac.in/')}
            />
            <Image
              src="/Assets/Logo/sc_logo.png"
              alt="Prathistha Logo"
              width={80}
              height={40}
              className="h-10 w-auto"
              onClick={()=>router.push('/')}
            />
          </div>
          <button
            className="p-2 rounded border-2 border-black bg-white text-black z-50"
            onClick={handleOpen}
            aria-label="Open navigation menu"
          >
            <Menu size={28} />
          </button>
        </div>

        {/* Overlay and Drawer */}
        {open && (
          <>
            {/* Overlay */}
            <div
              className={`fixed inset-0 bg-black/40 z-40 ${isClosing ? 'overlay-close' : 'overlay-open'}`}
              onClick={handleClose}
              aria-hidden="true"
            />
            {/* Drawer */}
            <div className={`fixed top-0 left-0 h-full w-4/5 max-w-xs bg-white border-r-4 border-black shadow-2xl z-50 flex flex-col p-6 ${isClosing ? 'drawer-close' : 'drawer-open'}`}>
              {/* Pratishtha Logo at top */}
              <div className="flex justify-between mb-4">
                <Image
                  src="/Assets/Logo/Pratishtha_logo.png"
                  alt="Pratishtha Logo"
                  width={120}
                  height={60}
                  className="h-24 w-auto"
                  priority
                />
                <button
                  className="self-end mb-6 p-1 mt-2 rounded border-2 border-black bg-gray-100 text-black hover:bg-gray-200 transition-colors"
                  onClick={handleClose}
                  aria-label="Close navigation menu"
                >
                  <X size={28} />
                </button>
              </div>
              <nav className="flex flex-col gap-6 mb-6">
                {navLinks.map((link, index) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="nav-item text-lg font-comic font-bold text-black border-b-2 border-transparent hover:border-blue-500 transition flex items-center"
                    style={{ animationDelay: `${(index + 1) * 80}ms` }}
                    onClick={handleClose}
                  >
                    {link.name} {link.icon && link.icon}
                  </a>
                ))}
              </nav>
              <button 
                onClick={()=>{router.push(isAuthenticated ? '/dashboard' : '/sign-up'); handleClose();}} 
                className="nav-item w-full mb-6 relative bg-[#DC2626] hover:bg-[#B91C1C] px-5 py-2 font-bangers text-lg text-white border-2 border-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all duration-150 active:shadow-none active:translate-x-0.75 active:translate-y-0.75 -rotate-2"
                style={{ animationDelay: `${(navLinks.length + 1) * 80}ms` }}
              >
              {isAuthenticated ? 'Dashboard' : 'Sign Up'}
            </button>
            <div className="flex justify-center gap-4 p-2">
              <a
                href="https://www.instagram.com/pratishtha_sakecfest/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform drop-shadow-comic"
                aria-label="Instagram"
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="24"
                    cy="24"
                    r="22"
                    fill="#fff"
                    stroke="#000"
                    strokeWidth="2.5"
                  />
                  <rect
                    x="10"
                    y="10"
                    width="28"
                    height="28"
                    rx="8"
                    fill="#FFD700"
                    stroke="#000"
                    strokeWidth="3"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="7"
                    fill="#E1306C"
                    stroke="#000"
                    strokeWidth="2"
                  />
                  <circle
                    cx="31"
                    cy="17"
                    r="2"
                    fill="#fff"
                    stroke="#000"
                    strokeWidth="1"
                  />
                </svg>
              </a>
              <a
                href="https://whatsapp.com/channel/0029Vant5jpD38COvx6OuR3w"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform drop-shadow-comic"
                aria-label="WhatsApp"
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="24"
                    cy="24"
                    r="22"
                    fill="#fff"
                    stroke="#000"
                    strokeWidth="2.5"
                  />
                  <rect
                    x="10"
                    y="10"
                    width="28"
                    height="28"
                    rx="8"
                    fill="#25D366"
                    stroke="#000"
                    strokeWidth="3"
                  />
                  <path
                    d="M24 18a6 6 0 016 6c0 3.31-2.69 6-6 6a6 6 0 01-6-6c0-3.31 2.69-6 6-6z"
                    fill="#fff"
                    stroke="#000"
                    strokeWidth="2"
                  />
                  <path
                    d="M21 27l1-2 2 1 2-1-1 2-2-1z"
                    fill="#25D366"
                    stroke="#000"
                    strokeWidth="1"
                  />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/@PRATISHTHATheSAKECFest"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform drop-shadow-comic"
                aria-label="YouTube"
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="24"
                    cy="24"
                    r="22"
                    fill="#fff"
                    stroke="#000"
                    strokeWidth="2.5"
                  />
                  <rect
                    x="10"
                    y="10"
                    width="28"
                    height="28"
                    rx="8"
                    fill="#FF0000"
                    stroke="#000"
                    strokeWidth="3"
                  />
                  <polygon
                    points="21,20 34,24 21,28"
                    fill="#fff"
                    stroke="#000"
                    strokeWidth="1"
                  />
                </svg>
              </a>
            </div>
          </div>
        </>
      )}
    </nav>
    </>
  );
}

export default NavigationMobile;
