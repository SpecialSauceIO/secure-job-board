'use client'

import { useState } from 'react'
import { activateSandboxCandidateTier } from '@/app/dashboard/actions'

export default function CandidateBillingClient({
  initialTierInfo,
  isVerified,
  initialBanner,
}: {
  initialTierInfo: {
    tier: 'trial' | 'free' | 'pro'
    label: string
    canApply: boolean
    appsUsed: number
    freeAppsRemaining: number
    daysRemaining: number
    trialExpired: boolean
  }
  isVerified: boolean
  initialBanner?: { type: 'success' | 'error'; text: string } | null
}) {
  const [tierInfo, setTierInfo] = useState(initialTierInfo)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [sandboxLoading, setSandboxLoading] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    initialBanner || null
  )

  const handleSubscribePro = async () => {
    setIsCheckoutLoading(true)
    setFeedback(null)

    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId: 'candidate_pro' }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        setFeedback({
          type: 'error',
          text:
            data.error ||
            'Could not launch Stripe Checkout. Use the Developer Sandbox Switcher below to test Candidate Pro locally.',
        })
        setIsCheckoutLoading(false)
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Network error starting checkout.',
      })
      setIsCheckoutLoading(false)
    }
  }

  const handleSandboxSwitch = async (targetMode: 'trial' | 'expired' | 'pro') => {
    setSandboxLoading(targetMode)
    setFeedback(null)

    const result = await activateSandboxCandidateTier(targetMode)
    if (result?.error) {
      setFeedback({ type: 'error', text: result.error })
    } else if (result?.success && result.tierInfo) {
      setTierInfo(result.tierInfo)
      setFeedback({
        type: 'success',
        text: result.message || 'Candidate membership status updated!',
      })
    }

    setSandboxLoading(null)
  }

  return (
    <div className="space-y-8">
      {/* Live Candidate Plan & Trial Telemetry Banner */}
      <div className="bg-slate-900 text-white p-6 md:p-8 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">
                Candidate Membership Status
              </span>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-extrabold border ${
                  tierInfo.tier === 'pro'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : tierInfo.tier === 'trial'
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                }`}
              >
                {tierInfo.label}
              </span>
            </div>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {tierInfo.tier === 'pro'
                ? 'Your Candidate Pro Pass ($9/mo) is active! You have unlimited blind applications to roles where you score 40%+ on the AI Match Radar, plus priority spotlight placement in Employer searches.'
                : tierInfo.tier === 'trial'
                ? `Your 7-Day Early Adopter Trial is active! You can submit up to 3 free blind applications (${tierInfo.freeAppsRemaining} remaining) within your first ${tierInfo.daysRemaining} days. Responding to incoming Employer Pitches is always 100% free.`
                : 'Your Early Adopter Trial has concluded. You can still browse all open roles, run 5-Point AI Match Radar scores, and accept incoming Employer Pitches for free. Upgrade to Candidate Pro ($9/mo) to submit new blind applications.'}
            </p>
          </div>

          {/* 3 Telemetry Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-slate-800/90 px-4 py-3 rounded-xl border border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Outbound Applications
              </span>
              <span className="text-xl font-black text-white">
                {tierInfo.tier === 'pro'
                  ? 'Unlimited'
                  : `${tierInfo.freeAppsRemaining} / 3 Free Left`}
              </span>
            </div>

            <div className="bg-slate-800/90 px-4 py-3 rounded-xl border border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Trial Window
              </span>
              <span className="text-xl font-black text-indigo-400">
                {tierInfo.tier === 'pro'
                  ? 'Pro Active'
                  : tierInfo.tier === 'trial'
                  ? `${tierInfo.daysRemaining} Days Left`
                  : 'Ended'}
              </span>
            </div>

            <div className="bg-slate-800/90 px-4 py-3 rounded-xl border border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Inbound Pitches
              </span>
              <span className="text-xl font-black text-emerald-400">Always Free</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-bold border ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Side-by-Side Comparison: Early Adopter Trial / Free Explorer vs Candidate Pro ($9/mo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Early Adopter Trial & Free Verified Explorer */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xl font-extrabold text-slate-900">
                Verified Explorer + 7-Day Trial
              </h3>
              {tierInfo.tier !== 'pro' && (
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-extrabold">
                  {tierInfo.tier === 'trial' ? '✓ Active Trial' : 'Current Tier'}
                </span>
              )}
            </div>

            <div className="my-4 flex items-baseline gap-1.5">
              <span className="text-4xl font-black text-slate-900">$0</span>
              <span className="text-sm font-bold text-slate-500">/ forever browse</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Every Identity-Verified candidate starts with a 7-Day Early Adopter Trial (up to 3 free blind applications) and stays discoverable in the passive talent pool forever.
            </p>

            <ul className="space-y-3 mb-8 border-t border-slate-100 pt-5">
              <li className="flex items-start gap-2.5 text-xs font-semibold text-slate-700">
                <span className="text-emerald-500 font-black">✓</span>
                <span>
                  <strong>3 Free Blind Applications</strong> during your first 7 days after Identity Verification
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-xs font-semibold text-slate-700">
                <span className="text-emerald-500 font-black">✓</span>
                <span>
                  <strong>100% Free Forever:</strong> Accept & unlock incoming Employer Connection Pitches
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-xs font-semibold text-slate-700">
                <span className="text-emerald-500 font-black">✓</span>
                <span>
                  Browse all blind job postings & run 5-Point AI Match Radar previews
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-xs font-semibold text-slate-700">
                <span className="text-emerald-500 font-black">✓</span>
                <span>
                  Remain discoverable in Employer Passive Candidate Searches
                </span>
              </li>
            </ul>
          </div>

          <div className="py-3 px-4 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold text-center">
            {tierInfo.tier === 'trial'
              ? `Trial Active: ${tierInfo.freeAppsRemaining} of 3 Free Applications & ${tierInfo.daysRemaining} Days Left`
              : tierInfo.tier === 'free'
              ? 'Trial Concluded — Browse & Inbound Pitch Mode Active'
              : 'Included with your account'}
          </div>
        </div>

        {/* Card 2: Candidate Pro Pass ($9/month) */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-indigo-600 shadow-md ring-4 ring-indigo-50 relative flex flex-col justify-between">
          <span className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
            Full Access Pass
          </span>

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xl font-extrabold text-slate-900">Candidate Pro Pass</h3>
              {tierInfo.tier === 'pro' && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
                  ✓ Active Subscription
                </span>
              )}
            </div>

            <div className="my-4 flex items-baseline gap-1.5">
              <span className="text-4xl font-black text-slate-900">$9</span>
              <span className="text-sm font-bold text-slate-500">/ month</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Simple monthly membership for active job seekers who want unlimited blind applications and priority visibility to hiring managers.
            </p>

            <ul className="space-y-3 mb-8 border-t border-slate-100 pt-5">
              <li className="flex items-start gap-2.5 text-xs font-semibold text-slate-700">
                <span className="text-emerald-500 font-black">✓</span>
                <span>
                  <strong>Unlimited Blind Job Applications</strong> to all roles where you meet the 40%+ AI Match threshold
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-xs font-semibold text-slate-700">
                <span className="text-emerald-500 font-black">✓</span>
                <span>
                  <strong>Priority Spotlight Badge</strong> in Employer Passive Candidate Search results
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-xs font-semibold text-slate-700">
                <span className="text-emerald-500 font-black">✓</span>
                <span>
                  Unlimited AI Resume Re-Parsing & 5-Point Radar Fit Recalculations
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-xs font-semibold text-slate-700">
                <span className="text-emerald-500 font-black">✓</span>
                <span>
                  Cancel anytime in 1 click — no long-term lock-in or quarterly bundles
                </span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            disabled={isCheckoutLoading || tierInfo.tier === 'pro'}
            onClick={handleSubscribePro}
            className={`w-full py-3.5 px-4 rounded-xl text-sm font-extrabold transition-colors shadow-sm disabled:opacity-60 ${
              tierInfo.tier === 'pro'
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isCheckoutLoading
              ? 'Redirecting to Stripe...'
              : tierInfo.tier === 'pro'
              ? '✓ Candidate Pro Pass Active ($9/mo)'
              : 'Subscribe to Candidate Pro ($9/month)'}
          </button>
        </div>
      </div>

      {/* Developer Sandbox Switcher (Test 7-Day Trial vs Expired Trial vs Candidate Pro) */}
      <div className="p-6 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider">
              Developer Sandbox
            </span>
            <h4 className="text-sm font-extrabold text-amber-950">
              Instant Candidate Trial & Pro State Switcher
            </h4>
          </div>
          <p className="text-xs text-amber-800">
            Test how the job board behaves during a fresh <strong>7-Day Early Adopter Trial</strong>, after the trial expires (<strong>Free Explorer Browse-Only</strong>), or with an active <strong>$9/mo Candidate Pro Pass</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={sandboxLoading !== null}
            onClick={() => handleSandboxSwitch('trial')}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-extrabold hover:bg-amber-100 transition-colors shadow-sm disabled:opacity-50"
          >
            {sandboxLoading === 'trial' ? 'Resetting...' : 'Reset 7-Day Trial (3 Free Apps)'}
          </button>

          <button
            type="button"
            disabled={sandboxLoading !== null}
            onClick={() => handleSandboxSwitch('expired')}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-rose-300 text-rose-800 text-xs font-extrabold hover:bg-rose-50 transition-colors shadow-sm disabled:opacity-50"
          >
            {sandboxLoading === 'expired' ? 'Simulating...' : 'Simulate Trial Ended (Browse Only)'}
          </button>

          <button
            type="button"
            disabled={sandboxLoading !== null}
            onClick={() => handleSandboxSwitch('pro')}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {sandboxLoading === 'pro' ? 'Activating...' : '⚡ Activate Candidate Pro ($9/mo)'}
          </button>
        </div>
      </div>
    </div>
  )
}