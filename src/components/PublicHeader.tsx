'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  resolvePreferredThemeIsDark,
  applyPreferredTheme,
} from '@/components/ThemeToggle'

export function PublicHeader({
  fixed = false,
}: {
  fixed?: boolean
}) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [darkModeEnabled, setDarkModeEnabled] = useState(true)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const syncDark = () => {
      const preferred = resolvePreferredThemeIsDark()
      setDarkModeEnabled(preferred)
    }
    syncDark()
    window.addEventListener('ss-theme-change', syncDark)
    return () => window.removeEventListener('ss-theme-change', syncDark)
  }, [pathname])

  const toggleDarkMode = () => {
    const nextDark = !darkModeEnabled
    setDarkModeEnabled(nextDark)
    applyPreferredTheme(nextDark)
    window.dispatchEvent(new Event('ss-theme-change'))
  }

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
      <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-10 h-20 sm:h-24 flex items-center justify-between gap-3">
        {/* LEFT: Clickable Full-Size Logo */}
        <div className="flex items-center min-w-0">
          <Link
            href="/"
            className="flex items-center hover:opacity-90 transition-opacity focus:outline-none"
          >
            <img
              src="/logo.png?v=20261024"
              alt="specialsauce.io Logo"
              width={420}
              height={105}
              className="h-11 sm:h-15 md:h-[68px] w-auto max-w-[220px] sm:max-w-none object-contain"
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

        {/* RIGHT (Mobile < md): Only the Square Hamburger Menu Button so nothing is clipped */}
        <div className="flex md:hidden items-center shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="inline-flex items-center justify-center w-11 h-11 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-100 text-slate-800 transition-colors cursor-pointer shadow-2xs"
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
        <div className="md:hidden border-t border-slate-300 bg-white px-5 pt-3.5 pb-5 space-y-3.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Primary Sign In Action inside Hamburger Menu */}
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-indigo-500 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black shadow-xs transition-colors"
          >
            <span>Sign In to Your Account</span>
            <span>→</span>
          </Link>

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
                      ? 'bg-slate-900 text-white shadow-xs'
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
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold text-center shadow-xs transition-colors"
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

          {/* Mobile Theme Toggle inside Hamburger Drawer */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-600">
              Appearance Theme
            </span>
            <button
              type="button"
              onClick={toggleDarkMode}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-300 bg-slate-100 text-slate-800 text-xs font-extrabold cursor-pointer"
            >
              <span>{darkModeEnabled ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
