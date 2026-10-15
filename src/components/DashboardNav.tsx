'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { submitQuickFeedback } from '@/app/dashboard/actions'

interface DashboardNavProps {
  role: 'candidate' | 'employer' | null
  userEmail: string
  tierLabel?: string
  signOutAction: () => Promise<void>
}

export default function DashboardNav({
  role,
  userEmail,
  tierLabel,
  signOutAction,
}: DashboardNavProps) {
  const pathname = usePathname()

  const [accountOpen, setAccountOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackType, setFeedbackType] = useState<'Bug' | 'Idea' | 'General'>('Bug')
  const [feedbackNotes, setFeedbackNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackSentRef, setFeedbackSentRef] = useState<string | null>(null)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  const accountRef = useRef<HTMLDivElement>(null)
  const feedbackRef = useRef<HTMLDivElement>(null)

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false)
      }
      if (feedbackRef.current && !feedbackRef.current.contains(e.target as Node)) {
        setFeedbackOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setAccountOpen(false)
    setFeedbackOpen(false)
  }, [pathname])

  const employerPrimaryLinks = [
    { href: '/dashboard', label: 'Overview', exact: true },
    { href: '/dashboard/employer/search', label: 'Find Talent' },
    { href: '/dashboard/employer/jobs', label: 'Jobs' },
    { href: '/dashboard/employer/applications', label: 'Applicants' },
    { href: '/dashboard/employer/pitches', label: 'Sent Pitches' },
  ]

  const candidatePrimaryLinks = [
    { href: '/dashboard', label: 'Overview', exact: true },
    { href: '/dashboard/jobs', label: 'Find Jobs' },
    { href: '/dashboard/applications', label: 'Applications' },
    { href: '/dashboard/requests', label: 'Employer Pitches' },
    { href: '/dashboard/profile', label: 'My Profile' },
  ]

  const primaryLinks =
    role === 'employer'
      ? employerPrimaryLinks
      : role === 'candidate'
      ? candidatePrimaryLinks
      : []

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!feedbackNotes.trim()) return

    setIsSubmitting(true)
    setFeedbackError(null)

    const formData = new FormData()
    formData.set('feedback_type', feedbackType)
    formData.set('notes', feedbackNotes.trim())
    formData.set('page_url', typeof window !== 'undefined' ? window.location.pathname : pathname)
    formData.set(
      'user_agent',
      typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser'
    )

    const res = await submitQuickFeedback(formData)
    setIsSubmitting(false)

    if (res?.error) {
      setFeedbackError(res.error)
    } else {
      setFeedbackSentRef(res?.referenceId || 'SENT')
      setFeedbackNotes('')
      setTimeout(() => {
        setFeedbackSentRef(null)
        setFeedbackOpen(false)
      }, 1800)
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        {/* LEFT: LOGO + 5 CORE WORKFLOW TABS */}
        <div className="flex items-center gap-6 lg:gap-8 min-w-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
            <img
              src="/logo.png"
              alt="Special Sauce"
              className="h-8 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <span className="text-lg font-black tracking-tight text-slate-900">
              special<span className="text-orange-500">sauce</span>
            </span>
          </Link>

          {primaryLinks.length > 0 && (
            <nav className="hidden md:flex items-center gap-1">
              {primaryLinks.map((item) => {
                const active = isActive(item.href, item.exact)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      active
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          )}
        </div>

        {/* RIGHT: 1-CLICK BUG REPORTER + UNIFIED ACCOUNT MENU */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* 1-CLICK FEEDBACK / BUG POPOVER */}
          <div className="relative" ref={feedbackRef}>
            <button
              type="button"
              onClick={() => {
                setFeedbackOpen((prev) => !prev)
                setAccountOpen(false)
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>🐞</span>
              <span className="hidden sm:inline">Report Issue</span>
            </button>

            {feedbackOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-slate-900">
                    Quick Feedback / Bug Report
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Auto-attaches URL
                  </span>
                </div>

                {feedbackSentRef ? (
                  <div className="py-6 text-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 font-bold text-sm">
                      ✓
                    </div>
                    <p className="text-xs font-bold text-slate-900">
                      Sent! Reference: {feedbackSentRef}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Page URL & device context attached automatically.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                    <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-lg">
                      {(['Bug', 'Idea', 'General'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFeedbackType(t)}
                          className={`py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                            feedbackType === t
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {t === 'Bug' ? '🐞 Bug' : t === 'Idea' ? '💡 Idea' : '✨ Note'}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={3}
                      value={feedbackNotes}
                      onChange={(e) => setFeedbackNotes(e.target.value)}
                      placeholder="What happened or what could be cleaner? (We automatically include this page's URL)"
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
                      required
                    />

                    {feedbackError && (
                      <p className="text-[11px] font-semibold text-rose-600">{feedbackError}</p>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setFeedbackOpen(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmitting ? 'Sending...' : 'Send Report'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* ACCOUNT & SETTINGS DROPDOWN (Consolidates Company, Billing, Security, Help, Sign Out) */}
          <div className="relative" ref={accountRef}>
            <button
              type="button"
              onClick={() => {
                setAccountOpen((prev) => !prev)
                setFeedbackOpen(false)
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="max-w-[150px] truncate">{userEmail || 'Account'}</span>
              <svg
                className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                  accountOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {accountOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
                {tierLabel && (
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Current Plan
                    </p>
                    <p className="font-extrabold text-slate-900 mt-0.5">{tierLabel}</p>
                  </div>
                )}

                <div className="py-1">
                  {role === 'employer' && (
                    <>
                      <Link
                        href="/dashboard/employer/organization"
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-semibold"
                      >
                        <span>🏢</span>
                        <span>Company & Team Seats</span>
                      </Link>
                      <Link
                        href="/dashboard/employer/billing"
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-semibold"
                      >
                        <span>💳</span>
                        <span>Plans & Pitch Credits</span>
                      </Link>
                    </>
                  )}

                  {role === 'candidate' && (
                    <>
                      <Link
                        href="/dashboard/preferences"
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-semibold"
                      >
                        <span>⚙️</span>
                        <span>Match Dealbreakers</span>
                      </Link>
                      <Link
                        href="/dashboard/billing"
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-semibold"
                      >
                        <span>💳</span>
                        <span>Membership & Pro Pass</span>
                      </Link>
                    </>
                  )}

                  <Link
                    href="/dashboard/security"
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-semibold"
                  >
                    <span>🛡️</span>
                    <span>Security & Stripe Vault</span>
                  </Link>

                  <Link
                    href="/dashboard/support"
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-semibold"
                  >
                    <span>❓</span>
                    <span>Help Center & Playbooks</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 mt-1 pt-1 px-2">
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="w-full text-left px-2 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2.5 cursor-pointer"
                    >
                      <span>🚪</span>
                      <span>Sign Out</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE NAV ROW (Only visible on small screens) */}
      {primaryLinks.length > 0 && (
        <div className="flex md:hidden items-center gap-1 overflow-x-auto px-4 py-2 border-t border-slate-100 bg-slate-50/60">
          {primaryLinks.map((item) => {
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap ${
                  active ? 'bg-slate-900 text-white' : 'text-slate-600'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      )}
    </header>
  )
}