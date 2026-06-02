"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Instagram, Linkedin, Mail, Star, Zap } from "lucide-react";
import ScTeamAPI from "../Service/Api/ScTeamAPI";
import logger from "@/utils/logger";
import Footer from "@/components/layout/Footer";

// Category configuration with colors and subtitles
const categoryConfig = {
  "COUNCIL HEADS": { color: "bg-[#FF3B3F]", subtitle: "Leading the charge!" },
  "WEB & APP": { color: "bg-[#2196F3]", subtitle: "Digital builders!" },
  "TREASURER": { color: "bg-[#F1C40F]", subtitle: "Money matters!" },
  "TECH MASTERS": { color: "bg-[#4169E1]", subtitle: "Code warriors!" },
  "CULTURAL": { color: "bg-[#9B59B6]", subtitle: "Spreading the vibes!" },
  "ON-STAGE": { color: "bg-[#E74C3C]", subtitle: "Spotlight heroes!" },
  "OFF-STAGE": { color: "bg-[#8E44AD]", subtitle: "Behind the magic!" },
  "SPORTS": { color: "bg-[#27AE60]", subtitle: "Game on!" },
  "MARATHON": { color: "bg-[#E67E22]", subtitle: "Run for glory!" },
  "Ladies' Representative": { color: "bg-[#FF69B4]", subtitle: "Empowering voices!" },
  "E-SPORTS": { color: "bg-[#1ABC9C]", subtitle: "GG WP!" },
  "SOCIAL MEDIA": { color: "bg-[#E91E63]", subtitle: "Going viral!" },
  "GFX & VFX": { color: "bg-[#00BCD4]", subtitle: "Pixel perfect!" },
  "CREATIVITY": { color: "bg-[#FF5722]", subtitle: "Think different!" },
  "INFRA & SECURITY": { color: "bg-[#607D8B]", subtitle: "Safe & sound!" },
  "LOGISTICS": { color: "bg-[#795548]", subtitle: "Making it happen!" },
  "PHOTOGRAPHY": { color: "bg-[#3F51B5]", subtitle: "Capturing moments!" },
  "PUBLICITY": { color: "bg-[#FF9800]", subtitle: "Spread the word!" },
  "SPONSORSHIP": { color: "bg-[#9C27B0]", subtitle: "Making deals happen!" },
  
  "DOCUMENTATION": { color: "bg-[#546E7A]", subtitle: "Recording history!" },
};

// Category order for display
const categoryOrder = [
  "COUNCIL HEADS",
  "WEB & APP",
  "TREASURER",
  "TECH MASTERS",
  "CULTURAL",
  "ON-STAGE",
  "OFF-STAGE",
  "SPORTS",
  "MARATHON",
"Ladies' Representative",
  "E-SPORTS",
  "SOCIAL MEDIA",
  "GFX & VFX",
  "CREATIVITY",
  "INFRA & SECURITY",
  "LOGISTICS",
  "PHOTOGRAPHY",
  "PUBLICITY",
  "SPONSORSHIP",
  "DOCUMENTATION",
];

