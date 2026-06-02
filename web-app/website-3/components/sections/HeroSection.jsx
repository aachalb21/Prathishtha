import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative mb-2 md:mt-16 h-[85vh] w-full border-b-4 border-black overflow-hidden bg-[url('/Assets/Background/Main-bg.png')] bg-cover bg-center bg-no-repeat md:-skew-y-2">
      {/* Speed Lines Overlay */}
      <div 
        className="absolute inset-0 z-20 pointer-events-none bg-[url('/Assets/Background/speed-lines.png')] bg-cover bg-center  mix-blend-multiply"
        aria-hidden="true"
      />

      {/* Main Content */}
      <div className="border-y-4 bg-blue-500/20 border-black relative z-10 w-full h-full flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <Image 
        src="/Assets/Logo/Pratishtha_logo.png"
        alt="Prathistha Logo"
        width={1200}
        height={600}
        priority
        quality={95}
        className="max-w-[120vw] md:max-w-[70vw] lg:max-w-[60vw] h-auto drop-shadow-[4px_4px_0px_rgba(0,0,0,0.8)]"
      />
      </div>
    </section>
  );
}
