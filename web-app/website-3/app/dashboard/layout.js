import Navigation from "@components/layout/Navigation";

export const metadata = {
  title: "My Dashboard | Pratishtha 2026 | SAKEC",
  description: "Access your Pratishtha 2026 dashboard. View event registrations, voting history, and personal participation details.",
  keywords: [
    "Pratishtha dashboard",
    "user dashboard",
    "event registration",
    "voting platform",
    "Pratishtha profile"
  ],
  authors: [{ name: "Pratishtha Team", url: "https://pratishtha.sakec.ac.in" }],
  robots: "noindex, follow",
  openGraph: {
    title: "My Dashboard | Pratishtha 2026",
    description: "Manage your Pratishtha 2026 registrations and activities",
    url: "https://pratishtha.sakec.ac.in/dashboard",
    type: "website",
  },
};

export default function DashboardLayout({ children }) {
  return (
     <div 
      className="min-h-screen w-full bg-cover bg-center bg-fixed bg-no-repeat relative"
      style={{
        backgroundImage: "url('/Assets/Background/Gallerybg-desktop.png')",
      }}
    >
      <div className="absolute inset-0 bg-black/70"></div>

      <div className="relative z-10">
        <Navigation/>
        {children}
      </div>
    </div>
  );
}
