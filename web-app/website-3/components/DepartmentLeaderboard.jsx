import React from "react";

const departmentData = [
  { name: "COMPS", score: 1480 },
  { name: "ECS", score: 1100 },
  { name: "EXTC", score: 660 },
];

const DepartmentLeaderboard = () => {
  return (
    <div className="bg-[#FFD700] border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-10 max-w-lg mx-auto mt-16 font-comic relative overflow-hidden">
      {/* Comic burst background */}
      <div className="absolute inset-0 pointer-events-none bg-[url('/Assets/Background/halftone-dots.png')] bg-repeat opacity-40 z-0" />
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <svg viewBox="0 0 400 200" className="w-full h-full">
          <polygon points="200,10 220,40 260,30 240,60 270,80 230,80 200,110 170,80 130,80 160,60 140,30 180,40" fill="#fff" opacity="0.15" />
        </svg>
      </div>
      <h2 className="text-4xl font-bangers font-extrabold mb-8 text-center text-black drop-shadow-[3px_3px_0px_rgba(0,0,0,0.7)] z-10 relative tracking-wider">
        <span className="inline-block transform -rotate-2">Department of the Year</span>
      </h2>
      <ol className="list-decimal pl-8 z-10 relative">
        {departmentData.map((dept, idx) => (
          <li key={dept.name} className="mb-6 flex justify-between items-center bg-white border-4 border-black rounded-2xl px-6 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] font-bangers text-2xl text-black hover:bg-[#ffe066] hover:scale-105 transition-transform duration-200">
            <span className="font-extrabold text-black text-3xl drop-shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">{idx + 1}. {dept.name}</span>
            <span className="font-extrabold text-black text-3xl drop-shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">{dept.score}</span>
          </li>
        ))}
      </ol>
      <div className="mt-8 text-center z-10 relative">
        <span className="inline-block bg-black text-[#FFD700] font-bangers px-6 py-2 rounded-full border-2 border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.7)] text-xl">Who will win next year?</span>
      </div>
    </div>
  );
};

export default DepartmentLeaderboard;
