'use client'

import { useState } from 'react'
import Link from 'next/link'
import { activateSandboxEmployerTier } from '@/app/dashboard/actions'

const SUBSCRIPTION_TIERS = [
  {
    id: 'starter' as const,
    name: 'Starter Tier',
    price: '$149',
    interval: '/ month',
    maxActiveJobs: 5,
    monthlyCredits: 10,
    maxSeats: 1,
    seatLabel: '1 Seat (Account Owner)',
    description: 'Built for seed and early-stage teams hiring for up to 5 active roles simultaneously.',
    features: [
      'Up to 5 Active Blind Job Postings at once',
      '10 Outbound Passive Candidate Pitches / mo (2:1)',
      '1 Account Owner Seat included',
      'Unlimited Inbound Blind Application Unlocks',
      'Shared SS-XXXXXXXX Reference ID Tracking',
    ],
    popular: false,
    enterprise: false,
  },
  {
    id: 'growth' as const,
    name: 'Growth Tier',
    price: '$499',
    interval: '/ month',
    maxActiveJobs: 15,
    monthlyCredits: 30,
    maxSeats: 3,
    seatLabel: 'Up to 3 Team / BPO Partner Seats',
    description: 'Ideal for mid-market teams and regional BPO delivery pods collaborating on 10–15 open roles.',
    features: [
      'Up to 15 Active Blind Job Postings at once',
      '30 Outbound Passive Candidate Pitches / mo (2:1)',
      'Up to 3 Seats (Owner + 2 Hiring Manager / BPO Seats)',
      'Unused Pitch Credits Roll Over (up to 60 max)',
      'Priority Placement in Candidate Job Feeds',
    ],
    popular: true,
    enterprise: false,
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise Tier',
    price: '$1,250',
    interval: '/ month',
    maxActiveJobs: 50,
    monthlyCredits: 100,
    maxSeats: 10,
    seatLabel: 'Up to 10 Team & BPO Partner Seats',
    description: 'Full-scale talent acquisition infrastructure for large enterprises and W-2 BPO delivery teams.',
    features: [
      'Up to 50 Active Blind Job Postings at once',
      '100 Outbound Passive Candidate Pitches / mo (2:1)',
      'Up to 10 Seats (Full Hiring Team & BPO Partners)',
      'Workday & Greenhouse ATS API Auto-Sync',
      'Unused Pitch Credits Roll Over (up to 200 max)',
    ],
    popular: false,
    enterprise: true,
  },
]

