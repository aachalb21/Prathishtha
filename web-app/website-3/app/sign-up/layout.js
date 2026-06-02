import React from 'react';


export const metadata = {
  title: 'Register Now | Pratishtha 2026 | SAKEC Festival',
  description: 'Sign up for Pratishtha 2026 - SAKEC\'s annual festival. Register to participate in cultural, technical, and sports events.',
  keywords: [
    'Pratishtha registration',
    'Pratishtha signup',
    'SAKEC registration',
    'festival registration',
    'Pratishtha 2026',
    'student registration'
  ],
  authors: [{ name: 'Pratishtha Team', url: 'https://pratishtha.sakec.ac.in' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Register for Pratishtha 2026 | SAKEC Festival',
    description: 'Join Pratishtha 2026 - SAKEC\'s annual festival',
    url: 'https://pratishtha.sakec.ac.in/sign-up',
    type: 'website',
  },
  canonical: 'https://pratishtha.sakec.ac.in/sign-up',
};
export default function SignupLayout({ children }) {
  return (
    <div className="max-w-screen h-screen bg-[url('/assets/background/comic-bg.png')] bg-cover bg-center overflow-auto">
      {/* Custom Sign Up Layout */}
      {children}
    </div>
     
  );
}
