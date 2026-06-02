export const metadata = {
  title: "Gallery | Pratishtha 2026 | SAKEC Festival Photos",
  description: "Browse the gallery of Pratishtha 2026 - SAKEC's annual festival. View photos from cultural events, technical competitions, sports events, and celebrations.",
  keywords: [
    "Pratishtha gallery",
    "festival gallery",
    "Pratishtha photos",
    "SAKEC events photos",
    "festival memories",
    "event gallery"
  ],
  authors: [{ name: "Pratishtha Team", url: "https://pratishtha.sakec.ac.in" }],
  robots: "index, follow",
  openGraph: {
    title: "Gallery | Pratishtha 2026 | SAKEC Festival",
    description: "View photos from Pratishtha 2026 - SAKEC's annual festival",
    url: "https://pratishtha.sakec.ac.in/gallery",
    type: "website",
  },
  canonical: "https://pratishtha.sakec.ac.in/gallery",
};

export default function GalleryLayout({ children }) {
  return <>{children}</>;
}
