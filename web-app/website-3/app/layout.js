import { Bangers, Comic_Neue } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import Navigation from "@components/layout/Navigation";
import FloatingNav from "@components/layout/FloatingNav";


const bangers = Bangers({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bangers",
});

const comicNeue = Comic_Neue({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-comic",
});


export const metadata = {
  title: "Pratishtha 2026 | SAKEC Annual Festival",
  description: "Pratishtha 2026 is the annual cultural, technical, and sports festival of Shah & Anchor Kutchhi Engineering College (SAKEC), Mumbai. Experience electrifying performances, technical competitions, sports events, workshops, and inter-college celebrations.",
  keywords: [
    "Pratishtha 2026",
    "SAKEC Pratishtha",
    "SAKEC fest",
    "Pratishtha SAKEC",
    "SAKEC cultural festival",
    "SAKEC technical fest",
    "college fest Mumbai",
    "engineering college festival",
    "inter college fest Mumbai",
    "Pratishtha festival 2026",
    "SAKEC Chembur fest",
    "Verve Nucleus Olympus"
  ],
  authors: [{ name: "Pratishtha Team", url: "https://pratishtha.sakec.ac.in" }],
  robots: "index, follow",
  openGraph: {
    title: "Pratishtha 2026 | SAKEC Annual Cultural, Technical & Sports Festival",
    description: "Join SAKEC's cultural, technical, and sports festival - Pratishtha 2026",
    url: "https://pratishtha.sakec.ac.in",
    type: "website",
  },
  canonical: "https://pratishtha.sakec.ac.in",
};



export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`antialiased ${bangers.variable} ${comicNeue.variable}`} suppressHydrationWarning={true}>
        <AuthProvider>
          <Navigation />
          <FloatingNav />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
