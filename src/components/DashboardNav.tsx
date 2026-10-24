'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import QuickFeedbackWidget from '@/components/QuickFeedbackWidget'
import {
  resolvePreferredThemeIsDark,
  applyPreferredTheme,
} from '@/components/ThemeToggle'

export default function DashboardNav({
  role,
  userEmail,
  tierLabel,
  signOutAction,
}: {
  role: 'candidate' | 'employer' | null
  userEmail: string
  tierLabel?: string
  signOutAction: () => Promise<void>
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [colorTilesEnabled, setColorTilesEnabled] = useState(false)
  const [darkModeEnabled, setDarkModeEnabled] = useState(false)

  useEffect(() => {
    const syncDark = () => {
      const preferred = resolvePreferredThemeIsDark()
      applyPreferredTheme(preferred)
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
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const hasCookie = document.cookie
        .split('; ')
        .some((row) => row.startsWith('ss_a11y_color_tiles=1'))
      setColorTilesEnabled(hasCookie)
    } catch {}
  }, [])

  const toggleColorTiles = () => {
    const next = !colorTilesEnabled
    setColorTilesEnabled(next)
    try {
      document.cookie = `ss_a11y_color_tiles=${
        next ? '1' : '0'
      }; path=/; max-age=31536000; SameSite=Lax`
    } catch {}
    router.refresh()
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const candidateLinks = [
    { href: '/dashboard', label: 'Overview', exact: true },
    { href: '/dashboard/jobs', label: 'Find Roles' },
    { href: '/dashboard/applications', label: 'Outbound Applications' },
    { href: '/dashboard/requests', label: 'Inbound Pitches' },
    { href: '/dashboard/profile', label: 'My Profile' },
    { href: '/dashboard/preferences', label: 'Match Preferences' },
    { href: '/dashboard/support', label: 'Support' },
  ]

  const employerLinks = [
    { href: '/dashboard', label: 'Overview', exact: true },
    { href: '/dashboard/employer/search', label: 'Search Talent' },
    { href: '/dashboard/employer/jobs', label: 'Manage Roles' },
    { href: '/dashboard/employer/applications', label: 'Inbound Applications' },
    { href: '/dashboard/employer/pitches', label: 'Outbound Pitches' },
    { href: '/dashboard/employer/organization', label: 'Manage Company' },
    { href: '/dashboard/support', label: 'Support' },
  ]

  const navLinks =
    role === 'employer'
      ? employerLinks
      : role === 'candidate'
      ? candidateLinks
      : [
          { href: '/dashboard', label: 'Dashboard', exact: true },
          { href: '/dashboard/support', label: 'Support' },
        ]

  const billingHref =
    role === 'employer' ? '/dashboard/employer/billing' : '/dashboard/billing'

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname?.startsWith(`${href}/`)
  }

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-300 shadow-2xs">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* ROW 1: Identical to PublicHeader (Full-Size Logo Left, Centered Tagline, Feedback + Account Right) */}
        <div className="h-24 flex items-center justify-between relative">
          {/* LEFT: Clickable Full-Size Logo */}
          <div className="flex items-center shrink-0">
            <Link
              href="/dashboard"
              className="flex items-center hover:opacity-90 transition-opacity focus:outline-none"
            >
              <img
                src="/logo.png"
                alt="specialsauce.io Logo"
                className="h-14 sm:h-16 md:h-[72px] w-auto object-contain"
              />
            </Link>
          </div>

                  {/* CENTERED: Tagline */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden xl:flex items-center gap-4 pointer-events-none">
          <span className="h-5 w-px bg-slate-400"></span>
          <p className="text-xs font-semibold text-slate-700 tracking-[0.14em] uppercase whitespace-nowrap">
            SECURELY CONNECTING PROFESSIONALS &amp; EMPLOYERS
          </p>
          <span className="h-5 w-px bg-slate-400"></span>
        </div>

          {/* RIGHT: Quick Feedback + Unified Account & Plan Dropdown */}
          <div className="flex items-center gap-3 shrink-0">
            <QuickFeedbackWidget />

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl border-2 border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50 text-slate-900 text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-extrabold uppercase shrink-0">
                  {userEmail ? userEmail.charAt(0) : 'U'}
                </span>
                <span className="hidden sm:inline-block max-w-[170px] truncate text-slate-700">
                  {userEmail || 'Account'}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    menuOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border-2 border-slate-300 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-3 border-b border-slate-300 space-y-1.5">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Signed in as
                    </p>
                    <p className="text-xs font-extrabold text-slate-900 truncate">
                      {userEmail}
                    </p>
                    {tierLabel && (
                      <div className="pt-1 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-slate-500">
                          Current Plan:
                        </span>
                        <span className="text-[11px] font-extrabold text-indigo-700 truncate">
                          {tierLabel}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="py-1.5 px-2 space-y-0.5">
                    <Link
                      href={billingHref}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <span>
                        {role === 'employer'
                          ? 'Billing, Plan & Pitch Credits'
                          : 'Membership & Plan Settings'}
                      </span>
                      <span className="text-indigo-600 font-extrabold">→</span>
                    </Link>

                    <Link
                      href="/dashboard/security"
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <span>2-Stage Vault &amp; Security</span>
                    </Link>

                    <Link
                      href="/dashboard/support"
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <span>Help Center &amp; Playbooks</span>
                    </Link>
                  </div>

                  {/* Accessibility Options Section */}
                  <div className="py-2 px-3 border-t border-slate-300 space-y-1.5">
                    <p className="px-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Accessibility
                    </p>
                    <button
                      type="button"
                      onClick={toggleColorTiles}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-left"
                    >
                      <div>
                        <span className="block text-xs font-bold text-slate-800">
                          Color-Coded Tiles
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          High-contrast widget backgrounds
                        </span>
                      </div>
                      <span
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                          colorTilesEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`toggle-knob inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${
                            colorTilesEnabled ? 'translate-x-4' : 'translate-x-1'
                          }`}
                        />
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={toggleDarkMode}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-left"
                    >
                      <div>
                        <span className="block text-xs font-bold text-slate-800">
                          Dark Mode
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          Midnight slate eye-strain reduction
                        </span>
                      </div>
                      <span
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                          darkModeEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`toggle-knob inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${
                            darkModeEnabled ? 'translate-x-4' : 'translate-x-1'
                          }`}
                        />
                      </span>
                    </button>
                  </div>

                  <div className="pt-1.5 mt-1 border-t border-slate-300 px-2">
                    <form action={signOutAction}>
                      <button
                        type="submit"
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-extrabold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ROW 2: Clean Core Workspace Navigation Tabs */}
        <div className="flex items-center justify-between gap-4 py-2 border-t border-slate-300 overflow-x-auto no-scrollbar">
          <nav className="flex items-center gap-1.5 shrink-0">
            {navLinks.map((item) => {
              const active = isActive(item.href, item.exact)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
