'use client'

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
    { href: '/dashboard/jobs', label: 'Find Jobs' },
    { href: '/dashboard/applications', label: 'My Applications' },
    { href: '/dashboard/requests', label: 'Employer Pitches' },
    { href: '/dashboard/profile', label: 'My Profile' },
    { href: '/dashboard/preferences', label: 'Match Preferences' },
    { href: '/dashboard/billing', label: 'Membership' },
  ]

  const employerLinks = [
    { href: '/dashboard', label: 'Overview', exact: true },
    { href: '/dashboard/employer/search', label: 'Search Talent' },
    { href: '/dashboard/employer/jobs', label: 'Manage Jobs' },
    { href: '/dashboard/employer/applications', label: 'Inbound Apps' },
    { href: '/dashboard/employer/pitches', label: 'Sent Pitches' },
    { href: '/dashboard/employer/organization', label: 'Company & Seats' },
    { href: '/dashboard/employer/billing', label: 'Billing & Credits' },
  ]

  const navLinks =
    role === 'employer'
      ? employerLinks
      : role === 'candidate'
      ? candidateLinks
      : [{ href: '/dashboard', label: 'Dashboard', exact: true }]

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname?.startsWith(`${href}/`)
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Row: Prominent Brand Logo + Security Badge, Tier Pill, & Sign Out */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-3.5">
          {/* Left: Prominent Trimmed Logo + Tagline */}
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center shrink-0 group focus:outline-none"
            >
              <img
                src="/logo.png"
                alt="specialsauce.io Logo"
                className="h-12 sm:h-14 md:h-16 w-auto object-contain group-hover:scale-[1.02] transition-transform"
              />
            </Link>

            <div className="hidden xl:flex flex-col border-l border-slate-200 pl-4 py-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                Securely Connecting Professionals &amp; Employers
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  🛡️ 2-Stage Identity Vault Active
                </span>
                {role && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600">
                      {role === 'employer'
                        ? 'Employer Portal'
                        : 'Candidate Portal'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Tier Badge, Security/Help Quick Links, User Email & Sign Out */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {tierLabel && (
              <Link
                href={
                  role === 'employer'
                    ? '/dashboard/employer/billing'
                    : '/dashboard/billing'
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-extrabold hover:bg-indigo-100 transition-colors shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                {tierLabel}
              </Link>
            )}

            <Link
              href="/dashboard/security"
              className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors"
            >
              🔒 Vault &amp; Security
            </Link>

            <Link
              href="/dashboard/support"
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Help Center
            </Link>

            {userEmail && (
              <span className="hidden lg:inline-block text-xs font-semibold text-slate-500 max-w-[190px] truncate">
                {userEmail}
              </span>
            )}

            <form action={signOutAction}>
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-extrabold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer shadow-2xs"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Row: Role Navigation Bar */}
        <nav className="flex items-center gap-1.5 overflow-x-auto py-2.5 border-t border-slate-100 no-scrollbar">
          {navLinks.map((item) => {
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}