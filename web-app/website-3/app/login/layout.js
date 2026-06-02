import React from 'react';

export const metadata = {
  title: "Secure Login | Pratishtha 2026 | SAKEC Festival",
  description:
    "Secure login to Pratishtha 2026 - SAKEC's annual festival. Vote, engage, and participate in official student activities.",
  keywords: [
    "Pratishtha login",
    "Pratishtha 2026",
    "SAKEC voting",
    "student voting",
    "college festival voting",
    "SAKEC Pratishtha",
    "secure login"
  ],
  authors: [{ name: "Pratishtha Team", url: "https://pratishtha.sakec.ac.in" }],
  robots: "index, follow",
  openGraph: {
    title: "Login to Pratishtha 2026 | SAKEC Festival",
    description: "Secure login to Pratishtha 2026 - SAKEC's annual festival voting platform",
    url: "https://pratishtha.sakec.ac.in/login",
    type: "website",
  },
  canonical: "https://pratishtha.sakec.ac.in/login",
};

export default function LoginLayout({ children }) {
  return (
    <div className="inset-0 w-full flex flex-col">
{/* Main Content Area */}
      <div className="flex-1 overflow-y-auto z-10">
        {children}
      </div>
    </div>
  );
}
