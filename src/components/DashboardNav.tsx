'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import QuickFeedbackWidget from '@/components/QuickFeedbackWidget'

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
  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
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

  // Close dropdown when route changes
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Streamlined core workflow tabs (Membership/Billing & Security/Help moved cleanly into Account Dropdown)
  const candidateLinks = [
    { href: '/dashboard', label: 'Overview', exact: true },
    { href: '/dashboard/jobs', label: 'Find Jobs' },
    { href: '/dashboard/applications', label: 'My Applications' },
    { href: '/dashboard/requests', label: 'Employer Pitches' },
    { href: '/dashboard/profile', label: 'My Profile' },
    { href: '/dashboard/preferences', label: 'Match Preferences' },
  ]

  const employerLinks = [
    { href: '/dashboard', label: 'Overview', exact: true },
    { href: '/dashboard/employer/search', label: 'Search Talent' },
    { href: '/dashboard/employer/jobs', label: 'Manage Jobs' },
    { href: '/dashboard/employer/applications', label: 'Inbound Apps' },
    { href: '/dashboard/employer/pitches', label: 'Sent Pitches' },
    { href: '/dashboard/employer/organization', label: 'Company & Seats' },
  ]

  const navLinks =
    role === 'employer'
      ? employerLinks
      : role === 'candidate'
      ? candidateLinks
      : [{ href: '/dashboard', label: 'Dashboard', exact: true }]

  const billingHref =
    role === 'employer' ? '/dashboard/employer/billing' : '/dashboard/billing'

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname?.startsWith(`${href}/`)
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ROW 1: Clean Brand Header (Logo Left, Feedback + Unified Account Dropdown Right) */}
        <div className="flex items-center justify-between gap-4 py-3">
          {/* Left: Prominent Trimmed Logo + Clean Portal Subtitle */}
          <div className="flex items-center gap-3.5 min-w-0">
            <Link
              href="/dashboard"
              className="flex items-center shrink-0 group focus:outline-none"
            >
              <img
                src="/logo.png"
                alt="specialsauce.io Logo"
                className="h-11 sm:h-12 w-auto object-contain group-hover:opacity-90 transition-opacity"
              />
            </Link>

            <div className="hidden lg:flex flex-col border-l border-slate-200 pl-3.5 py-0.5 truncate">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400 truncate">
                Securely Connecting Professionals &amp; Employers
              </span>
              {role && (
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mt-0.5">
                  {role === 'employer'
                    ? 'Employer Workspace'
                    : 'Candidate Workspace'}
                </span>
              )}
            </div>
          </div>

          {/* Right: Quick Feedback + Single Unified Account & Plan Dropdown */}
          <div className="flex items-center gap-2.5 shrink-0">
            <QuickFeedbackWidget />

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
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

              {/* Dropdown Menu */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Account & Authoritative Plan Status Header */}
                  <div className="px-4 py-3 border-b border-slate-100 space-y-1.5">
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

                  {/* Single Authoritative Plan / Billing Link + Utility Links */}
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

                  {/* Sign Out */}
                  <div className="pt-1.5 mt-1 border-t border-slate-100 px-2">
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

        {/* ROW 2: Clean Core Workspace Navigation Tabs Only (Zero Right-Side Colored Pills!) */}
        <div className="flex items-center justify-between gap-4 py-2 border-t border-slate-100 overflow-x-auto no-scrollbar">
          <nav className="flex items-center gap-1 shrink-0">
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