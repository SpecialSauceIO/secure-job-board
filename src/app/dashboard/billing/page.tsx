'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  resolveCandidateTierInfo,
  activateSandboxCandidateTier,
} from '@/app/dashboard/actions'

export default function CandidateBillingPage() {
  const router = useRouter()
  const [tierInfo, setTierInfo] = useState<{
    tier: 'explorer' | 'professional' | 'prestige' | 'trial' | 'free' | 'pro'
    label: string
    canApply: boolean
    appsUsed: number
    freeAppsRemaining: number
    daysRemaining: number
    trialExpired: boolean
  } | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showQaControls, setShowQaControls] = useState(
    process.env.NODE_ENV === 'development'
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    if (isLocal || params.get('qa') === '1' || params.get('qa') === 'true') {
      setShowQaControls(true)
    }
  }, [])
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const loadCandidateBillingState = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/login')
      return
    }

    const [{ data: profile }, info] = await Promise.all([
      supabase
        .from('profiles')
        .select('identity_verified, is_verified, verification_status')
        .eq('id', user.id)
        .single(),
      resolveCandidateTierInfo(user.id),
    ])

    const verified = Boolean(
      profile?.identity_verified === true ||
        String(profile?.identity_verified) === 'true' ||
        profile?.is_verified === true ||
        String(profile?.is_verified) === 'true' ||
        profile?.verification_status === 'verified' ||
        profile?.verification_status === 'approved'
    )

    setIsVerified(verified)
    setTierInfo(info)
    setIsLoading(false)
  }, [router])

  useEffect(() => {
    loadCandidateBillingState()
  }, [loadCandidateBillingState])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const billingStatus = params.get('billing')
    const planParam = params.get('plan') as 'professional' | 'prestige' | null
    const selectParam = params.get('select') as 'professional' | 'prestige' | null
    if (billingStatus === 'success' && (planParam === 'professional' || planParam === 'prestige')) {
      window.history.replaceState({}, '', '/dashboard/billing')
      activateSandboxCandidateTier(planParam).then((res) => {
        if (res?.tierInfo) setTierInfo(res.tierInfo)
        setFeedback({
          type: 'success',
          text: `Stripe Subscription Confirmed: Your Candidate ${planParam === 'prestige' ? 'Prestige ($15/mo)' : 'Professional ($9/mo)'} plan is now active.`,
        })
        loadCandidateBillingState()
      })
    } else if (billingStatus === 'cancelled') {
      window.history.replaceState({}, '', '/dashboard/billing')
      setFeedback({
        type: 'error',
        text: 'Stripe Checkout was cancelled. Your membership plan was not changed.',
      })
    } else if (selectParam === 'professional' || selectParam === 'prestige') {
      window.history.replaceState({}, '', '/dashboard/billing')
      setFeedback({
        type: 'success',
        text:
          selectParam === 'prestige'
            ? 'Welcome to Special Sauce: Your Explorer Vault is created. Click "Activate Prestige ($15/mo)" below to unlock unlimited blind applications and top-priority search placement.'
            : 'Welcome to Special Sauce: Your Explorer Vault is created. Click "Activate Professional ($9/mo)" below to unlock 15 monthly blind applications and biometric ID verification.',
      })
    }
  }, [loadCandidateBillingState])

  const handleStripeCandidateCheckout = async (
    targetPlan: 'professional' | 'prestige'
  ) => {
    setIsProcessing(true)
    setFeedback(null)
    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId: targetPlan }),
      })
      const data = await response.json()
      if (!response.ok || data.error) {
        setFeedback({
          type: 'error',
          text: data.error || 'Could not launch Stripe Checkout. Use the QA controls below to switch tiers locally.',
        })
        setIsProcessing(false)
        return
      }
      if (data.url) {
        window.location.href = data.url
        return
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Network error starting Stripe Checkout.',
      })
    }
    setIsProcessing(false)
  }

  const handlePlanSwitch = async (
    targetMode: 'explorer' | 'professional' | 'prestige'
  ) => {
    setIsProcessing(true)
    setFeedback(null)

    const res = await activateSandboxCandidateTier(targetMode)
    if (res?.error) {
      setFeedback({ type: 'error', text: res.error })
    } else if (res?.tierInfo) {
      setTierInfo(res.tierInfo)
      setFeedback({
        type: 'success',
        text: res.message || 'Membership plan updated.',
      })
      router.refresh()
    }

    setIsProcessing(false)
  }

  const normalizedTier =
    tierInfo?.tier === 'free'
      ? 'explorer'
      : tierInfo?.tier === 'pro'
      ? 'prestige'
      : tierInfo?.tier === 'trial'
      ? 'professional'
      : tierInfo?.tier || 'explorer'

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-8">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-300">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Candidate Membership &amp; Identity-Verified Access
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Start free on Explorer ($0/forever). Upgrade to Professional ($9/mo) or Prestige ($15/mo) and verify your identity when you&apos;re ready to apply or accept an employer pitch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/dashboard/profile"
            className="px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-slate-700 text-xs font-extrabold hover:bg-slate-50 transition-colors"
          >
            My Anonymous Profile
          </Link>
          <Link
            href="/dashboard/jobs"
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors shadow-sm"
          >
            Browse Open Roles →
          </Link>
        </div>
      </header>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-extrabold border ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-300'
              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Unified Gold Launch Frame Wrapping All 3 Candidate Tiers */}
      <div className="rounded-3xl border-2 border-slate-300 bg-gradient-to-b from-amber-50/60 via-white to-white p-6 sm:p-8 shadow-md space-y-8">
        {/* Top Founding Launch Banner */}
        <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-7 border border-slate-300/60 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-wider">
              <span className="text-amber-300">
                🛡️ Zero-Friction Explorer Vault • Upgrade &amp; Verify When Ready
              </span>
              <span className="text-slate-600">•</span>
              {isVerified ? (
                <span className="text-emerald-400">✓ Biometric Identity Verified</span>
              ) : (
                <Link
                  href="/dashboard"
                  className="text-amber-400 hover:underline"
                >
                  ID Verification Pending (Complete After Upgrading →)
                </Link>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Free Explorer Career Vault + Active Tier &amp; Biometric ID Unlock
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Keep your anonymous profile live in the talent pool and run unlimited 5-Point AI Fit checks on{" "}
              <strong className="text-emerald-300">Explorer for $0 forever</strong>. When you are ready to submit outbound blind applications or unlock an inbound employer pitch, activate{" "}
              <strong className="text-white">Professional ($9/mo)</strong> or{" "}
              <strong className="text-white">Prestige ($15/mo)</strong> and complete your 1-time{" "}
              <strong className="text-amber-300">Biometric ID Verification</strong>.
            </p>
          </div>

          {/* Live Status Box */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shrink-0 min-w-[260px] space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Current Membership Plan
            </span>
            {isLoading ? (
              <div className="h-6 w-40 bg-slate-700 rounded animate-pulse" />
            ) : (
              <>
                <div className="text-base font-black text-amber-300">
                  {tierInfo?.label}
                </div>
                {normalizedTier === 'professional' && (
                  <p className="text-xs text-slate-300">
                    <strong className="text-white">
                      {tierInfo?.freeAppsRemaining} of 15
                    </strong>{" "}
                    monthly blind applications remaining •{" "}
                    <strong className="text-amber-300">Active Tier Unlocked</strong>
                  </p>
                )}
                {normalizedTier === 'prestige' && (
                  <p className="text-xs text-emerald-400 font-bold">
                    ✓ Unlimited Blind Applications + Priority Search Placement Active
                  </p>
                )}
                {normalizedTier === 'explorer' && (
                  <p className="text-xs text-slate-300">
                    Passive Career Vault Active (Upgrade to Professional or Prestige to apply or unlock pitches)
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* 3 Candidate Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Explorer ($0) */}
          <div
            className={`bg-white rounded-2xl p-6 flex flex-col justify-between transition-all ${
              normalizedTier === 'explorer'
                ? 'border-2 border-slate-900 shadow-sm'
                : 'border border-slate-300 shadow-xs'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="text-slate-500 uppercase tracking-wider">
                  Passive Career Vault
                </span>
                {normalizedTier === 'explorer' && (
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300">
                    Current Plan
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">Explorer</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">$0</span>
                  <span className="text-xs font-bold text-slate-500">/ forever</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Keep your anonymous profile live in the talent pool, test 5-Point AI Fit scores, and receive employer pitch alerts.
                </p>
              </div>

              <ul className="space-y-2.5 pt-4 border-t border-slate-300 text-xs text-slate-700 font-medium">
                <li>✓ <strong>Live Anonymous Profile</strong> in Employer Search</li>
                <li>✓ Browse blind role feed &amp; verified pay bands</li>
                <li>✓ Unlimited 5-Point AI Fit Radar checks</li>
                <li>✓ Receive real-time <strong>Inbound Employer Pitch Alerts</strong></li>
                <li className="text-amber-800 font-bold">★ Upgrade &amp; verify ID only when ready to engage</li>
                <li className="text-slate-400">✕ Outbound Blind Applications &amp; Pitch Unlocks (Requires Professional or Prestige)</li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-300">
              <button
                type="button"
                disabled={isProcessing || normalizedTier === 'explorer'}
                onClick={() => handlePlanSwitch('explorer')}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-colors disabled:opacity-60 cursor-pointer"
              >
                {normalizedTier === 'explorer'
                  ? 'Active ($0 Explorer Vault)'
                  : 'Switch to $0 Explorer Vault'}
              </button>
            </div>
          </div>

          {/* Card 2: Professional ($9/mo) */}
          <div
            className={`bg-white rounded-2xl p-6 flex flex-col justify-between transition-all ${
              normalizedTier === 'professional'
                ? 'border-2 border-amber-500 shadow-md'
                : 'border border-slate-300 shadow-xs'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="text-amber-700">🛡️ ID-Verified Active Tier</span>
                {normalizedTier === 'professional' && (
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300">
                    Current Plan
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Professional
                </h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">$9</span>
                  <span className="text-xs font-bold text-slate-500">
                    / month
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  For targeted job seekers ready to verify their identity, unlock inbound employer pitches, and submit up to 15 blind applications per month.
                </p>
              </div>

              <ul className="space-y-2.5 pt-4 border-t border-slate-300 text-xs text-slate-700 font-medium">
                <li className="text-emerald-700 font-bold">
                  🛡️ <strong>Includes Biometric ID Verification</strong> &amp; Verified Shield
                </li>
                <li>
                  ✓ <strong>Unlock &amp; Accept Unlimited Inbound Employer Pitches</strong>
                </li>
                <li>
                  ✓ <strong>15 Outbound Blind Applications / month</strong> (70%+ AI Fit)
                </li>
                <li className="text-amber-800 font-bold">
                  ✓ <strong>Verified Behavioral &amp; Responsiveness Signals</strong>
                </li>
                <li className="text-amber-800 font-bold">
                  ✓ <strong>Permanent Founding Member Status</strong>
                </li>
                <li>✓ Elevated Employer Talent Search indexing</li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-300">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => normalizedTier === 'professional' ? handlePlanSwitch('professional') : handleStripeCandidateCheckout('professional')}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {normalizedTier === 'professional'
                  ? `Active (${tierInfo?.freeAppsRemaining ?? 15}/15 Apps Left) — Reset Quota`
                  : 'Activate Professional ($9/mo) →'}
              </button>
            </div>
          </div>

          {/* Card 3: Prestige ($15/mo) */}
          <div
            className={`bg-slate-900 text-white rounded-2xl p-6 flex flex-col justify-between transition-all ${
              normalizedTier === 'prestige'
                ? 'border-2 border-amber-400 shadow-lg'
                : 'border-2 border-indigo-500 shadow-md'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="text-indigo-300">★ Priority Spotlight &amp; Unlimited</span>
                {normalizedTier === 'prestige' && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-slate-300/30">
                    Current Plan
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xl font-black text-white">Prestige</h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">$15</span>
                  <span className="text-xs font-bold text-slate-300">
                    / month
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Unlimited outbound blind applications, unlimited pitch unlocks, and top-priority placement in Employer Talent Search.
                </p>
              </div>

              <ul className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-200 font-medium">
                <li className="text-emerald-300 font-bold">
                  🛡️ <strong>Includes Biometric ID Verification</strong> &amp; Verified Shield
                </li>
                <li>
                  ✓ <strong>Unlimited Outbound Blind Applications</strong> (70%+ AI Fit)
                </li>
                <li>
                  ✓ <strong>Unlock &amp; Accept Unlimited Inbound Employer Pitches</strong>
                </li>
                <li className="text-amber-300 font-bold">
                  ★ <strong>Top-Priority Placement in Employer Search</strong>
                </li>
                <li className="text-amber-300 font-bold">
                  ✓ <strong>Verified Behavioral &amp; Responsiveness Signals</strong>
                </li>
                <li>✓ Switch or downgrade to Professional or Explorer anytime</li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => normalizedTier === 'prestige' ? handlePlanSwitch('prestige') : handleStripeCandidateCheckout('prestige')}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {normalizedTier === 'prestige'
                  ? '✓ Prestige Plan Active (Unlimited Apps)'
                  : 'Activate Prestige ($15/mo) →'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QA Stress-Testing Bar (Hidden in production unless ?qa=1) */}
      {showQaControls && (
      <div className="bg-slate-100 rounded-2xl border-2 border-slate-300 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
            🧪 QA Stress-Testing Controls (Remove Before Public Launch)
          </span>
          <p className="text-xs text-slate-600 mt-0.5">
            Instant 1-click switching between Explorer ($0), Professional ($9/mo · 15 apps), and Prestige ($15/mo · Unlimited apps).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handlePlanSwitch('explorer')}
            className="px-3 py-2 rounded-xl bg-white border-2 border-slate-300 text-slate-700 text-xs font-extrabold hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
          >
            1. Explorer ($0 · Passive Vault)
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handlePlanSwitch('professional')}
            className="px-3 py-2 rounded-xl bg-white border-2 border-slate-300 text-slate-700 text-xs font-extrabold hover:bg-amber-50 transition-colors cursor-pointer"
          >
            2. Professional ($9/mo · 15 Monthly Blind Apps)
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handlePlanSwitch('prestige')}
            className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors cursor-pointer"
          >
            3. Prestige ($15/mo · Unlimited Blind Apps + Priority Placement)
          </button>
        </div>
      </div>
      )}
    </div>
  )
}