export default function EmployerBillingClient({
  initialCredits,
  initialTier,
  initialMaxJobs,
  initialMaxSeats = 1,
  activeJobsCount,
  totalSent,
  orgName,
  initialBanner,
}: {
  initialCredits: number
  initialTier: 'free' | 'starter' | 'growth' | 'enterprise'
  initialMaxJobs: number
  initialMaxSeats?: number
  activeJobsCount: number
  totalSent: number
  orgName: string
  initialBanner?: { type: 'success' | 'error'; text: string } | null
}) {
  const [credits, setCredits] = useState<number>(initialCredits)
  const [currentTier, setCurrentTier] = useState<'free' | 'starter' | 'growth' | 'enterprise'>(initialTier)
  const [maxJobs, setMaxJobs] = useState<number>(initialMaxJobs)
  const [maxSeats, setMaxSeats] = useState<number>(initialMaxSeats)
  const [loadingTierId, setLoadingTierId] = useState<string | null>(null)
  const [sandboxLoadingTier, setSandboxLoadingTier] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    initialBanner || null
  )

  const handleSubscribeCheckout = async (tierId: 'starter' | 'growth' | 'enterprise') => {
    setLoadingTierId(tierId)
    setFeedback(null)

    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        setFeedback({
          type: 'error',
          text:
            data.error ||
            'Could not launch Stripe Subscription Checkout. Use the Developer Sandbox Tier Switcher below to test tiers locally.',
        })
        setLoadingTierId(null)
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Network error starting subscription checkout.',
      })
      setLoadingTierId(null)
    }
  }

  const handleSandboxTierSwitch = async (targetTier: 'free' | 'starter' | 'growth' | 'enterprise') => {
    setSandboxLoadingTier(targetTier)
    setFeedback(null)

    const result = await activateSandboxEmployerTier(targetTier)
    if (result?.error) {
      setFeedback({ type: 'error', text: result.error })
    } else if (result?.success) {
      setCurrentTier(result.tier as any)
      setMaxJobs(result.maxActiveJobs ?? 0)
      setMaxSeats(result.maxSeats ?? 1)
      setCredits(result.newCredits ?? 0)
      setFeedback({
        type: 'success',
        text: result.message || `Switched organization to ${targetTier.toUpperCase()} tier!`,
      })
    }

    setSandboxLoadingTier(null)
  }

  const tierDisplayLabel =
    currentTier === 'enterprise'
      ? 'Enterprise ($1,250/mo Founding ($1,999 Retail))'
      : currentTier === 'growth'
      ? 'Growth ($499/mo Founding ($799 Retail))'
      : currentTier === 'starter'
      ? 'Starter ($149/mo Founding ($299 Retail))'
      : 'Free Explorer ($0/mo — Browse Only)'

  return (
    <div className="space-y-8">
      {/* Current Subscription & Usage Command Bar */}
      <div className="bg-slate-900 text-white p-6 md:p-8 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">
                {orgName || 'Organization'} Subscription Plan
              </span>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-extrabold border ${
                  currentTier === 'free'
                    ? 'bg-amber-500/20 text-amber-300 border-slate-300/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-slate-300/30'
                }`}
              >
                {tierDisplayLabel}
              </span>
            </div>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {currentTier === 'free'
                ? 'You are currently on the Free Explorer plan. Once Domain Verified, you can browse the passive talent pool and run AI 5-Point Radar fit previews for free. Upgrade to a monthly plan below to post active blind roles and pitch candidates.'
                : 'Your subscription includes a 2:1 ratio of monthly passive pitch credits to active job slots, plus delegated seats for internal hiring managers or W-2 BPO partners.'}
            </p>
          </div>

          {/* 4 Live Telemetry Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="bg-slate-800/90 px-4 py-3 rounded-xl border border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Active Role Slots
              </span>
              <span className="text-xl font-black text-white">
                {activeJobsCount} <span className="text-slate-400 text-xs font-bold">/ {maxJobs}</span>
              </span>
            </div>

            <div className="bg-slate-800/90 px-4 py-3 rounded-xl border border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Pitch Credits
              </span>
              <span className="text-xl font-black text-indigo-400">
                {credits} <span className="text-slate-400 text-xs font-bold">Avail</span>
              </span>
            </div>

            <div className="bg-slate-800/90 px-4 py-3 rounded-xl border border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Team / BPO Seats
              </span>
              <span className="text-xl font-black text-violet-300">
                {maxSeats} <span className="text-slate-400 text-xs font-bold">{maxSeats === 1 ? 'Seat' : 'Seats'}</span>
              </span>
            </div>

            <div className="bg-slate-800/90 px-4 py-3 rounded-xl border border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Pitches Sent
              </span>
              <span className="text-xl font-black text-emerald-400">{totalSent}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-bold border ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* 3-Column SaaS Subscription Tiers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {SUBSCRIPTION_TIERS.map((tier) => {
          const isCurrentPlan = currentTier === tier.id

          return (
            <div
              key={tier.id}
              className={`bg-white rounded-2xl p-6 md:p-8 flex flex-col justify-between transition-all ${
                tier.popular
                  ? 'border-2 border-indigo-600 shadow-md ring-4 ring-indigo-50 relative'
                  : 'border border-slate-300 shadow-sm hover:border-indigo-300'
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                  Most Popular
                </span>
              )}

              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-xl font-extrabold text-slate-900">{tier.name}</h3>
                  {isCurrentPlan && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
                      ✓ Current Plan
                    </span>
                  )}
                </div>

                <div className="my-4 flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-slate-900">{tier.price}</span>
                  <span className="text-sm font-bold text-slate-500">{tier.interval}</span>
                </div>

                {/* 2:1 Ratio & Team Seat Highlight Pills */}
                <div className="space-y-2 mb-5">
                  <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold">
                    <span>Active Job Postings</span>
                    <span className="text-emerald-400">Up to {tier.maxActiveJobs} Roles</span>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-300 text-xs font-extrabold">
                    <span>Monthly Pitch Credits (2:1)</span>
                    <span className="text-indigo-600">{tier.monthlyCredits} Credits / mo</span>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-violet-50 text-violet-900 border border-violet-300 text-xs font-extrabold">
                    <span>Team & BPO Seats</span>
                    <span className="text-violet-700">
                      {tier.maxSeats} {tier.maxSeats === 1 ? 'Seat' : 'Seats'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mb-5">{tier.description}</p>

                <ul className="space-y-2.5 mb-8 border-t border-slate-300 pt-5">
                  {tier.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs font-semibold text-slate-700">
                      <svg
                        className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                disabled={loadingTierId !== null}
                onClick={() => handleSubscribeCheckout(tier.id)}
                className={`w-full py-3.5 px-4 rounded-xl text-sm font-extrabold transition-colors shadow-sm disabled:opacity-50 ${
                  isCurrentPlan
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : tier.popular
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-slate-900 text-white hover:bg-indigo-600'
                }`}
              >
                {loadingTierId === tier.id
                  ? 'Redirecting to Stripe...'
                  : isCurrentPlan
                  ? `Renew / Add ${tier.monthlyCredits} Credits (${tier.price}/mo)`
                  : `Subscribe to ${tier.name} (${tier.price}/mo)`}
              </button>
            </div>
          )
        })}
      </div>

      {/* Team & BPO Partner Seat Management Callout */}
      <div className="p-6 rounded-2xl bg-white border-2 border-slate-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 border-slate-300">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-violet-100 text-violet-800 text-[10px] font-extrabold uppercase tracking-wider">
              Growth (3 Seats) & Enterprise (10 Seats)
            </span>
            <h4 className="text-base font-extrabold text-slate-900">
              Delegated BPO Partner & Multi-Manager Seat Access
            </h4>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Collaborating with a W-2 BPO delivery partner or multiple technical hiring managers? Assign them a seat on your{' '}
            <strong>Company Profile</strong> so they can screen blind applications and pitch candidates under your verified organization.
          </p>
        </div>
        <Link
          href="/dashboard/employer/organization"
          className="shrink-0 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors shadow-sm text-center"
        >
          Manage Team Seats ({maxSeats} Max) →
        </Link>
      </div>

      {/* Developer Sandbox Tier Switcher */}
      <div className="p-6 rounded-2xl bg-amber-50/80 border border-amber-300 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider">
              Developer Sandbox
            </span>
            <h4 className="text-sm font-extrabold text-amber-950">
              Instant Local Tier Switcher (Test Job Slots, 2:1 Pitch Credits & Seat Caps)
            </h4>
          </div>
          <p className="text-xs text-amber-800">
            Switch between <strong>Free Explorer</strong>, <strong>Starter (1 Seat)</strong>, <strong>Growth (3 Seats)</strong>, and <strong>Enterprise (10 Seats)</strong> below to test seat invitations and role caps immediately.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={sandboxLoadingTier !== null}
            onClick={() => handleSandboxTierSwitch('free')}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-extrabold hover:bg-amber-100 transition-colors shadow-sm disabled:opacity-50"
          >
            {sandboxLoadingTier === 'free' ? 'Setting...' : 'Reset to Free (0 Roles / 1 Seat)'}
          </button>

          <button
            type="button"
            disabled={sandboxLoadingTier !== null}
            onClick={() => handleSandboxTierSwitch('starter')}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-extrabold hover:bg-amber-100 transition-colors shadow-sm disabled:opacity-50"
          >
            {sandboxLoadingTier === 'starter' ? 'Activating...' : '⚡ Starter (5 Roles / 1 Seat)'}
          </button>

          <button
            type="button"
            disabled={sandboxLoadingTier !== null}
            onClick={() => handleSandboxTierSwitch('growth')}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {sandboxLoadingTier === 'growth' ? 'Activating...' : '⚡ Growth (15 Roles / 3 Seats)'}
          </button>

          <button
            type="button"
            disabled={sandboxLoadingTier !== null}
            onClick={() => handleSandboxTierSwitch('enterprise')}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
          >
            {sandboxLoadingTier === 'enterprise' ? 'Activating...' : '⚡ Enterprise (50 Roles / 10 Seats)'}
          </button>
        </div>
      </div>
    </div>
  )
}