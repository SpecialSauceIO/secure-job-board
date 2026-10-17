'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  resolveCandidateTierInfo,
  activateSandboxCandidateTier,
} from '@/app/dashboard/actions'

export default function CandidateBillingPage() {
  const [tierInfo, setTierInfo] = useState<{
    tier: 'trial' | 'free' | 'pro'
    label: string
    canApply: boolean
    appsUsed: number
    freeAppsRemaining: number
    daysRemaining: number
    trialExpired: boolean
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    let mounted = true
    resolveCandidateTierInfo().then((info) => {
      if (mounted) {
        setTierInfo(info)
        setIsLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const handleSandboxSwitch = async (targetMode: 'trial' | 'expired' | 'pro') => {
    setIsProcessing(true)
    setFeedback(null)

    const res = await activateSandboxCandidateTier(targetMode)
    if (res?.error) {
      setFeedback({ type: 'error', text: res.error })
    } else if (res?.tierInfo) {
      setTierInfo(res.tierInfo)
      setFeedback({
        type: 'success',
        text: res.message || 'Membership state updated.',
      })
    }

    setIsProcessing(false)
  }

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold uppercase tracking-wider">
              ★ Season 0 Founding Cohort Active
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-extrabold">
              ⚡ 1.25x Founder&apos;s XP Boost Locked
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Candidate Membership &amp; Season 0 Charter
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Building your anonymous vault and receiving inbound employer pitches is 100% free forever.
          </p>
        </div>

        <Link
          href="/dashboard/jobs"
          className="shrink-0 inline-flex items-center px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors shadow-sm"
        >
          Browse Open Roles →
        </Link>
      </header>

      {/* Season 0 Founding Member Grant Banner */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border-2 border-amber-400/80 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400 via-indigo-900 to-slate-900 pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
              ★ Season 0: Founding Era Charter Grant
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Your 30-Day Founding Member Grant &amp; Permanent Perks
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Because you joined during our initial 90-day Season 0 launch window, your account automatically receives{' '}
              <strong className="text-white">30 days of outbound access (15 free blind applications)</strong>, a permanent{' '}
              <strong className="text-amber-300">★ Founding Member Gold Card Trim</strong>, a permanent{' '}
              <strong className="text-amber-300">1.25x Profile XP Multiplier</strong>, and a lifetime{' '}
              <strong className="text-emerald-300">$9/mo Founder&apos;s Rate Lock</strong> (protected against future price increases).
            </p>
          </div>

          {/* Live Status Box */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shrink-0 min-w-[260px] space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Current Membership Status
            </span>
            {isLoading ? (
              <div className="h-6 w-40 bg-slate-700 rounded animate-pulse" />
            ) : (
              <>
                <div className="text-base font-black text-amber-300">
                  {tierInfo?.label}
                </div>
                {tierInfo?.tier === 'trial' && (
                  <p className="text-xs text-slate-300">
                    <strong className="text-white">
                      {tierInfo.freeAppsRemaining} of 15
                    </strong>{' '}
                    free blind applications remaining •{' '}
                    <strong className="text-white">
                      {tierInfo.daysRemaining} days
                    </strong>{' '}
                    left in grant window
                  </p>
                )}
                {tierInfo?.tier === 'pro' && (
                  <p className="text-xs text-emerald-300 font-semibold">
                    ✓ Unlimited Blind Applications Active
                  </p>
                )}
                {tierInfo?.tier === 'free' && (
                  <p className="text-xs text-amber-200">
                    Passive Vault Active (Inbound pitches remain 100% free)
                  </p>
                )}
              </>
            )}
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

      {/* Tier Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Passive Vault Mode ($0 Forever) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-extrabold">
                Always Free
              </span>
              {tierInfo?.tier === 'free' && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-bold">
                  Current Mode
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                Passive Career Vault
              </h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">$0</span>
                <span className="text-xs font-bold text-slate-500">
                  / forever
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Ideal when you are happily employed. Keep your anonymous profile live in the talent pool and let verified employers pitch you.
              </p>
            </div>

            <ul className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-700 font-medium">
              <li>✓ 2-Stage Identity &amp; PDF Resume Vault</li>
              <li>✓ Receive &amp; accept inbound employer pitches for free</li>
              <li>✓ Unlimited 5-Point AI Fit Radar checks</li>
              <li>✓ Keep your ★ Season 0 Badge &amp; Metal Rank forever</li>
              <li className="text-slate-400">
                • Outbound blind applications paused after 30-day grant
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <span className="block w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-600 text-xs font-extrabold text-center">
              Included Automatically Forever
            </span>
          </div>
        </div>

        {/* Card 2: 30-Day Season 0 Founding Grant */}
        <div className="bg-white rounded-2xl border-2 border-amber-300 p-6 flex flex-col justify-between shadow-sm relative">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold">
                ★ Season 0 Launch Grant
              </span>
              {tierInfo?.tier === 'trial' && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                  Active Now
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                30-Day Founding Pass
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-600">$0</span>
                <span className="text-sm font-bold text-slate-400 line-through">
                  $9/mo
                </span>
                <span className="text-xs font-bold text-slate-500">
                  for 30 days
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Automatically granted once you complete Stripe Identity verification during our 90-day Season 0 launch window.
              </p>
            </div>

            <ul className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-700 font-medium">
              <li>
                ✓ <strong>15 Free Outbound Blind Applications</strong> (40%+ AI Fit)
              </li>
              <li>✓ Full 30-Day Window (aligned with 30-day job freshness)</li>
              <li>✓ Permanent ★ Founding Member Gold Card Trim</li>
              <li>✓ Permanent 1.25x Profile XP Multiplier</li>
              <li>✓ No credit card required upfront</li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <span className="block w-full py-2.5 px-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-extrabold text-center">
              {tierInfo?.tier === 'trial'
                ? `Active (${tierInfo.freeAppsRemaining}/15 Apps · ${tierInfo.daysRemaining}d left)`
                : 'Granted Automatically at Signup'}
            </span>
          </div>
        </div>

        {/* Card 3: Candidate Pro Pass ($9/mo Founder's Rate Lock) */}
        <div className="bg-slate-900 text-white rounded-2xl border-2 border-indigo-500 p-6 flex flex-col justify-between shadow-lg">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-extrabold">
                🔒 Founder&apos;s Rate Lock
              </span>
              {tierInfo?.tier === 'pro' && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[11px] font-black">
                  ✓ Subscribed
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl font-black text-white">
                Candidate Pro Pass
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">$9</span>
                <span className="text-sm font-bold text-slate-400 line-through">
                  $15
                </span>
                <span className="text-xs font-bold text-slate-300">
                  / month (Founder Rate)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Continue submitting unlimited high-precision blind applications after your 30-day Founding Grant concludes.
              </p>
            </div>

            <ul className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-200 font-medium">
              <li>
                ✓ <strong>Unlimited Blind Applications</strong> (40%+ AI Match Firewall)
              </li>
              <li>✓ Priority placement in Employer Talent Searches</li>
              <li>✓ +150 Profile XP per qualified blind application</li>
              <li>✓ Pause anytime to return to $0 Passive Vault mode</li>
              <li>✓ Grandfathered $9/mo Founder&apos;s Rate forever</li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={isProcessing || tierInfo?.tier === 'pro'}
              onClick={() => handleSandboxSwitch('pro')}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {tierInfo?.tier === 'pro'
                ? '✓ Candidate Pro Pass Active'
                : 'Activate Candidate Pro ($9/mo) →'}
            </button>
          </div>
        </div>
      </div>

      {/* Developer / QA Sandbox Switcher (For Stress Testing) */}
      <div className="bg-slate-100 rounded-2xl border border-slate-300 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
            🧪 QA Stress-Testing Controls (Remove Before Public Launch)
          </span>
          <p className="text-xs text-slate-600 mt-0.5">
            Simulate different Candidate membership states to test the 30-Day Founding Grant, Expired Paywall, and Pro Pass.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleSandboxSwitch('trial')}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-extrabold hover:bg-slate-50 cursor-pointer disabled:opacity-50"
          >
            Reset 30d Founding Grant (15 Apps)
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleSandboxSwitch('expired')}
            className="px-3.5 py-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold hover:bg-amber-200 cursor-pointer disabled:opacity-50"
          >
            Simulate Grant Expired
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleSandboxSwitch('pro')}
            className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 cursor-pointer disabled:opacity-50"
          >
            Simulate Pro ($9/mo)
          </button>
        </div>
      </div>
    </div>
  )
}