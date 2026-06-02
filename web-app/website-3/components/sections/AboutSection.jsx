'use client';
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AboutSection() {
  const router = useRouter();
  return (
    <section className="relative w-full bg-white overflow-hidden -skew-y-2 md:py-6 md:py-0">
      {/* Responsive Brick Pattern Overlay */}
      {/* Desktop layout */}
      <div className="hidden md:grid grid-cols-8 gap-2 h-auto md:h-200">
        {/* Left images side-by-side on desktop */}
        <div className="grid grid-rows-2 gap-2 col-span-2">
          <div onClick={()=>{router.push('/team')}} className="bg-yellow-300 bg-radial w-full h-full relative border-4 border-black">
            {/* Dot pattern overlay */}
            <Image
              src="/Assets/Background/halftone-dots.png"
              alt="Dot Overlay"
              fill
              className="object-cover pointer-events-none opacity-60 z-10"
              style={{ mixBlendMode: "multiply" }}
            />
            <Image
              src="/Assets/Background/team-2.png"
              alt="Team"
              fill
              className="object-contain z-20 hover:cursor-pointer transition-transform duration-300 hover:scale-105"
            />
          </div>


          {/** Event */}
          <div onClick={()=>{router.push('/events')}} className="bg-blue-300 bg-radial w-full h-full relative border-4 border-black">
            {/* Dot pattern overlay */}
            <Image
              src="/Assets/Background/speed-lines.png"
              alt="Dot Overlay"
              fill
              className="object-cover pointer-events-none opacity-60 z-10"
              style={{ mixBlendMode: "multiply" }}
            />
            <Image
              src="/Assets/Background/events.png"
              alt="events"
              fill
              className="object-contain z-20 transition-transform duration-300 hover:scale-105 cursor-pointer"
            />
          </div>
        </div>

        {/* Main content: background and video */}
        <div className="bg-[url('/Assets/Background/LeaderBoardBG-1.png')] w-full h-full col-span-6 border-4 border-black bg-center bg-cover bg-no-repeat relative flex items-center justify-center mt-0">
          {/* Yellow overlay */}
          <div className="absolute inset-0 bg-yellow-300 opacity-40 mix-blend-multiply pointer-events-none z-10"></div>
          {/* Speed lines overlay */}
          <Image
            src="/Assets/Background/speed-lines.png"
            alt="Speed Lines Overlay"
            fill
            className="object-cover pointer-events-none opacity-50 z-20"
            style={{mixBlendMode: 'multiply'}}
          />
          {/* Right top dot overlay */}
          <Image
            src="/Assets/Background/right-top-dot.png"
            alt="Right Top Dot Overlay"
            fill
            className="object-cover pointer-events-none opacity-50 z-30"
            style={{mixBlendMode: 'multiply'}}
          />
          {/* Centered YouTube Video */}
          <div className="relative z-40 w-full flex items-center justify-center isolate">
            <div className="w-full max-w-xl aspect-video px-4">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/BXA0Ri3d_ws?si=TkFUlWpOU9bd55jw"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                className="rounded-xl border-4 border-black shadow-[6px_6px_0px_#000] -rotate-2 transition-transform duration-300 hover:scale-105 hover:rotate-0 pointer-events-auto"
              ></iframe>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden flex flex-col gap-2">
        {/* Movie grid full width */}
        <div className="bg-[url('/Assets/Background/LeaderBoardBG-1.png')] w-full h-72 border-4 border-black bg-center bg-cover bg-no-repeat relative flex items-center justify-center">
          {/* Yellow overlay */}
          <div className="absolute inset-0 bg-yellow-300 opacity-40 mix-blend-multiply pointer-events-none z-10"></div>
          {/* Speed lines overlay */}
          <Image
            src="/Assets/Background/speed-lines.png"
            alt="Speed Lines Overlay"
            fill
            className="object-cover pointer-events-none opacity-50 z-20"
            style={{mixBlendMode: 'multiply'}}
          />
          {/* Right top dot overlay */}
          <Image
            src="/Assets/Background/right-top-dot.png"
            alt="Right Top Dot Overlay"
            fill
            className="object-cover pointer-events-none opacity-50 z-30"
            style={{mixBlendMode: 'multiply'}}
          />
          {/* Centered YouTube Video */}
          <div className="relative z-40 w-full flex items-center justify-center isolate">
            <div className="w-full max-w-xs sm:max-w-md aspect-video px-4">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/BXA0Ri3d_ws?si=X2sDtaAKuuRu37AK"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                className="rounded-xl border-4 border-black shadow-[6px_6px_0px_#000] -rotate-2 pointer-events-auto"
              ></iframe>
            </div>
          </div>
        </div>
        {/* Teams and Events grid side by side */}
        <div className="flex flex-row gap-2">
          <div onClick={()=>{router.push('/team')}} className="bg-yellow-300 bg-radial w-1/2 h-48 relative border-4 border-black">
            {/* Dot pattern overlay */}
            <Image
              src="/Assets/Background/halftone-dots.png"
              alt="Dot Overlay"
              fill
              className="object-cover pointer-events-none opacity-60 z-10"
              style={{ mixBlendMode: "multiply" }}
            />
            <Image
              src="/Assets/Background/team-2.png"
              alt="Team"
              fill
              className="object-contain z-20"
            />
          </div>
          <div onClick={()=>{router.push('/events')}} className="bg-blue-300 bg-radial w-1/2 h-48 relative border-4 border-black">
            {/* Dot pattern overlay */}
            <Image
              src="/Assets/Background/speed-lines.png"
              alt="Dot Overlay"
              fill
              className="object-cover pointer-events-none opacity-60 z-10"
              style={{ mixBlendMode: "multiply" }}
            />
            <Image
              src="/Assets/Background/events.png"
              alt="events"
              fill
              className="object-contain z-20 "
            />
          </div>
        </div>
      </div>
    </section>
  );
}
