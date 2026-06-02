export const metadata = {
  title: "Events | Pratishtha 2026 | Cultural, Technical & Sports Festivals",
  description: "Explore events at Pratishtha 2026. Join cultural performances, technical competitions, sports events, and workshops organized by SAKEC.",
  keywords: [
    "Pratishtha events",
    "cultural events",
    "technical events",
    "sports events",
    "SAKEC events",
    "Aurum",
    "Olympus",
    "Verve"
  ],
  authors: [{ name: "Pratishtha Team", url: "https://pratishtha.sakec.ac.in" }],
  robots: "index, follow",
  openGraph: {
    title: "Events | Pratishtha 2026 | SAKEC Festival",
    description: "Explore cultural, technical, and sports events at Pratishtha 2026",
    url: "https://pratishtha.sakec.ac.in/events",
    type: "website",
  },
  canonical: "https://pratishtha.sakec.ac.in/events",
};

export default function EventsLayout({ children }) {
	return (
		<section className="min-h-screen bg-yellow-50 comic-font">
			{children}
		</section>
	);
}
