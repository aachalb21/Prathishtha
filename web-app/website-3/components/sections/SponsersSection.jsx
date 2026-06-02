import Image from 'next/image';

const sponsors = [
  {id: 0, name: 'State Bank OF India', logo: '/Assets/Logo/sponsers/sponser_sbi.jpeg' },
  { id: 1, name: 'MALABAR Gold & Diamond', logo: '/Assets/Logo/sponsers/sponser1.jpeg' },
  { id: 2, name: 'Bank Of Maharashtra', logo: '/Assets/Logo/sponsers/sponser2.jpeg' },
  { id: 3, name: 'Saptasur', logo: '/Assets/Logo/sponsers/sponser3.png' },
];

export default function SponsersSection() {
  return (
    <section className="relative w-full py-20 border-y-4 border-black bg-[#FF4500] mb-4">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,black_2px,transparent_2px)] bg-[length:16px_16px]"></div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="flex justify-center mb-12">
          <div className="bg-white px-8 py-2 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-2">
            <h2 className="font-bangers text-5xl md:text-6xl text-black">Sponsors</h2>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
          {sponsors.map((sponsor, index) => (
            <div 
              key={sponsor.id} 
              className={`bg-white p-2 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform duration-200 ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}
            >
              <div className="h-32 w-40 md:h-40 md:w-48 bg-white border-2 border-black overflow-hidden flex items-center justify-center relative group">
                <Image
                  src={sponsor.logo}
                  alt={sponsor.name}
                  fill
                  className="object-contain p-2 group-hover:scale-110 transition-transform duration-200"
                />
              </div>
              <div className="bg-[#FFD700] border-2 border-black p-2 mt-2">
                <p className="font-comic text-xs font-bold uppercase tracking-wide text-black text-center">{sponsor.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
