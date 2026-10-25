'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function PublicHeader({
  fixed = false,
}: {
  fixed?: boolean
}) {
  const pathname = usePathname()

  return (
    <nav
      className={`${
        fixed ? 'fixed top-0 left-0 right-0' : 'sticky top-0'
      } z-40 bg-white/85 backdrop-blur-md border-b border-slate-300`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-24 flex items-center justify-between gap-4">
        {/* LEFT: Clickable Full-Size Logo */}
        <div className="flex items-center shrink-0">
          <Link
            href="/"
            className="flex items-center hover:opacity-90 transition-opacity focus:outline-none"
          >
            <img
              src="/logo.png?v=20261024"
              alt="specialsauce.io Logo"
              width={420}
              height={105}
              className="h-14 sm:h-16 md:h-[68px] w-auto object-contain"
            />
          </Link>
        </div>

        {/* CENTERED IN AVAILABLE SPACE: Tagline (Never overlaps left logo or right nav) */}
        <div className="hidden xl:flex items-center justify-center gap-3 mx-auto px-2 pointer-events-none shrink-0">
          <span className="h-5 w-px bg-slate-400"></span>
          <p className="text-[11px] font-semibold text-slate-700 tracking-[0.12em] uppercase whitespace-nowrap">
            SECURELY CONNECTING PROFESSIONALS &amp; EMPLOYERS
          </p>
          <span className="h-5 w-px bg-slate-400"></span>
        </div>

        {/* RIGHT: Home, How It Works, Pricing & Perks & Sign In */}
        <div className="flex items-center gap-3.5 sm:gap-4 shrink-0">
          <Link
            href="/"
            className={`text-sm font-bold transition-colors whitespace-nowrap ${
              pathname === '/'
                ? 'text-indigo-600'
                : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            Home
          </Link>
          <Link
            href="/workflows"
            className={`hidden sm:inline text-sm font-bold transition-colors whitespace-nowrap ${
              pathname === '/workflows'
                ? 'text-indigo-600'
                : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            How It Works
          </Link>
          <Link
            href="/pricing"
            className={`hidden sm:inline text-sm font-bold transition-colors whitespace-nowrap ${
              pathname === '/pricing'
                ? 'text-indigo-600'
                : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            Pricing &amp; Perks
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 rounded-xl border-2 border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-indigo-400 text-slate-800 hover:text-indigo-600 text-sm font-bold transition-all shadow-2xs whitespace-nowrap"
          >
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  )
}
