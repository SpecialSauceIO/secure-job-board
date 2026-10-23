import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
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
  title: {
    template: '%s | Special Sauce',
    default: 'Special Sauce | Hire for Talent, Not Background',
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("ss_theme")?.value;
  const serverDarkClass = themeCookie === "dark" ? "dark" : "";

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
                  var saved = localStorage.getItem('ss_theme');
                  if (!saved) {
                    var match = document.cookie.match(/(?:^|; )ss_theme=([^;]*)/);
                    if (match) saved = decodeURIComponent(match[1]);
                  }
                  if (saved === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.cookie = 'ss_theme=dark; path=/; max-age=31536000; SameSite=Lax';
                  } else if (saved === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.cookie = 'ss_theme=light; path=/; max-age=31536000; SameSite=Lax';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
