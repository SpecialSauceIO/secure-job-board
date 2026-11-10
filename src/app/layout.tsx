import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css"
import { Suspense } from "react"
import MarketingPixels from "@/components/MarketingPixels";
import SeoJsonLd from "@/components/SeoJsonLd";
import ThemeToggle from "@/components/ThemeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.specialsauce.io"),
  title: {
    template: "%s | SpecialSauce.io",
    default: "SpecialSauce.io | Verified Job Marketplace for Professionals & Employers",
  },
  description: "SpecialSauce.io is the verified job marketplace securely connecting ID-verified professionals and verified employers based on real skills, upfront pay, and mutual interest.",
  applicationName: "SpecialSauce.io",
  keywords: ["SpecialSauce.io", "Special Sauce", "Special Sauce jobs", "Special Sauce hiring", "verified job marketplace", "verified professionals", "verified employers", "skill matching job board"],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "SpecialSauce.io | Verified Job Marketplace for Professionals & Employers",
    description: "Connect directly with ID-verified professionals and verified employers based on real skills and upfront pay while keeping personal details private until you choose to unlock them.",
    url: "https://www.specialsauce.io",
    siteName: "SpecialSauce.io",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpecialSauce.io | Verified Job Marketplace for Professionals & Employers",
    description: "Securely connecting ID-verified professionals and verified employers based on real skills, upfront pay, and mutual interest.",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("ss_theme")?.value;
  const serverDarkClass = themeCookie === "light" ? "" : "dark";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased ${serverDarkClass}`.trim()}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var isDash = window.location.pathname.indexOf('/dashboard') === 0;
                  if (!isDash) {
                    document.documentElement.classList.add('dark');
                  } else {
                    var saved = localStorage.getItem('ss_theme');
                    if (!saved) {
                      var match = document.cookie.match(/(?:^|; )ss_theme=([^;]*)/);
                      if (match) saved = decodeURIComponent(match[1]);
                    }
                    if (saved === 'light') {
                      document.documentElement.classList.remove('dark');
                    } else {
                      document.documentElement.classList.add('dark');
                    }
                  }
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <ThemeToggle />
        <Suspense fallback={null}>
          <MarketingPixels />
        </Suspense>
        <SeoJsonLd />
      </body>
    </html>
  );
}
