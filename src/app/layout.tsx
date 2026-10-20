import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Special Sauce',
    default: 'specialsauce.io | securely connecting professionals and employers',
  },
  description: 'The AI-driven blind hiring platform that strips away bias and focuses purely on verified skills and experience.',
  openGraph: {
    title: 'Special Sauce | Hire for Talent, Not Background',
    description: 'Bypass the resume black hole. Apply anonymously and let your true capabilities unlock top-tier roles.',
    url: 'https://specialsauce.io',
    siteName: 'Special Sauce',
    images: [
      {
        url: 'https://specialsauce.io/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}