// Fallback team data - used when API is unavailable
const fallbackTeamCategories = [
  {
    title: "COUNCIL HEADS",
    subtitle: "Leading the charge!",
    color: "bg-[#FF3B3F]",
    members: [
      {
        name: "Siddharth Gugaliya",
        role: "General Secretary",
        image: "/Assets/Team/1.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "Vedant Gharat",
        role: "General Coordinator",
        image: "/Assets/Team/2.png",
        instagram: "#",
        linkedin: "#",
      },
    ],
  },
  {
    title: "TECH MASTERS",
    subtitle: "Code warriors!",
    color: "bg-[#4169E1]",
    members: [
      {
        name: "Heet Ruparel",
        role: "Tech Secretary",
        image: "/Assets/team/5.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "Aarush Palsamkar",
        role: "Tech Coordinator",
        image: "/Assets/team/12.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "Atharva More",
        role: "Tech Coordinator",
        image: "/Assets/team/13.png",
        instagram: "#",
        linkedin: "#",
      },
    ],
  },
  {
    title: "CULTURAL",
    subtitle: "Spreading the vibes!",
    color: "bg-[#9B59B6]",
    members: [
      {
        name: "Anudeep Malvi",
        role: "Cultural Secretary",
        image: "/Assets/Team/3.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "Nityaa Bhanushali",
        role: "Cultural Coordinator",
        image: "/Assets/team/9.png",
        instagram: "#",
        linkedin: "#",
      },
    ],
  },
  {
    title: "ON-STAGE",
    subtitle: "Spotlight heroes!",
    color: "bg-[#E74C3C]",
    members: [
      {
        name: "Viplav Bhujbal",
        role: "On-Stage Secretary",
        image: "/Assets/team/16.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "Tauqeer Siddiqui",
        role: "On-Stage Coordinator",
        image: "/Assets/team/17.png",
        instagram: "#",
        linkedin: "#",
      },
    ],
  },
  {
    title: "OFF-STAGE",
    subtitle: "Behind the magic!",
    color: "bg-[#8E44AD]",
    members: [
      {
        name: "Pranav jani",
        role: "Off-Stage Secretary",
        image: "/Assets/team/18.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "Priya Parekh",
        role: "Off-Stage Coordinator",
        image: "/Assets/team/19.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "yash Vernekar",
        role: "Off-Stage Coordinator",
        image: "/Assets/team/20.png",
        instagram: "#",
        linkedin: "#",
      }
    ],
  },
  {
    title: "SPORTS",
    subtitle: "Game on!",
    color: "bg-[#27AE60]",
    members: [
      {
        name: "Yashas More",
        role: "Sports Secretary",
        image: "/Assets/Team/4.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "Vedashri kadam",
        role: "Sports Coordinator",
        image: "/Assets/team/10.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "Anuj Yadav",
        role: "Sports Coordinator",
        image: "/Assets/team/11.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "Nikhil Epili",
        role: "Sports Coordinator",
        image: "/Assets/team/43.png",
        instagram: "#",
        linkedin: "#",
      },
    ],
  },
  {
    title: "MARATHON",
    subtitle: "Run for glory!",
    color: "bg-[#E67E22]",
    members: [
      {
        name: "Siddhesh kadam",
        role: "Marathon Secretary",
        image: "/Assets/team/8.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "Bhagya Nagda",
        role: "Marathon Coordinator",
        image: "/Assets/team/14.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "Jay Tripathi",
        role: "Marathon Coordinator",
        image: "/Assets/team/15.png",
        instagram: "#",
        linkedin: "#",
      }
    ],
  },
  {
    title: "TREASURER",
    subtitle: "Money matters!",
    color: "bg-[#F1C40F]",
    members: [
      {
        name: "Diya Jain",
        role: "Treasurer Secretary",
        image: "/Assets/team/21.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "Aachal Bafna",
        role: "Treasurer Coordinator",
        image: "/Assets/team/22.png",
        instagram: "#",
        linkedin: "#",
      },
    ],
  },
  {
    title: "Ladies' Representative",
    subtitle: "Empowering voices!",
    color: "bg-[#FF69B4]",
    members: [
      {
        name: "Arya Kadam",
        role: "Ladies' Representative",
        image: "/Assets/team/6.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "Anvi Kotlaapure",
        role: "Ladies' Representative",
        image: "/Assets/team/7.png",
        instagram: "#",
        linkedin: "#",
      },
    ],
  },
  {
    title: "E-SPORTS",
    subtitle: "GG WP!",
    color: "bg-[#1ABC9C]",
    members: [
      {
        name: "Jayesh Negi",
        role: "E-Sports Secretary",
        image: "/Assets/team/25.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "Nihar Kotak",
        role: "E-Sports Coordinator",
        image: "/Assets/team/45.png",
        instagram: "#",
        linkedin: "#",
      },
    ],
  },
  {
    title: "SOCIAL MEDIA",
    subtitle: "Going viral!",
    color: "bg-[#E91E63]",
    members: [
      {
        name: "Arya panchal ",
        role: "Social Media coordinator",
        image: "/Assets/team/26.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "Pratham Dupte",
        role: "Social Media Coordinator",
        image: "/Assets/team/44.png",
        instagram: "#",
        linkedin: "#",
      },
    ],
  },
  {
    title: "GFX & VFX",
    subtitle: "Pixel perfect!",
    color: "bg-[#00BCD4]",
    members: [
      {
        name: "Krishi Upadhyay",
        role: "GFX Secretary",
        image: "/Assets/team/30.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "Soham Pawar",
        role: "GFX Coordinator",
        image: "/Assets/team/29.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "Samiksha Thakur",
        role: "GFX Coordinator",
        image: "/Assets/team/31.png",
        instagram: "#",
        linkedin: "#",
      },
    ],
  },
  
  {
    title: "CREATIVITY",
    subtitle: "Think different!",
    color: "bg-[#FF5722]",
    members: [
      {
        name: "Ananya Fulgaonkar",
        role: "Creativity Secretary",
        image: "/Assets/team/32.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "Sahil Nerkar",
        role: "Creativity Coordinator",
        image: "/Assets/team/33.png",
        instagram: "#",
        linkedin: "#",
      },
    ],
  },
  {
    title: "INFRA & SECURITY",
    subtitle: "Safe & sound!",
    color: "bg-[#607D8B]",
    members: [
      {
        name: "Purvesh Gaikwad",
        role: "Infra & Security Secretary",
        image: "/Assets/team/34.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "Areev Renoy",
        role: "Infra & Security Coordinator",
        image: "/Assets/team/35.png",
        instagram: "#",
        linkedin: "#",
      },
    ],
  },
  {
    title: "LOGISTICS",
    subtitle: "Making it happen!",
    color: "bg-[#795548]",
    members: [
      {
        name: "Vedant Dongare",
        role: "Logistics Secretary",
        image: "/Assets/team/36.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "Swarnim Dhyani",
        role: "Logistics Coordinator",
        image: "/Assets/team/37.png",
        instagram: "#",
        linkedin: "#",
      },
    ],
  },
  {
    title: "PHOTOGRAPHY",
    subtitle: "Capturing moments!",
    color: "bg-[#3F51B5]",
    members: [
      {
        name: "Darshan Fulia",
        role: "Photography Secretary",
        image: "/Assets/team/38.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "Rohan Koyande",
        role: "Photography Coordinator",
        image: "/Assets/team/39.png",
        instagram: "#",
        linkedin: "#",
      },
    ],
  },
  {
    title: "PUBLICITY",
    subtitle: "Spread the word!",
    color: "bg-[#FF9800]",
    members: [
      {
        name: "Saniya Shigwan",
        role: "Publicity Secretary",
        image: "/Assets/team/40.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "Tapasya Tandel",
        role: "Publicity Coordinator",
        image: "/Assets/team/41.png",
        instagram: "#",
        linkedin: "#",
      },
    ],
  },
  {
    title: "SPONSORSHIP",
    subtitle: "Making deals happen!",
    color: "bg-[#9C27B0]",
    members: [
      {
        name: "Punit Jain",
        role: "Sponsorship Secretary",
        image: "/Assets/team/23.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "Arin Pawar",
        role: "Sponsorship Coordinator",
        image: "/Assets/team/24.png",
        instagram: "#",
        linkedin: "#",
      },
    ],
  },
  {
    title: "WEB & APP",
    subtitle: "Digital builders!",
    color: "bg-[#2196F3]",
    members: [
      {
        name: "Om Mithiya",
        role: "Web & App Secretary",
        image: "/Assets/team/27.png",
        instagram: "#",
        linkedin: "#",
      },
      {
        name: "Tejas Najare",
        role: "Web & App Coordinator",
        image: "/Assets/team/28.png",
        instagram: "#",
        linkedin: "#",
      },
    ],
  },
  {
    title: "DOCUMENTATION",
    subtitle: "Recording history!",
    color: "bg-[#546E7A]",
    members: [
      {
        name: "Shreeya Mhatre",
        role: "Documentation",
        image: "/Assets/team/42.png",
        instagram: "#",
        linkedin: "#",
      },
    ],
  },
];

