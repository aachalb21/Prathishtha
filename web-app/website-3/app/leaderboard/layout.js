export const metadata = {
  title: "Live Leaderboard | Pratishtha 2026 | SAKEC Rankings",
  description: "Check live leaderboard and rankings for Pratishtha 2026 - SAKEC's annual festival events and competitions.",
  keywords: [
    "Pratishtha leaderboard",
    "Pratishtha rankings",
    "SAKEC leaderboard",
    "festival rankings",
    "competition scores",
    "event results"
  ],
  authors: [{ name: "Pratishtha Team", url: "https://pratishtha.sakec.ac.in" }],
  robots: "index, follow",
  openGraph: {
    title: "Live Leaderboard | Pratishtha 2026 | SAKEC",
    description: "View live rankings and scores from Pratishtha 2026 festival events",
    url: "https://pratishtha.sakec.ac.in/leaderboard",
    type: "website",
  },
  canonical: "https://pratishtha.sakec.ac.in/leaderboard",
};

export default function LeaderboardLayout({ children }) {
  return (
    <div 
      className="min-h-screen w-full bg-cover bg-center bg-fixed bg-no-repeat relative"
      style={{
        backgroundImage: "url('/assets/background/LeaderBoardBG-1.png')",
      }}
    >
      <div className="absolute inset-0 bg-black/70"></div>

      <div className="pt-20 pb-10 relative z-10">
        {children}
      </div>
    </div>
  );
}
