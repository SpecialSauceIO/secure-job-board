'use client'

import { useState } from 'react'
import Link from 'next/link'
import { activateSandboxEmployerTier } from '@/app/dashboard/actions'

export default function EmployerBillingPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTier, setActiveTier] = useState<string>('starter')
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleTierSwitch = async (
    targetTier: 'free' | 'starter' | 'growth' | 'enterprise'
  ) => {
    setIsProcessing(true)
    setFeedback(null)

    const res = await activateSandboxEmployerTier(targetTier)
    if (res?.error) {
      setFeedback({ type: 'error', text: res.error })
    } else {
      setActiveTier(targetTier)
      setFeedback({
        type: 'success',
        text: res?.message || `Updated plan to ${targetTier}.`,
      })
    }

    setIsProcessing(false)
  }

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold uppercase tracking-wider">
              ★ Season 0 Founding Partner Cohort
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold">
              🔓 Inbound Applicant Unlocks Are 100% Free
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Employer Billing, Role Slots &amp; Pitch Credits
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Reviewing and unlocking candidates who apply to your blind job listings costs 0 credits on every active plan.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/dashboard/employer/organization"
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-extrabold hover:bg-slate-50 transition-colors"
          >
            Company &amp; Team Seats
          </Link>
          <Link
            href="/dashboard/employer/search"
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors shadow-sm"
          >
            Search Talent Pool →
          </Link>
        </div>
      </header>

      {/* Season 0 Founding Partner Grant Hero Banner */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border-2 border-amber-400/80 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400 via-indigo-900 to-slate-900 pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
              ★ 30-Day Season 0 Founding Partner Grant ($99 Value — $0 for 30 Days)
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Verify Your Corporate Domain to Unlock Your 30-Day Founding Starter Grant
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Organizations that verify their corporate domain during our 90-day Season 0 launch window automatically receive{' '}
              <strong className="text-white">30 days of Starter Tier access ($0)</strong> including{' '}
              <strong className="text-amber-300">5 Active Blind Job Slots</strong>,{' '}
              <strong className="text-amber-300">10 Outbound Pitch Credits</strong>,{' '}
              <strong className="text-amber-300">2 Team / BPO Collaborator Seats</strong>, and the permanent{' '}
              <strong className="text-emerald-300">★ Founding Partner Gold Card Trim &amp; 1.25x XP Multiplier</strong> on all your blind job listings.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href="/dashboard/employer/organization"
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-colors shadow-md"
            >
              Verify Domain / Check Grant →
            </Link>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-extrabold border ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Pricing Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tier 1: Starter Tier (Includes 30-Day Season 0 Grant) */}
        <div className="bg-white rounded-2xl border-2 border-amber-300 p-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold">
                ★ Free for 30 Days in Season 0
              </span>
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                Starter Tier
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">$99</span>
                <span className="text-xs font-bold text-slate-500">
                  / month after 30d grant
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Built for small businesses and focused hiring managers filling 1 to 5 roles at a time.
              </p>
            </div>

            <ul className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-700 font-medium">
              <li>
                ✓ <strong>Up to 5 Simultaneous Active Blind Roles</strong>
              </li>
              <li>
                ✓ <strong>+10 Outbound Pitch Credits / month</strong>
              </li>
              <li>
                ✓ <strong>2 Team / BPO Collaborator Seats</strong> (Season 0 Bonus)
              </li>
              <li>✓ <strong>Unlimited Free Inbound Applicant Unlocks</strong></li>
              <li>✓ 5-Point AI Fit Radar &amp; Dealbreaker Firewall</li>
              <li>✓ ★ Permanent Season 0 Founding Partner Badge</li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleTierSwitch('starter')}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isProcessing && activeTier === 'starter'
                ? 'Activating...'
                : 'Activate Starter / Top Up (+10 Credits) →'}
            </button>
          </div>
        </div>

        {/* Tier 2: Growth Tier */}
        <div className="bg-slate-900 text-white rounded-2xl border-2 border-indigo-500 p-6 flex flex-col justify-between shadow-lg">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-extrabold">
                Most Popular for Recruiting Teams
              </span>
            </div>

            <div>
              <h3 className="text-xl font-black text-white">Growth Tier</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">$299</span>
                <span className="text-xs font-bold text-slate-300">
                  / month (Founder Rate Lock)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Designed for growing companies and multi-department hiring teams actively sourcing passive talent.
              </p>
            </div>

            <ul className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-200 font-medium">
              <li>
                ✓ <strong>Up to 15 Simultaneous Active Blind Roles</strong>
              </li>
              <li>
                ✓ <strong>+30 Outbound Pitch Credits / month</strong>
              </li>
              <li>
                ✓ <strong>Up to 3 Team &amp; BPO Partner Seats</strong>
              </li>
              <li>✓ <strong>Unlimited Free Inbound Applicant Unlocks</strong></li>
              <li>✓ Shared Candidate Shortlist &amp; Encrypted Threads</li>
              <li>✓ ★ Permanent Season 0 Founding Partner Badge</li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleTierSwitch('growth')}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isProcessing && activeTier === 'growth'
                ? 'Activating...'
                : 'Activate Growth (+30 Credits & 15 Roles) →'}
            </button>
          </div>
        </div>

        {/* Tier 3: Enterprise & Agency Tier */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold">
                High-Volume &amp; BPO Ready
              </span>
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                Enterprise Tier
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">$899</span>
                <span className="text-xs font-bold text-slate-500">
                  / month (Founder Rate Lock)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Built for high-velocity talent acquisition teams, multi-location enterprises, and W-2/BPO partners.
              </p>
            </div>

            <ul className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-700 font-medium">
              <li>
                ✓ <strong>Up to 50 Simultaneous Active Blind Roles</strong>
              </li>
              <li>
                ✓ <strong>+100 Outbound Pitch Credits / month</strong>
              </li>
              <li>
                ✓ <strong>Up to 10 Team &amp; Delegated BPO Seats</strong>
              </li>
              <li>✓ <strong>Unlimited Free Inbound Applicant Unlocks</strong></li>
              <li>✓ Priority 1.25x Founder&apos;s XP Rank Progression</li>
              <li>✓ ★ Permanent Season 0 Founding Partner Badge</li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleTierSwitch('enterprise')}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isProcessing && activeTier === 'enterprise'
                ? 'Activating...'
                : 'Activate Enterprise (+100 Credits & 50 Roles) →'}
            </button>
          </div>
        </div>
      </div>

      {/* QA Sandbox Controls for Stress Testing */}
      <div className="bg-slate-100 rounded-2xl border border-slate-300 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
            🧪 QA Stress-Testing Controls (Remove Before Public Launch)
          </span>
          <p className="text-xs text-slate-600 mt-0.5">
            Test switching between Free Explorer (0 slots / 0 credits) and paid tiers to verify role-slot and credit guardrails.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleTierSwitch('free')}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-extrabold hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 cursor-pointer disabled:opacity-50"
          >
            Simulate Free Explorer (0 Roles / 0 Credits)
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleTierSwitch('starter')}
            className="px-3.5 py-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold hover:bg-amber-200 cursor-pointer disabled:opacity-50"
          >
            Reset Founding Starter (+10 Credits)
          </button>
        </div>
      </div>
    </div>
  )
}