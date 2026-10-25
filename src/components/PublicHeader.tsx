'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function PublicHeader({
  fixed = false,
}: {
  fixed?: boolean
}) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const publicLinks = [
    { href: '/', label: 'Home', exact: true },
    { href: '/workflows', label: 'How It Works' },
    { href: '/pricing', label: 'Pricing & Perks' },
    { href: '/security', label: 'Security & Trust' },
  ]

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname?.startsWith(`${href}/`)
  }

  return (
    <nav
      className={`${
        fixed ? 'fixed top-0 left-0 right-0' : 'sticky top-0'
      } z-40 bg-white/90 backdrop-blur-md border-b border-slate-300`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 h-20 sm:h-24 flex items-center justify-between gap-3">
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
              className="h-12 sm:h-15 md:h-[68px] w-auto object-contain"
            />
          </Link>
        </div>

        {/* CENTERED IN AVAILABLE SPACE: Tagline (Desktop xl+) */}
        <div className="hidden xl:flex items-center justify-center gap-3 mx-auto px-2 pointer-events-none shrink-0">
          <span className="h-5 w-px bg-slate-400"></span>
          <p className="text-[11px] font-semibold text-slate-700 tracking-[0.12em] uppercase whitespace-nowrap">
            SECURELY CONNECTING PROFESSIONALS &amp; EMPLOYERS
          </p>
          <span className="h-5 w-px bg-slate-400"></span>
        </div>

        {/* RIGHT (Desktop md+): Home, How It Works, Pricing & Perks & Sign In */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
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
            className={`text-sm font-bold transition-colors whitespace-nowrap ${
              pathname === '/workflows'
                ? 'text-indigo-600'
                : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            How It Works
          </Link>
          <Link
            href="/pricing"
            className={`text-sm font-bold transition-colors whitespace-nowrap ${
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

        {/* RIGHT (Mobile < md): Compact Sign In + Square Hamburger Menu Button */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          <Link
            href="/login"
            className="inline-flex items-center px-3 py-2 rounded-xl border-2 border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-extrabold transition-all shadow-2xs whitespace-nowrap"
          >
            Sign In
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-100 text-slate-800 transition-colors cursor-pointer shadow-2xs"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* COLLAPSIBLE MOBILE NAVIGATION DRAWER (< md) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-300 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-2 py-1.5 rounded-lg bg-slate-100 text-center">
            <p className="text-[10px] font-extrabold text-slate-600 tracking-[0.12em] uppercase">
              SECURELY CONNECTING PROFESSIONALS &amp; EMPLOYERS
            </p>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {publicLinks.map((item) => {
              const active = isActive(item.href, item.exact)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-extrabold transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-800 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-xs opacity-75">→</span>
                </Link>
              )
            })}
          </div>

          <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2.5">
            <Link
              href="/signup/candidate"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold text-center shadow-xs transition-colors"
            >
              I&apos;m a Candidate →
            </Link>
            <Link
              href="/signup/employer"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-xs font-extrabold text-center transition-colors"
            >
              I&apos;m an Employer
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