// Comic burst component
const ComicBurst = ({ children, className = "" }) => (
  <div className={`relative ${className}`}>
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 w-full h-full -z-10"
      preserveAspectRatio="none"
    >
      <polygon
        points="50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35"
        fill="currentColor"
        stroke="black"
        strokeWidth="2"
      />
    </svg>
    {children}
  </div>
);

// Team member card component
const TeamMemberCard = ({ member, index, categoryColor }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const rotations = ["-rotate-1", "rotate-1", "-rotate-1", "rotate-1"];
  const rotation = rotations[index % rotations.length];

  // Color palette for letter boxes
  const letterColors = ["bg-red-600", "bg-white", "bg-yellow-400", "bg-blue-500", "bg-red-600", "bg-white"];

  const handleClick = () => {
    // Only toggle on mobile (screen width < 640px)
    if (window.innerWidth < 640) {
      setIsFlipped(!isFlipped);
    }
  };

  return (
    <div 
      className={`group ${rotation} [perspective:1000px] cursor-pointer sm:cursor-default`}
      onClick={handleClick}
    >
      <div className={`relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] sm:group-hover:[transform:rotateY(180deg)] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
        
        {/* Front Face */}
        <div className={`relative [backface-visibility:hidden] sm:group-hover:pointer-events-none ${isFlipped ? 'pointer-events-none' : 'pointer-events-auto'}`}>
          {/* Card background shadow */}
          <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 sm:translate-x-3 sm:translate-y-3 rounded-lg"></div>

          <div className="relative bg-[#E8E0D5] border-3 sm:border-4 border-black rounded-lg overflow-hidden">
            {/* Halftone dots background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle,#999_1px,transparent_1px)] bg-[length:8px_8px] opacity-20 pointer-events-none"></div>
            
            {/* Paint splashes decoration */}
            <div className="absolute top-1/4 right-0 w-24 h-32 bg-blue-500 opacity-80 blur-sm rounded-full transform translate-x-8 -rotate-12"></div>
            <div className="absolute top-1/3 left-0 w-20 h-28 bg-red-500 opacity-80 blur-sm rounded-full transform -translate-x-8 rotate-12"></div>
            <div className="absolute bottom-1/4 right-1/4 w-16 h-24 bg-yellow-400 opacity-70 blur-sm rounded-full transform rotate-45"></div>
            
            {/* Pratishtha Logo at top */}
            <div className="relative z-10 pt-3 sm:pt-4 px-2 flex justify-center">
              <Image
                src="/Assets/Logo/Pratishtha_logo.png"
                alt="Pratishtha"
                width={120}
                height={50}
                className="h-8 sm:h-10 md:h-12 w-auto drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)]"
              />
            </div>

            {/* Member image with black & white effect and white outline */}
            <div className="relative z-10 flex justify-center py-3 sm:py-4">
              <div className="relative">
                {/* White outline effect */}
                <div className="absolute inset-0 bg-white rounded-sm transform scale-[1.03] -z-10"></div>
                <div className="w-28 h-36 sm:w-36 sm:h-44 md:w-44 md:h-56 relative overflow-hidden">
                  {member.image ? (
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
                      <span className="text-4xl sm:text-5xl">🦸</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            

            {/* Role */}
            <div className="relative z-10 px-2 sm:px-3 py-2 sm:py-3 text-center">
              <p className="font-bangers text-sm sm:text-lg md:text-xl text-black drop-shadow-[1px_1px_0px_rgba(255,255,255,0.8)] uppercase tracking-wider">
                {member.role}
              </p>
              <p className="font-comic text-[10px] sm:text-xs text-gray-700 mt-1">
                SC 2025-26
              </p>
            </div>
          </div>
        </div>

        {/* Back Face */}
        <div className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] z-50 sm:group-hover:pointer-events-auto ${!isFlipped ? 'pointer-events-none' : 'pointer-events-auto'}`}>
          {/* Card background shadow */}
          <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 sm:translate-x-3 sm:translate-y-3 rounded-lg"></div>

          <div className={`relative h-full ${categoryColor} border-3 sm:border-4 border-black rounded-lg overflow-hidden flex flex-col`}>
            {/* Halftone dots background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle,#000_1px,transparent_1px)] bg-[length:8px_8px] opacity-10 pointer-events-none"></div>
            
            {/* Comic burst decoration */}
            <div className="absolute top-4 right-4 w-16 h-16 bg-yellow-400 border-2 border-black rounded-full flex items-center justify-center rotate-12">
              <span className="font-bangers text-xs sm:text-sm">WOW!</span>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 sm:p-6">
              {/* Name */}
              <h3 className="font-bangers text-lg sm:text-2xl md:text-3xl text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] text-center uppercase mb-2">
                {member.name}
              </h3>
              
              {/* Role */}
              <p className="font-comic text-sm sm:text-base md:text-lg text-white/90 text-center mb-4 sm:mb-6">
                {member.role}
              </p>

              {/* Divider */}
              <div className="w-16 sm:w-24 h-1 bg-white/50 rounded mb-4 sm:mb-6"></div>

              {/* Connect text */}
              <p className="font-bangers text-base sm:text-xl text-yellow-300 mb-3 sm:mb-4 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                CONNECT WITH ME!
              </p>

              {/* Social links */}
              <div className="flex justify-center gap-3 sm:gap-4">
                {member.instagram && (
                  <a
                    href={member.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                  >
                    <Instagram className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </a>
                )}
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 sm:p-3 bg-[#0077B5] rounded-full border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                  >
                    <Linkedin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </a>
                )}
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="p-2 sm:p-3 bg-white rounded-full border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                  >
                    <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                  </a>
                )}
              </div>

              {/* SC Year badge */}
              <div className="mt-4 sm:mt-6 bg-white border-2 border-black px-3 py-1 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <p className="font-bangers text-xs sm:text-sm text-black">SC 2025-26</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// Category section component
