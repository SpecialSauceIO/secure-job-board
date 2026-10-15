'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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

  const candidateLinks = [
    { href: '/dashboard', label: 'Overview', exact: true },
    { href: '/dashboard/jobs', label: 'Browse Blind Roles' },
    { href: '/dashboard/applications', label: 'My Applications' },
    { href: '/dashboard/requests', label: 'Employer Pitches' },
    { href: '/dashboard/profile', label: 'Anonymous Profile' },
    { href: '/dashboard/preferences', label: 'Match Dealbreakers' },
    { href: '/dashboard/billing', label: 'Pro Membership' },
  ]

  const employerLinks = [
    { href: '/dashboard', label: 'Overview', exact: true },
    { href: '/dashboard/employer/search', label: 'Search Talent Pool' },
    { href: '/dashboard/employer/jobs', label: 'Manage Roles' },
    { href: '/dashboard/employer/applications', label: 'Inbound Applicants' },
    { href: '/dashboard/employer/pitches', label: 'Sent Pitches' },
    { href: '/dashboard/employer/organization', label: 'Company & Team Seats' },
    { href: '/dashboard/employer/billing', label: 'Plans & Credits' },
  ]

  const navLinks =
    role === 'employer'
      ? employerLinks
      : role === 'candidate'
      ? candidateLinks
      : [{ href: '/dashboard', label: 'Dashboard', exact: true }]

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* TOP ROW: Exact Original Layout (Logo Left, Static Centered Tagline, Email + Sign Out Right) */}
        <div className="relative flex justify-between h-24 items-center gap-4">
          
          {/* LEFT: Clickable Logo (Acts as Home) */}
          <div className="flex items-center shrink-0">
            <Link href="/dashboard" className="flex items-center hover:opacity-90 transition-opacity">
              <Image
                src="/logo.jpg"
                alt="specialsauce.io Logo"
                width={300}
                height={75}
                className="w-[180px] sm:w-[220px] h-auto"
                priority
              />
            </Link>
          </div>

          {/* CENTERED STATIC TAGLINE (Desktop & Laptop) */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-3 lg:gap-4 whitespace-nowrap pointer-events-none">
            <span className="h-6 w-px bg-slate-200"></span>
            <p className="text-[10px] lg:text-xs font-bold text-slate-400 tracking-[0.15em] uppercase">
              Securely Connecting Professionals & Employers
            </p>
            <span className="h-6 w-px bg-slate-200"></span>
          </div>

          {/* RIGHT: User Email & Sign Out */}
          <div className="flex items-center gap-3 sm:gap-4 bg-white pl-4 relative z-10">
            <span className="text-sm font-medium text-gray-500 hidden sm:block whitespace-nowrap">
              {userEmail}
            </span>

            <form action={signOutAction}>
              <button
                type="submit"
                className="text-sm font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 sm:px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
              >
                Sign Out
              </button>
            </form>
          </div>

        </div>

        {/* MOBILE STATIC TAGLINE (Visible on screens smaller than md so it never disappears) */}
        <div className="flex md:hidden items-center justify-center gap-3 py-1.5 border-t border-slate-100">
          <span className="h-3.5 w-px bg-slate-200"></span>
          <p className="text-[10px] font-bold text-slate-400 tracking-[0.14em] uppercase text-center">
            Securely Connecting Professionals & Employers
          </p>
          <span className="h-3.5 w-px bg-slate-200"></span>
        </div>

        {/* BOTTOM ROW: Role Navigation Links (Left) + Tier Pill, Security & Help Links (Right) */}
        <div className="flex items-center justify-between gap-4 py-2.5 border-t border-gray-100 overflow-x-auto no-scrollbar">
          {/* Primary Role Links */}
          <div className="flex items-center gap-1.5 shrink-0">
            {navLinks.map((link) => {
              const active = isActive(link.href, link.exact)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Right Utility Pills: Live Tier Badge + Security & Stripe + Help & Guides */}
          <div className="flex items-center gap-2 shrink-0">
            {tierLabel && (
              <Link
                href={role === 'employer' ? '/dashboard/employer/billing' : '/dashboard/billing'}
                className="hidden xl:inline-flex items-center px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-extrabold whitespace-nowrap hover:bg-indigo-100 transition-colors"
              >
                {tierLabel}
              </Link>
            )}

            <Link
              href="/dashboard/security"
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1.5 border whitespace-nowrap ${
                isActive('/dashboard/security')
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg
                className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span>Security & Stripe</span>
            </Link>

            <Link
              href="/dashboard/support"
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1.5 border whitespace-nowrap ${
                isActive('/dashboard/support')
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg
                className="w-3.5 h-3.5 text-indigo-600 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Help & Guides</span>
            </Link>
          </div>
        </div>

      </div>
    </nav>
  )
}