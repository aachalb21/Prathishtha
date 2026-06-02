'use client';
import Image from "next/image";
import { Trophy } from "lucide-react";

import { useRouter } from "next/navigation";

import NavigationMobile from "../ui/Mobile/Navigation-mobile";
import { useAuthStore } from "../../app/Service/Stores";

export default function Navigation() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  return (
    <nav className="fixed top-0 left-0  w-full space-x-2 md:h-20 h-auto z-50 pb-2 bg-white border-b-4 border-black overflow-hidden">
      <div className="hidden md:flex gap-2 h-full">
        {/* LEFT PANEL */}
        <div className="relative w-[22%] border-4 border-black bg-[#FFD700] -skew-x-12">
          <div className="h-full flex items-center justify-center skew-x-12 gap-3 ">
            <Image
              src="/Assets/Logo/SAKEC_LOGO_BG_REMOVED.png"
              alt="Prathistha Logo"
              width={80}
              height={40}
              className="h-10 w-auto hover:cursor-pointer"
              onClick={()=>router.push('https://sakec.ac.in/')}
              
            />
            <Image
              src="/Assets/Logo/SC_LOGO_BG_REMOVED.png"
              alt="Prathistha Logo"
              width={80}
              height={40}
              className="h-10 w-auto hover:cursor-pointer"
              onClick={()=>router.push('/')}
            />
          </div>
        </div>

        {/* CENTER PANEL */}
        <div className="relative flex-1 bg-linear-to-r border-4 border-black from-purple-600 to-blue-500 -skew-x-12 overflow-hidden">
          {/* Speed Lines Overlay */}
          <div
            className="absolute inset-0 pointer-events-none bg-[url('/Assets/Background/speed-lines.png')] bg-cover bg-center opacity-70 mix-blend-multiply"
            aria-hidden="true"
          />

          {/* Event Navigation*/}
          <div className="h-full flex items-center justify-center skew-x-12 gap-6 relative z-10">
            <ul className="flex gap-12 font-comic text-white font-medium uppercase text-xl">
              {[ "Aurum", "Olympus", "Verve","yuva"].map((item) => (
                <li
                  key={item}
                  className="hover:underline cursor-pointer"
                  onClick={() => router.push(`/events/${item.toLowerCase()}`)}
                >
                  {item}
                </li>
              ))}
              {/* <li
                className="hover:underline cursor-pointer"
                onClick={() => router.push("/shop")}
              >
                Shop
              </li> */}
            </ul>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="relative w-[26%] border-4 border-black bg-[#3b82f6] -skew-x-12">
          {/* Halftone Dot Overlay */}
          <div
            className="absolute inset-0 pointer-events-none bg-[url('/Assets/Background/halftone-dots.png')] bg-repeat opacity-50"
            aria-hidden="true"
          />
          <div className="h-full flex items-center justify-center gap-4 skew-x-12 relative z-10">
            {/* Leaderboard Icon */}
            <button
              onClick={() => {
                router.push("/leaderboard");
              }}
              className="relative bg-[#FFD700] p-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all duration-150 active:shadow-none active:translate-x-0.75 active:translate-y-0.75 rotate-3"
            >
              <Trophy size={20} className="text-black" strokeWidth={2.5} />
            </button>
            {/* Department Leaderboard Button */}
            <button
              onClick={() => {
                router.push("/department-leaderboard");
              }}
              className="relative bg-[#38bdf8] px-4 py-1.5 font-bangers text-base text-white border-2 border-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-[#0ea5e9] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all duration-150 active:shadow-none active:translate-x-0.75 active:translate-y-0.75"
            >
              Dept Leaderboard
            </button>
            <button
              onClick={() => {
                router.push(isAuthenticated ? "/dashboard" : "/sign-up");
              }}
              className="relative bg-[#DC2626] hover:bg-[#B91C1C] px-5 py-1.5 font-bangers text-base text-white border-2 border-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all duration-150 active:shadow-none active:translate-x-0.75 active:translate-y-0.75 -rotate-2"
            >
              {isAuthenticated ? "Dashboard" : "Sign Up"}
            </button>
          </div>
        </div>
      </div>
      <NavigationMobile />
    </nav>
  );
}
