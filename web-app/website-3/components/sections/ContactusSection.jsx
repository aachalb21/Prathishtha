import Image from "next/image";
import ContactUsForm from "./ContactUsForm";

export default function ContactUS() {
  return (
    <section className="relative w-full py-10 md:py-20 border-t-4 text-black border-black bg-[#FFE066] overflow-hidden comic-bg">
      {/* Comic Dots BG */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle,#fff_1.5px,transparent_1.5px)] bg-size-[24px_24px]"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 md:mb-10">
          <h2
            className="font-happy-school text-4xl sm:text-5xl md:text-7xl text-[#ff3b3f] drop-shadow-[-6px_6px_0px_#000] md:drop-shadow-[-10px_10px_0px_#000] border-4 border-black px-4 sm:px-6 md:px-8 py-2 bg-white comic-title relative whitespace-nowrap"
            style={{ borderRadius: 0 }}
          >
            <span className="absolute -top-4 -left-4 sm:-top-6 sm:-left-8 w-8 h-8 sm:w-10 sm:h-10 bg-[#ff3b3f] border-4 border-black rounded-full flex items-center justify-center text-white text-xl sm:text-3xl shadow-lg">
              💬
            </span>
            CONTACT US
          </h2>
          <div className="hidden sm:block flex-1 h-4 bg-black skew-x-[-20deg] comic-bar"></div>
        </div>

        {/* Contact Form & About Section */}
        <div className="mt-8 md:mt-12 flex flex-col lg:flex-row gap-8 md:gap-12 items-stretch">
          {/* Contact Form */}
          <div className="w-full lg:w-1/2">
            <ContactUsForm />
          </div>
          
          {/* About Section */}
          <div className="w-full lg:w-1/2 flex items-center">
            <div className="bg-white border-4 border-black rounded-2xl shadow-[6px_6px_0px_#000] md:shadow-[8px_8px_0px_#000] p-5 sm:p-6 md:p-8 w-full comic-about-card">
              <h3 className="font-happy-school text-2xl sm:text-3xl text-[#ff3b3f] mb-3 md:mb-4">
                About Us
              </h3>
              <p className="text-base sm:text-lg text-gray-800 font-comic leading-relaxed">
                Shah and Anchor Kutchhi Engineering College (SAKEC), established in 1985, is one of Mumbai's premier engineering institutions affiliated with the University of Mumbai. Known for academic excellence and holistic development, SAKEC has been nurturing future engineers and innovators for decades.
              </p>
              <p className="text-base sm:text-lg text-gray-800 font-comic mt-3 md:mt-4 leading-relaxed">
                <strong>Pratishtha</strong> is SAKEC's flagship annual technical and cultural festival — a vibrant celebration of talent, creativity, and innovation. From thrilling competitions and technical events to electrifying performances and cultural showcases, Pratishtha brings together students from across the city to compete, collaborate, and create unforgettable memories. Join us and be part of the excitement!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
