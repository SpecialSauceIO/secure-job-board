'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function PublicHeader({
  fixed = false,
}: {
  fixed?: boolean
}) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<'employers' | 'professionals' | null>(null)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setMobileMenuOpen(false)
    setOpenDropdown(null)
  }, [pathname])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDropdown(null)
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const topLinks = [
    { href: '/', label: 'Home', exact: true },
    { href: '/about', label: 'About' },
    { href: '/security', label: 'Security & Trust' },
  ]

  const employerLinks = [
    { href: '/workflows?tab=employer', label: 'How It Works', sub: '5-step employer hiring guide' },
    { href: '/pricing#employers', label: 'Plans & Pricing', sub: '$299–$999/mo • Roles included' },
    { href: '/talent-shield', label: 'Verified Hiring Bridge', sub: 'Filter external links & leads' },
    { href: '/w2-hiring', label: 'Built-In W-2 Hiring', sub: 'Direct hire & $0 conversion EOR' },
    { href: '/signup/employer', label: 'Verify Organization ($25)', sub: 'Start $0/mo Practice Mode', cta: true },
  ]

  const professionalLinks = [
    { href: '/workflows?tab=professional', label: 'How It Works', sub: '5-step privacy-first guide' },
    { href: '/pricing#professionals', label: 'Plans & Perks', sub: '$0/mo Explorer to Prestige' },
    { href: '/signup/candidate', label: 'Start Explorer ($5)', sub: 'Verify once • $0/mo forever', cta: true },
  ]

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname?.startsWith(`${href}/`)
  }

  const isEmployerActive =
    pathname === '/talent-shield' ||
    pathname === '/w2-hiring' ||
    pathname === '/signup/employer'

  const isProfessionalActive =
    pathname === '/signup/candidate' ||
    pathname === '/signup/professional'

  return (
    <nav
      ref={navRef}
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
            THE WORLD&apos;S FIRST SECURED WORKFORCE ECOSYSTEM™
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
            href="/about"
            className={`text-sm font-bold transition-colors whitespace-nowrap ${
              pathname === '/about'
                ? 'text-indigo-600'
                : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            About
          </Link>

          {/* Employers Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setOpenDropdown('employers')}
            onMouseLeave={() => setOpenDropdown((prev) => (prev === 'employers' ? null : prev))}
          >
            <button
              type="button"
              onClick={() => setOpenDropdown((prev) => (prev === 'employers' ? null : 'employers'))}
              aria-expanded={openDropdown === 'employers'}
              aria-haspopup="menu"
              className={`inline-flex items-center gap-1 text-sm font-bold transition-colors whitespace-nowrap cursor-pointer py-2 ${
                openDropdown === 'employers' || isEmployerActive
                  ? 'text-emerald-700'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <span>Employers</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                  openDropdown === 'employers' ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {openDropdown === 'employers' && (
              <div role="menu" className="absolute right-0 top-full pt-2 w-72 z-50">
                <div className="rounded-xl border border-slate-700/90 bg-[#0b1220] py-1.5 shadow-2xl overflow-hidden">
                  {employerLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={() => setOpenDropdown(null)}
                      className={
                        item.cta
                          ? 'mt-1 border-t border-slate-800 flex items-center justify-between px-4 py-3 hover:bg-slate-800/80 transition-colors'
                          : 'flex flex-col px-4 py-2.5 hover:bg-slate-800/80 transition-colors'
                      }
                    >
                      {item.cta ? (
                        <>
                          <div>
                            <div className="text-sm font-extrabold text-emerald-400">{item.label}</div>
                            <div className="text-xs font-medium text-slate-400">{item.sub}</div>
                          </div>
                          <span className="text-sm font-black text-emerald-400">→</span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-bold text-white">{item.label}</span>
                          <span className="text-xs font-medium text-slate-400">{item.sub}</span>
                        </>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Professionals Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setOpenDropdown('professionals')}
            onMouseLeave={() => setOpenDropdown((prev) => (prev === 'professionals' ? null : prev))}
          >
            <button
              type="button"
              onClick={() => setOpenDropdown((prev) => (prev === 'professionals' ? null : 'professionals'))}
              aria-expanded={openDropdown === 'professionals'}
              aria-haspopup="menu"
              className={`inline-flex items-center gap-1 text-sm font-bold transition-colors whitespace-nowrap cursor-pointer py-2 ${
                openDropdown === 'professionals' || isProfessionalActive
                  ? 'text-indigo-600'
                  : 'text-slate-600 hover:text-indigo-600'
              }`}
            >
              <span>Professionals</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                  openDropdown === 'professionals' ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {openDropdown === 'professionals' && (
              <div role="menu" className="absolute right-0 top-full pt-2 w-72 z-50">
                <div className="rounded-xl border border-slate-700/90 bg-[#0b1220] py-1.5 shadow-2xl overflow-hidden">
                  {professionalLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={() => setOpenDropdown(null)}
                      className={
                        item.cta
                          ? 'mt-1 border-t border-slate-800 flex items-center justify-between px-4 py-3 hover:bg-slate-800/80 transition-colors'
                          : 'flex flex-col px-4 py-2.5 hover:bg-slate-800/80 transition-colors'
                      }
                    >
                      {item.cta ? (
                        <>
                          <div>
                            <div className="text-sm font-extrabold text-sky-400">{item.label}</div>
                            <div className="text-xs font-medium text-slate-400">{item.sub}</div>
                          </div>
                          <span className="text-sm font-black text-sky-400">→</span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-bold text-white">{item.label}</span>
                          <span className="text-xs font-medium text-slate-400">{item.sub}</span>
                        </>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
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
        <div className="md:hidden max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-slate-800 bg-[#0b1220] px-5 pt-4 pb-6 space-y-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Primary Sign In Action inside Hamburger Menu */}
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black shadow-xs transition-colors"
          >
            <span>Sign In to Your Account</span>
            <span>→</span>
          </Link>

          <div className="border-t border-slate-800 pt-2">
            {topLinks.map((item) => {
              const active = isActive(item.href, item.exact)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-2 py-2.5 text-sm font-bold transition-colors ${
                    active
                      ? 'text-white bg-slate-800/70 rounded-lg'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-slate-500">→</span>
                </Link>
              )
            })}
          </div>

          {/* Grouped Employers Section */}
          <div className="border-t border-slate-800 pt-3">
            <div className="px-2 pb-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-400">
              Employers
            </div>
            {employerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-2 py-2.5 rounded-lg hover:bg-slate-800/70 text-sm transition-colors ${
                  item.cta ? 'font-extrabold text-emerald-400' : 'font-semibold text-slate-200 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                <span className={item.cta ? 'text-xs text-emerald-400' : 'text-xs text-slate-500'}>→</span>
              </Link>
            ))}
          </div>

          {/* Grouped Professionals Section */}
          <div className="border-t border-slate-800 pt-3">
            <div className="px-2 pb-1.5 text-[11px] font-black uppercase tracking-wider text-sky-400">
              Professionals
            </div>
            {professionalLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-2 py-2.5 rounded-lg hover:bg-slate-800/70 text-sm transition-colors ${
                  item.cta ? 'font-extrabold text-sky-400' : 'font-semibold text-slate-200 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                <span className={item.cta ? 'text-xs text-sky-400' : 'text-xs text-slate-500'}>→</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