const TeamCategory = ({ category, index }) => {
  const isEven = index % 2 === 0;

  return (
    <div className="relative mb-12 sm:mb-16 md:mb-24">
      {/* Category header */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-6 sm:mb-8 ${isEven ? "" : "sm:flex-row-reverse"}`}>
        {/* Title block */}
        <div className="relative w-full sm:w-auto">
          <div className="absolute inset-0 bg-black translate-x-1.5 translate-y-1.5 sm:translate-x-2 sm:translate-y-2"></div>
          <div
            className={`relative ${category.color} border-3 sm:border-4 border-black px-3 sm:px-6 md:px-8 py-1.5 sm:py-2 md:py-3 ${isEven ? "-rotate-1" : "rotate-1"}`}
          >
            <h2 className="font-bangers text-xl sm:text-3xl md:text-5xl text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] sm:drop-shadow-[3px_3px_0px_rgba(0,0,0,1)] uppercase">
              {category.title}
            </h2>
          </div>
          {/* Speech bubble subtitle */}
          <div
            className={`absolute -bottom-5 sm:-bottom-6 right-2 sm:${isEven ? "-right-4" : "-left-4"} bg-white border-2 sm:border-3 border-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] sm:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${isEven ? "rotate-3" : "-rotate-3"}`}
          >
            <p className="font-comic text-[10px] sm:text-xs md:text-sm font-bold text-gray-800 whitespace-nowrap">
              {category.subtitle}
            </p>
          </div>
        </div>

        {/* Decorative line */}
        <div className="flex-1 h-3 sm:h-4 bg-black skew-x-[-12deg] hidden sm:block"></div>
      </div>

      {/* Team members grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 md:gap-8 mt-8 sm:mt-12">
        {category.members.map((member, memberIndex) => (
          <TeamMemberCard
            key={member.name}
            member={member}
            index={memberIndex}
            categoryColor={category.color}
          />
        ))}
      </div>
    </div>
  );
};

export default function TeamPage() {
  const [teamCategories, setTeamCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        const response = await ScTeamAPI.getMembersGrouped();
        
        if (response.success && response.data) {
          // Transform API data to match component structure
          const transformedCategories = categoryOrder
            .filter(categoryName => response.data[categoryName] && response.data[categoryName].length > 0)
            .map(categoryName => {
              const config = categoryConfig[categoryName] || { color: "bg-gray-500", subtitle: "" };
              const members = response.data[categoryName].map(member => ({
                name: member.name,
                role: member.role,
                image: member.profileImage,
                instagram: member.socialLinks?.find(s => s.platform === 'instagram')?.url || null,
                linkedin: member.socialLinks?.find(s => s.platform === 'linkedin')?.url || null,
                email: member.email || null,
              }));
              
              return {
                title: categoryName,
                subtitle: config.subtitle,
                color: config.color,
                members,
              };
            });
          
          setTeamCategories(transformedCategories);
        } else {
          // Fallback to static data if API returns empty
          setTeamCategories(fallbackTeamCategories);
        }
      } catch (err) {
        logger.error('Error fetching team data:', err);
        setError(err.message);
        // Use fallback data on error
        setTeamCategories(fallbackTeamCategories);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, []);

  return (
    <main className="min-h-screen bg-[#FFF8E7] relative overflow-hidden">
      {/* Comic dots background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle,#000_1.5px,transparent_1.5px)] bg-[length:24px_24px] opacity-5 pointer-events-none"></div>

      {/* Speed lines decoration */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30 bg-[url('/Assets/Background/speed-lines.png')] bg-cover bg-center mix-blend-multiply"
        aria-hidden="true"
      />

      {/* Hero section */}
      <section className="relative pt-20 sm:pt-24 md:pt-32 pb-10 sm:pb-12 md:pb-16 border-b-4 border-black bg-gradient-to-b from-[#FF3B3F] to-[#FF6B6B]">
        {/* Halftone overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,#000_2px,transparent_2px)] bg-[length:12px_12px] sm:bg-[length:16px_16px] opacity-10 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Main title with comic effect */}
          <div className="text-center">
            {/* POW! burst */}
            <div className="inline-block relative mb-4">
              <div className="absolute -top-6 -left-6 sm:-top-8 sm:-left-8 md:-top-12 md:-left-12 w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 bg-yellow-400 border-3 sm:border-4 border-black rounded-full flex items-center justify-center rotate-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="font-bangers text-sm sm:text-lg md:text-2xl">POW!</span>
              </div>
            </div>

            {/* Title */}
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 sm:translate-x-3 sm:translate-y-3 md:translate-x-4 md:translate-y-4"></div>
              <h1 className="relative bg-white border-3 sm:border-4 md:border-6 border-black px-4 sm:px-8 md:px-12 py-2 sm:py-3 md:py-4 font-bangers text-3xl sm:text-6xl md:text-8xl text-black uppercase tracking-wider">
                MEET THE
                <span className="block text-[#FF3B3F] drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)] sm:drop-shadow-[3px_3px_0px_rgba(0,0,0,0.3)]">
                  HEROES
                </span>
              </h1>
            </div>

            {/* Subtitle speech bubble */}
            <div className="mt-6 sm:mt-8 inline-block relative">
              <div className="bg-white border-3 sm:border-4 border-black px-4 sm:px-6 py-2 sm:py-3 rounded-2xl sm:rounded-3xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-1">
                <p className="font-comic text-sm sm:text-lg md:text-xl font-bold text-gray-800">
                  The amazing team behind Pratishtha 2026! 🦸‍♂️🦸‍♀️
                </p>
              </div>
              {/* Speech bubble tail */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px] border-t-black"></div>
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-white"></div>
            </div>
          </div>
        </div>

        {/* Bottom wave decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-8 overflow-hidden">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="absolute bottom-0 w-full h-16"
          >
            <path
              d="M0,60 C150,120 350,0 600,60 C850,120 1050,0 1200,60 L1200,120 L0,120 Z"
              fill="#FFF8E7"
              stroke="black"
              strokeWidth="3"
            />
          </svg>
        </div>
      </section>

      {/* Team sections */}
      <section className="relative py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-black border-t-[#FF3B3F] rounded-full animate-spin"></div>
                <p className="font-bangers text-xl text-black mt-4 text-center">Loading Heroes...</p>
              </div>
            </div>
          ) : teamCategories.length > 0 ? (
            teamCategories.map((category, index) => (
              <TeamCategory key={category.title} category={category} index={index} />
            ))
          ) : (
            <div className="text-center py-20">
              <p className="font-bangers text-2xl text-gray-600">No team members found</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      {/* <section className="relative py-10 sm:py-16 border-t-4 border-black bg-gradient-to-r from-[#4169E1] to-[#6B5B95]">
        <div className="absolute inset-0 bg-[radial-gradient(circle,#fff_1px,transparent_1px)] bg-[length:16px_16px] sm:bg-[length:20px_20px] opacity-10 pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="relative inline-block mb-4 sm:mb-6">
            <div className="absolute inset-0 bg-black translate-x-1.5 translate-y-1.5 sm:translate-x-2 sm:translate-y-2"></div>
            <div className="relative bg-[#FFD700] border-3 sm:border-4 border-black px-4 sm:px-6 py-1.5 sm:py-2 -rotate-1">
              <h3 className="font-bangers text-lg sm:text-2xl md:text-4xl text-black">
                WANT TO JOIN THE TEAM?
              </h3>
            </div>
          </div>
          <p className="font-comic text-sm sm:text-lg text-white mb-4 sm:mb-6 px-2">
            Be part of something extraordinary! Join us in creating the biggest fest ever! 🚀
          </p>
          <a
            href="/contact"
            className="inline-block bg-[#FF3B3F] hover:bg-[#FF5252] text-white font-bangers text-base sm:text-xl md:text-2xl px-5 sm:px-8 py-2 sm:py-3 border-3 sm:border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all uppercase tracking-wider"
          >
            Contact Us! 💪
          </a>
        </div>
      </section> */}
      <Footer/>
    </main>
  );
}