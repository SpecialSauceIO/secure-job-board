'use client'
import { trackAdConversion } from '@/components/MarketingPixels'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import VerifyButton from '@/app/dashboard/VerifyButton'
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
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    if (isLocal) {
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
        .select('*')
        .eq('id', user.id)
        .single(),
      resolveCandidateTierInfo(user.id),
    ])

    const hasActivePaidOrTrialTier =
      Boolean(info?.tier) && info.tier !== 'free'
    const verified =
      hasActivePaidOrTrialTier &&
      Boolean(
        profile?.identity_verified === true ||
          String(profile?.identity_verified) === 'true' ||
          profile?.is_verified === true ||
          String(profile?.is_verified) === 'true' ||
            user.user_metadata?.identity_verified === true ||
            String(user.user_metadata?.identity_verified) === 'true' ||
            user.user_metadata?.is_verified === true ||
            String(user.user_metadata?.is_verified) === 'true'
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
    const planParam = params.get('plan') as 'explorer' | 'professional' | 'prestige' | null
    const sessionIdParam = params.get('session_id')
    const selectParam = params.get('select') as 'explorer' | 'professional' | 'prestige' | null
      const messageParam = params.get('message')
    if (
      billingStatus === 'success' &&
      sessionIdParam &&
      (planParam === 'explorer' || planParam === 'professional' || planParam === 'prestige')
    ) {
      window.history.replaceState({}, '', '/dashboard/billing')
      activateSandboxCandidateTier(planParam, sessionIdParam).then((res: any) => {
        if (!res?.error) {
          const priceMap = { explorer: 5, professional: 12, prestige: 19 }
          trackAdConversion('Purchase', {
            value: priceMap[planParam] || 5,
            currency: 'USD',
            plan: `candidate_${planParam}`,
            role: 'candidate',
          })
        }
        if (res?.tierInfo) setTierInfo(res.tierInfo)
        const planTitle =
          planParam === 'prestige'
            ? 'Prestige ($19/mo)'
            : planParam === 'explorer'
            ? 'Explorer ($5 One-Time · $0/mo Forever)'
            : 'Professional ($12/mo)'
        setFeedback({
          type: 'success',
          text: `Payment Confirmed: Your ${planTitle} plan is active. Complete your quick Stripe ID check to go live in Employer Search.`,
        })
        loadCandidateBillingState()
      })
    } else if (billingStatus === 'cancelled') {
      window.history.replaceState({}, '', '/dashboard/billing')
      setFeedback({
        type: 'error',
        text: 'Checkout was cancelled. Your plan was not changed.',
      })
    } else if (messageParam) {
        window.history.replaceState({}, '', '/dashboard/billing')
        setFeedback({
          type: 'error',
          text: messageParam,
        })
      } else if (
        selectParam === 'explorer' ||
      selectParam === 'professional' ||
      selectParam === 'prestige'
    ) {
      window.history.replaceState({}, '', '/dashboard/billing')
      setFeedback({
        type: 'success',
        text:
          selectParam === 'prestige'
            ? 'Welcome to Special Sauce: Activate Prestige ($19/mo) below to unlock ID verification, unlimited applications, and priority placement.'
            : selectParam === 'professional'
            ? 'Welcome to Special Sauce: Activate Professional ($12/mo) below to unlock ID verification and 15 monthly applications.'
            : 'Welcome to Special Sauce: Complete your $5 Explorer Pass below to unlock lifetime ID verification and $0/mo employer invitations forever.',
      })
    }
  }, [loadCandidateBillingState])

  const handleStripeCandidateCheckout = async (
    targetPlan: 'explorer' | 'professional' | 'prestige'
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
        if (String(data.error || '').includes('Permission denied')) {
          await handlePlanSwitch(targetPlan)
          return
        }
        setFeedback({
          type: 'error',
          text: data.error || 'Could not launch Stripe Checkout.',
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setIsProcessing(false)
        return
      }
      if (data.url) {
        window.location.href = data.url
        return
      }
    } catch (err: any) {
      fetch('/api/ops-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error_type: 'CLIENT_CHECKOUT_LAUNCH_ERROR',
          message: (err as any)?.message || 'Checkout launch failed in browser',
          url: typeof window !== 'undefined' ? window.location.pathname : '/onboarding',
        }),
      }).catch(() => {})
      setFeedback({
        type: 'error',
        text: err.message || 'Network error starting Stripe Checkout.',
      })
    }
    setIsProcessing(false)
  }

  const handleOpenCustomerPortal = async () => {
    setIsProcessing(true)
    setFeedback(null)
    try {
      const response = await fetch('/api/billing/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audience: 'candidate' }),
      })
      const data = await response.json()
      if (!response.ok || data.error) {
        setFeedback({
          type: 'error',
          text: data.error || 'Could not open Stripe Billing Portal.',
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
        text: err.message || 'Network error launching Stripe Billing Portal.',
      })
    }
    setIsProcessing(false)
  }

  const handlePlanSwitch = async (
    targetMode: 'explorer' | 'professional' | 'prestige' | 'free'
  ) => {
    setIsProcessing(true)
    setFeedback(null)

    const res = await activateSandboxCandidateTier(targetMode)
    if (res?.error) {
      setFeedback({ type: 'error', text: res.error })
    } else if (res?.tierInfo) {
      setTierInfo(res.tierInfo)
      if (res.tierInfo.tier === 'free') {
        setIsVerified(false)
      }
      setFeedback({
        type: 'success',
        text: res.message || 'Membership plan updated.',
      })
      router.refresh()
    }

    setIsProcessing(false)
  }

  const normalizedTier =
    tierInfo?.tier === 'pro'
      ? 'prestige'
      : tierInfo?.tier === 'trial'
      ? 'professional'
      : tierInfo?.tier || 'free'

  return (
    <div className="max-w-6xl mx-auto py-3 space-y-8">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-300">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Membership &amp; Plan Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Start with Explorer ($5 once, $0/mo forever) for employer invitations, or upgrade anytime to apply to roles directly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {normalizedTier !== 'free' && (
            <button
              type="button"
              onClick={handleOpenCustomerPortal}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl border-2 border-indigo-200 bg-indigo-50/80 text-indigo-950 text-xs font-extrabold hover:bg-indigo-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              Manage Subscription &amp; Invoices ↗
            </button>
          )}
          <Link
            href="/dashboard/profile"
            className="px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-slate-700 text-xs font-extrabold hover:bg-slate-50 transition-colors"
          >
            My Profile
          </Link>
          <Link
            href="/dashboard/jobs"
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors shadow-sm"
          >
            Browse Open Roles →
          </Link>
        </div>
      </header>

      {/* Step 2 Verification Callout for Subscribed Professionals */}
      {!isLoading && normalizedTier !== 'free' && !isVerified && (
        <div className="p-6 rounded-2xl border-2 border-amber-400 bg-amber-50 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-200/80 text-amber-950 text-[11px] font-black uppercase tracking-wider">
              🛡️ Final Step • Quick Photo ID Check
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Complete Your 1-Time Stripe ID Check to Go Live
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 max-w-2xl leading-relaxed">
              Your <strong>{tierInfo?.label}</strong> plan is active! Complete your 60-second photo ID check to earn your Verified Shield, appear in Employer Search, and connect with hiring teams.
            </p>
          </div>
          <div className="shrink-0">
            <VerifyButton />
          </div>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-extrabold border break-words [overflow-wrap:anywhere] ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-300'
              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Plan Cards Container */}
      <div className="rounded-3xl border-2 border-slate-300 bg-gradient-to-b from-amber-50/60 via-white to-white p-4 sm:p-8 shadow-md space-y-8">
        {/* Top Status Banner */}
        <div className="rounded-2xl bg-slate-900 text-white p-4 sm:p-7 border border-slate-300/60 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-wider">
              <span className="text-amber-300">
                🛡️ Verified Professionals • Weekly 1-Year Prestige Drawing
              </span>
              <span className="text-slate-600">•</span>
              {(isVerified || normalizedTier === 'explorer' || normalizedTier === 'professional' || normalizedTier === 'prestige') ? (
                <span className="text-emerald-400">✓ ID Verified</span>
              ) : (
                <Link
                  href="/dashboard"
                  className="text-amber-400 hover:underline"
                >
                  ID Check Pending →
                </Link>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Match Free at $0/mo in Explorer or Upgrade to Apply Outbound
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every verified member is automatically entered into our Weekly Drawing for a free 1-Year Prestige membership. Switch plans or downgrade back to $0/mo Explorer anytime.
            </p>
          </div>

          {/* Live Status Box */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 sm:p-5 shrink-0 w-full lg:w-auto lg:min-w-[260px] space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Current Plan
            </span>
            {isLoading ? (
              <div className="h-6 w-40 bg-slate-700 rounded animate-pulse" />
            ) : (
              <>
                <div className="text-base font-black text-amber-300">
                      {tierInfo?.label && tierInfo.label !== '—'
                        ? tierInfo.label
                        : normalizedTier === 'explorer' || isVerified
                        ? 'Explorer ($0/mo)'
                        : '—'}
                    </div>
                {normalizedTier === 'professional' && (
                  <p className="text-xs text-slate-300">
                    <strong className="text-white">
                      {tierInfo?.freeAppsRemaining} of 15
                    </strong>{' '}
                    monthly applications remaining
                  </p>
                )}
                {normalizedTier === 'prestige' && (
                  <p className="text-xs text-emerald-400 font-bold">
                    ✓ Unlimited Applications &amp; Priority Placement
                  </p>
                )}
                {normalizedTier === 'explorer' && (
                  <p className="text-xs text-emerald-300 font-bold">
                    ✓ Explorer ($0/mo Forever) • Unlimited Invitations
                  </p>
                )}
                {normalizedTier === 'free' && (
                  <p className="text-xs text-slate-300">
                    Select a plan below to unlock ID verification
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* 3 Professional Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Explorer ($5 One-Time · $0/mo Forever) */}
          <div
            className={`bg-white rounded-2xl p-4 sm:p-6 flex flex-col justify-between transition-all ${
              normalizedTier === 'explorer'
                ? 'border-2 border-slate-900 shadow-md'
                : 'border border-slate-300 shadow-xs'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="text-emerald-700 uppercase tracking-wider">
                  🛡️ $0/Mo Forever After ID Check
                </span>
                {normalizedTier === 'explorer' && (
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300">
                    Current Plan
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">Explorer</h3>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-slate-900">$0</span>
                  <span className="text-xs font-bold text-slate-500">/ month forever</span>
                </div>
                <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[11px] font-extrabold text-emerald-800">
                  ✓ $5 One-Time ID Verification
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Get discovered by verified employers and accept unlimited invitations at $0/mo.
                </p>
              </div>

              <ul className="space-y-2.5 pt-4 border-t border-slate-300 text-xs text-slate-700 font-medium">
                <li className="text-emerald-700 font-bold">
                  🛡️ <strong>Includes Real-Person ID Verification</strong> ($5 once)
                </li>
                <li>
                  ✓ <strong>Live Anonymous Profile</strong> in Employer Search
                </li>
                <li>
                  ✓ <strong>Unlimited Employer Invitations</strong> &amp; Private Chat
                </li>
                <li>✓ Free TrueFit Score™ checks &amp; Weekly Drawing entry</li>
                <li className="text-slate-400">
                  ✕ Outbound Applications (Upgrade anytime)
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-300">
              <button
                  type="button"
                  disabled={isProcessing || normalizedTier === 'explorer'}
                  onClick={() =>
                    normalizedTier === 'professional' || normalizedTier === 'prestige' || isVerified
                      ? handlePlanSwitch('explorer')
                      : handleStripeCandidateCheckout('explorer')
                  }
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {normalizedTier === 'explorer'
                    ? '✓ Explorer Plan Active ($0/mo Forever)'
                    : normalizedTier === 'professional' || normalizedTier === 'prestige' || isVerified
                    ? 'Downgrade to Explorer ($0/mo Forever) →'
                    : 'Verify & Start Explorer ($5 One-Time) →'}
                </button>
            </div>
          </div>

          {/* Card 2: Professional ($12/mo) */}
          <div
            className={`bg-white rounded-2xl p-4 sm:p-6 flex flex-col justify-between transition-all ${
              normalizedTier === 'professional'
                ? 'border-2 border-amber-500 shadow-md'
                : 'border border-slate-300 shadow-xs'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="text-amber-700">🛡️ Active Job Seeker</span>
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
                  <span className="text-3xl font-black text-slate-900">$12</span>
                  <span className="text-xs font-bold text-slate-500">
                    / month
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Apply directly to up to 15 roles per month and receive unlimited employer invitations.
                </p>
              </div>

              <ul className="space-y-2.5 pt-4 border-t border-slate-300 text-xs text-slate-700 font-medium">
                <li className="text-emerald-700 font-bold">
                  🛡️ <strong>Includes Real-Person ID Verification</strong> &amp; Shield
                </li>
                <li>
                  ✓ <strong>15 Outbound Protected Applications / mo</strong>
                </li>
                <li>
                  ✓ <strong>Unlimited Employer Invitations</strong> &amp; Private Chat
                </li>
                <li className="text-amber-800 font-bold">
                  ★ <strong>Permanent Founding Member Badge</strong>
                </li>
                <li>✓ Elevated search placement &amp; downgrade to $0/mo Explorer anytime</li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-300">
              <button
                type="button"
                disabled={isProcessing || normalizedTier === 'professional'}
                onClick={() => handleStripeCandidateCheckout('professional')}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {normalizedTier === 'professional'
                    ? `✓ Professional Plan Active (${tierInfo?.freeAppsRemaining ?? 15}/15 Apps Left)`
                    : normalizedTier === 'prestige'
                    ? 'Downgrade to Professional ($12/mo) →'
                    : 'Activate Professional ($12/mo) →'}
              </button>
            </div>
          </div>

          {/* Card 3: Prestige ($19/mo) */}
          <div
            className={`bg-slate-900 text-white rounded-2xl p-4 sm:p-6 flex flex-col justify-between transition-all ${
              normalizedTier === 'prestige'
                ? 'border-2 border-amber-400 shadow-lg'
                : 'border-2 border-indigo-500 shadow-md'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="text-indigo-300">★ Priority &amp; Unlimited</span>
                {normalizedTier === 'prestige' && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-slate-300/30">
                    Current Plan
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xl font-black text-white">Prestige</h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">$19</span>
                  <span className="text-xs font-bold text-slate-300">
                    / month
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Unlimited protected applications and top-priority placement in Employer Search.
                </p>
              </div>

              <ul className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-200 font-medium">
                <li className="text-emerald-300 font-bold">
                  🛡️ <strong>Includes Real-Person ID Verification</strong> &amp; Shield
                </li>
                <li>
                  ✓ <strong>Unlimited Outbound Protected Applications</strong>
                </li>
                <li>
                  ✓ <strong>Unlimited Employer Invitations</strong> &amp; Private Chat
                </li>
                <li className="text-amber-300 font-bold">
                  ★ <strong>Top-Priority Placement in Employer Search</strong>
                </li>
                <li>✓ Priority 1-on-1 US Support &amp; downgrade to Professional ($12/mo) or Explorer ($0/mo) anytime</li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <button
                type="button"
                disabled={isProcessing || normalizedTier === 'prestige'}
                onClick={() => handleStripeCandidateCheckout('prestige')}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {normalizedTier === 'prestige'
                  ? '✓ Prestige Plan Active (Unlimited Apps)'
                  : 'Activate Prestige ($19/mo) →'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QA Stress-Testing Bar */}
      {showQaControls && (
        <div className="bg-slate-100 rounded-2xl border-2 border-slate-300 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
              🧪 QA Controls (Local Only)
            </span>
            <p className="text-xs text-slate-600 mt-0.5">
              Switch between Unsubscribed, Explorer ($0/mo), Professional ($12/mo), and Prestige ($19/mo).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handlePlanSwitch('free')}
              className="px-3 py-2 rounded-xl bg-white border-2 border-slate-300 text-slate-700 text-xs font-extrabold hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
            >
              0. Reset (Unsubscribed)
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handlePlanSwitch('explorer')}
              className="px-3 py-2 rounded-xl bg-white border-2 border-slate-300 text-slate-700 text-xs font-extrabold hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              1. Explorer ($0/mo)
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handlePlanSwitch('professional')}
              className="px-3 py-2 rounded-xl bg-white border-2 border-slate-300 text-slate-700 text-xs font-extrabold hover:bg-amber-50 transition-colors cursor-pointer"
            >
              2. Professional ($12/mo)
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handlePlanSwitch('prestige')}
              className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors cursor-pointer"
            >
              3. Prestige ($19/mo)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
