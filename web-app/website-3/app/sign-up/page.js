'use client';

import SignupForm from '@components/SignupForm';
import PublicRoute from '@components/AuthRoutes/PublicRoute';
import Image from 'next/image';

export default function SignupPage() {
  return (
    <PublicRoute>
      <section className="relative w-full h-full py-20 border-t-4 border-black bg-[#FFE066]/30 overflow-hidden ">
      {/* Speed lines overlay */}
      <Image
        width={120}
        height={120}
        src="/Assets/Background/speed-lines.png"
        alt="Speed lines overlay"
        className="pointer-events-none absolute inset-0 w-full h-full object-cover z-10"
        style={{ mixBlendMode: "screen", opacity: 0.7 }}
        aria-hidden="true"
      />
      {/* Comic Dots BG */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle,#fff_1.5px,transparent_1.5px)] bg-size-[24px_24px]"></div>
      <SignupForm />
    </section>
    </PublicRoute>
  );
}
