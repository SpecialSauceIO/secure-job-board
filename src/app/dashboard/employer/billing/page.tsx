'use client'
import { trackAdConversion } from '@/components/MarketingPixels'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  activateSandboxEmployerTier,
  purchaseEmployerCreditTopUp,
  resolveEmployerTierInfo,
} from '@/app/dashboard/actions'

export default function EmployerBillingPage() {
  const router = useRouter()
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
    if (isLocal) {
      setShowQaControls(true)
    }
  }, [])
  const [processingTarget, setProcessingTarget] = useState<string | null>(null)

  const [orgData, setOrgData] = useState<any>(null)
  const [isOrgVerified, setIsOrgVerified] = useState(false)
  const [activeTier, setActiveTier] = useState<string>('starter')
  const [tierLabel, setTierLabel] = useState<string>('Starter Tier')
  const [maxActiveJobs, setMaxActiveJobs] = useState<number>(5)
  const [maxSeats, setMaxSeats] = useState<number>(2)
  const [activeJobsCount, setActiveJobsCount] = useState<number>(0)
  const [credits, setCredits] = useState<number>(0)
  const [planCredits, setPlanCredits] = useState<number>(0)
  const [rolloverCredits, setRolloverCredits] = useState<number>(0)

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const loadBillingState = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/login')
      return
    }

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (member?.organization_id) {
      const { data: fetchedOrg } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', member.organization_id)
        .single()

      if (fetchedOrg) {
        setOrgData(fetchedOrg)
        setIsOrgVerified(fetchedOrg.verification_status === 'verified')
        setCredits(fetchedOrg.connection_credits ?? 0)

        const resolved = await resolveEmployerTierInfo(fetchedOrg)
        setActiveTier(resolved.tier)
        setTierLabel(resolved.label)
        setMaxActiveJobs(resolved.maxActiveJobs)
        setMaxSeats(resolved.maxSeats)
        setPlanCredits(resolved.planCreditsRemaining)
        setRolloverCredits(resolved.rolloverCreditsRemaining)
      }

      const { data: orgJobs } = await supabase
        .from('jobs')
        .select('id, is_active')
        .eq('organization_id', member.organization_id)

      const activeCount = (orgJobs || []).filter(
        (j: any) => j.is_active !== false
      ).length
      setActiveJobsCount(activeCount)
    }

    setIsLoading(false)
  }, [router])

  useEffect(() => {
    loadBillingState()
  }, [loadBillingState])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const billingStatus = params.get('billing')
    const tierParam = params.get('tier') as 'starter' | 'growth' | 'enterprise' | null
    const packParam = params.get('pack') as 'boost' | 'surge' | 'scale' | null
    const sessionIdParam = params.get('session_id')
    const selectParam = params.get('select') as 'starter' | 'growth' | 'enterprise' | null

    if (billingStatus === 'success' && sessionIdParam && tierParam && ['starter', 'growth', 'enterprise'].includes(tierParam)) {
      window.history.replaceState({}, '', '/dashboard/employer/billing')
      activateSandboxEmployerTier(tierParam, sessionIdParam).then((res) => {
        if (res?.error) {
          setFeedback({ type: 'error', text: res.error })
        } else {
          const tierPriceMap = { starter: 149, growth: 499, enterprise: 1250 }
          trackAdConversion('Purchase', {
            value: tierPriceMap[tierParam] || 149,
            currency: 'USD',
            plan: `employer_${tierParam}`,
            role: 'employer',
          })
          setFeedback({
            type: 'success',
            text: res?.message || `Stripe Subscription Confirmed: Activated ${tierParam.toUpperCase()} plan.`,
          })
        }
        loadBillingState()
      })
    } else if (billingStatus === 'topup_success' && sessionIdParam && packParam && ['boost', 'surge', 'scale'].includes(packParam)) {
      window.history.replaceState({}, '', '/dashboard/employer/billing')
      purchaseEmployerCreditTopUp(packParam, sessionIdParam).then((res) => {
        setFeedback({
          type: 'success',
          text: res?.message || 'Stripe Payment Confirmed: Added non-expiring Rollover Pitch Credits to your organization.',
        })
        loadBillingState()
      })
    } else if (billingStatus === 'cancelled') {
      window.history.replaceState({}, '', '/dashboard/employer/billing')
      setFeedback({
        type: 'error',
        text: 'Stripe Checkout was cancelled. No billing changes were made.',
      })
    } else if (selectParam && ['starter', 'growth', 'enterprise'].includes(selectParam)) {
      window.history.replaceState({}, '', '/dashboard/employer/billing')
      const planNames: Record<string, string> = {
        starter: 'Starter ($149/mo Founding Rate — 5 Active Roles & 10 Pitch Credits)',
        growth: 'Growth ($499/mo Founding Rate — 15 Active Roles & 35 Pitch Credits)',
        enterprise: 'Enterprise ($1,250/mo Founding Rate — Unlimited Roles, 120 Credits & HR Software Sync)',
      }
      setFeedback({
        type: 'success',
        text: `Welcome to Special Sauce: Complete your Company Profile if needed, then click "${planNames[selectParam]}" below to lock in your 12-Month Founding Partner Rate.`,
      })
    }
  }, [loadBillingState])

  const handleStripeEmployerCheckout = async (
    targetId: 'starter' | 'growth' | 'enterprise' | 'boost' | 'surge' | 'scale',
    isTopUp = false
  ) => {
    setIsProcessing(true)
    setProcessingTarget(isTopUp ? `topup_${targetId}` : targetId)
    setFeedback(null)
    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isTopUp ? { packId: `topup_${targetId}` } : { tierId: targetId }
        ),
      })
      const data = await response.json()
      if (!response.ok || data.error) { if (!isTopUp && (targetId === "starter" || targetId === "growth" || targetId === "enterprise") && String(data.error || "").includes("Permission denied")) { await handleTierSwitch(targetId); return; } setFeedback({ type: "error", text: data.error || "Could not launch Stripe Checkout." }); window.scrollTo({ top: 0, behavior: "smooth" }); setIsProcessing(false); setProcessingTarget(null); return; }
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
    setProcessingTarget(null)
  }

  const handleTierSwitch = async (
    targetTier: 'free' | 'starter' | 'growth' | 'enterprise'
  ) => {
    setIsProcessing(true)
    setProcessingTarget(targetTier)
    setFeedback(null)

    const res = await activateSandboxEmployerTier(targetTier)
    if (res?.error) {
      setFeedback({ type: 'error', text: res.error })
    } else {
      setActiveTier(targetTier)
      setFeedback({
        type: 'success',
        text:
          res?.message ||
          `✓ Switched organization plan to ${targetTier.toUpperCase()}.`,
      })
      await loadBillingState()
      router.refresh()
    }

    setIsProcessing(false)
    setProcessingTarget(null)
  }

  const handleTopUpPurchase = async (packId: 'boost' | 'surge' | 'scale') => {
    setIsProcessing(true)
    setProcessingTarget(`topup_${packId}`)
    setFeedback(null)

    const res = await purchaseEmployerCreditTopUp(packId)
    if (res?.error) {
      setFeedback({ type: 'error', text: res.error })
    } else {
      setFeedback({
        type: 'success',
        text:
          res?.message ||
          '✓ Added non-expiring Rollover Pitch Credits to your organization!',
      })
      await loadBillingState()
      router.refresh()
    }

    setIsProcessing(false)
    setProcessingTarget(null)
  }

  const handleOpenEmployerPortal = async () => {
    setIsProcessing(true)
    setProcessingTarget('portal')
    setFeedback(null)
    try {
      const response = await fetch('/api/billing/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audience: 'employer' }),
      })
      const data = await response.json()
      if (!response.ok || data.error) {
        setFeedback({
          type: 'error',
          text: data.error || 'Could not open Stripe Billing Portal.',
        })
        setIsProcessing(false)
        setProcessingTarget(null)
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
    setProcessingTarget(null)
  }

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-8">
      {/* Clean Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-300">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Employer Billing, Role Slots &amp; Pitch Credits
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Reviewing and unlocking candidates who apply to your protected job listings is 100% free (0 credits) on every active plan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleOpenEmployerPortal}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl border-2 border-indigo-200 bg-indigo-50/80 text-indigo-950 text-xs font-extrabold hover:bg-indigo-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            {processingTarget === 'portal' ? 'Opening Stripe...' : 'Invoices & Payment Portal ↗'}
          </button>
          <Link
            href="/dashboard/employer/organization"
            className="px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-slate-700 text-xs font-extrabold hover:bg-slate-50 transition-colors"
          >
            Company, Team Seats &amp; HR Sync
          </Link>
          <Link
            href="/dashboard/employer/search"
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors shadow-sm"
          >
            Search Talent Pool →
          </Link>
        </div>
      </header>

      {/* Dynamic Founding Partner Status & Live Two-Bucket Plan Summary Banner */}
      {isLoading ? (
        <div className="rounded-2xl bg-white border-2 border-slate-300 p-5 sm:p-8 text-center shadow-xs">
          <div className="inline-block w-6 h-6 border-3 border-slate-300 border-t-indigo-600 rounded-full animate-spin mb-2" />
          <p className="text-xs font-bold text-slate-500">
            Syncing organization verification &amp; two-bucket credit ledger...
          </p>
        </div>
      ) : isOrgVerified ? (
        <div className="rounded-2xl bg-slate-900 text-white p-4 sm:p-8 border-2 border-slate-300 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-wider">
                <span className="text-amber-300">
                  ★ Founding Partner Charter Active
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400">
                  ✓ {orgData?.domain || 'Corporate Domain'} Verified
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Current Plan: {tierLabel}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Your monthly plan allowance (<strong className="text-white">Bucket 1</strong>) is always spent first when pitching candidates. Purchased Top-Up Credits (<strong className="text-amber-300">Bucket 2</strong>) roll over indefinitely while your base subscription remains active.
              </p>
            </div>

            {/* Live Two-Bucket Account Balances */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0 bg-slate-800/90 border border-slate-700 rounded-2xl p-4 text-center">
              <div className="px-2">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Active Roles
                </span>
                <span className="text-lg font-black text-white mt-0.5 block">
                  {maxActiveJobs >= 500 ? `${activeJobsCount} Active` : `${activeJobsCount} / ${maxActiveJobs}`}
                </span>
              </div>
              <div className="px-2 sm:border-l border-slate-700">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Plan Credits (1st)
                </span>
                <span className="text-lg font-black text-white mt-0.5 block">
                  {planCredits}
                </span>
              </div>
              <div className="px-2 border-t sm:border-t-0 sm:border-l border-slate-700 pt-2 sm:pt-0">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                  Rollover Top-Ups
                </span>
                <span className="text-lg font-black text-amber-300 mt-0.5 block">
                  {rolloverCredits}
                </span>
              </div>
              <div className="px-2 border-t sm:border-t-0 sm:border-l border-slate-700 pt-2 sm:pt-0">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                  Total Available
                </span>
                <span className="text-lg font-black text-emerald-400 mt-0.5 block">
                  {credits}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900 text-white p-4 sm:p-8 border-2 border-slate-300 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                ★ 12-Month Employer Founding Partner Rate Lock (Up to 50% Off Retail)
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Verify Your Corporate Domain to Lock In 12-Month Founding Partner Rates
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Organizations that verify their corporate domain during our Founding Member Launch automatically receive{' '}
                <strong className="text-white">
                  12-Month Founding Partner Pricing ($149 / $499 / $1,250 per month)
                </strong>{' '}
                including{' '}
                <strong className="text-amber-300">
                  5 Active Protected Job Slots
                </strong>
                ,{' '}
                <strong className="text-amber-300">
                  10 Outbound Pitch Credits
                </strong>
                ,{' '}
                <strong className="text-amber-300">
                  2 Team or Recruiter Seats
                </strong>
                , and{' '}
                <strong className="text-emerald-300">
                  ✓ Permanent Founding Partner Status &amp; Distinctions
                </strong>
                .
              </p>
            </div>

            <div className="shrink-0">
              <Link
                href="/dashboard/employer/organization"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-colors shadow-md"
              >
                Verify Corporate Domain →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-extrabold border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-300'
              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
          }`}
        >
          <span>{feedback.text}</span>
          {feedback?.type === 'success' && activeTier === 'enterprise' && (
            <Link
              href="/dashboard/employer/organization"
              className="shrink-0 px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-extrabold hover:bg-emerald-800 transition-colors"
            >
              Open HR Software Sync Hub →
            </Link>
          )}
        </div>
      )}

      {/* Pricing Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tier 1: Starter Tier */}
        <div
          className={`bg-white rounded-2xl p-4 sm:p-6 flex flex-col justify-between transition-all ${
            activeTier === 'starter'
              ? 'border-2 border-indigo-600 shadow-sm'
              : 'border-2 border-slate-300 shadow-xs'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="text-amber-700">
                ★ 12-Month Founding Partner Rate Lock
              </span>
              {activeTier === 'starter' && (
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300">
                  Current Plan
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                Starter Tier
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-base font-bold text-slate-400 line-through">$299</span>
                <span className="text-3xl font-black text-slate-900">$149</span>
                <span className="text-xs font-bold text-amber-700">
                  / mo Founding Rate (Locked 12 Mos)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Built for small businesses and focused hiring managers filling 1 to 5 roles at a time.
              </p>
            </div>

            <ul className="space-y-2.5 pt-4 border-t border-slate-300 text-xs text-slate-700 font-medium">
              <li>
                ★ <strong className="text-amber-800">$149/mo Locked for First 12 Months</strong> ($299/mo retail after)
              </li>
              <li>
                ✓ <strong>Up to 5 Simultaneous Active Protected Roles</strong>
              </li>
              <li>
                ✓ <strong>10 Monthly Plan Pitch Credits / month</strong>
              </li>
              <li className="text-emerald-700 font-bold">
                🛡️ <strong>100% Accepted-Only Pitch Credit Protection</strong> (Declined pitches auto-refunded)
              </li>
              <li>
                ✓ <strong>2 Team or Recruiter Seats</strong>
              </li>
              <li>
                ✓ <strong>Unlimited Free Inbound Applicant Unlocks</strong>
              </li>
              <li>✓ Eligible for Non-Expiring Rollover Top-Up Packs</li>
              <li>✓ Permanent Founding Partner Status &amp; Distinctions</li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-300">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleStripeEmployerCheckout('starter')}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {processingTarget === 'starter'
                ? 'Activating Starter...'
                : activeTier === 'starter'
                ? 'Reset Monthly Plan Bucket (10 Plan Credits) →'
                : 'Switch to Starter (10 Plan Credits / mo) →'}
            </button>
          </div>
        </div>

        {/* Tier 2: Growth Tier */}
        <div
          className={`bg-slate-900 text-white rounded-2xl p-4 sm:p-6 flex flex-col justify-between transition-all ${
            activeTier === 'growth'
              ? 'border-2 border-amber-400 shadow-lg'
              : 'border-2 border-indigo-500 shadow-md'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="text-indigo-300">
                Most Popular for Recruiting Teams
              </span>
              {activeTier === 'growth' && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  Current Plan
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl font-black text-white">Growth Tier</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-base font-bold text-slate-400 line-through">$799</span>
                <span className="text-3xl font-black text-white">$499</span>
                <span className="text-xs font-bold text-amber-300">
                  / mo Founding Rate (Locked 12 Mos)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Designed for growing companies and multi-department hiring teams actively sourcing passive talent.
              </p>
            </div>

            <ul className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-200 font-medium">
              <li>
                ★ <strong className="text-amber-300">$499/mo Locked for First 12 Months</strong> ($799/mo retail after)
              </li>
              <li>
                ✓ <strong>Up to 15 Simultaneous Active Protected Roles</strong>
              </li>
              <li>
                ✓ <strong>35 Monthly Plan Pitch Credits / month</strong>
              </li>
              <li className="text-emerald-300 font-bold">
                🛡️ <strong>100% Accepted-Only Pitch Credit Protection</strong> (Declined pitches auto-refunded)
              </li>
              <li>
                ✓ <strong>Up to 5 Team &amp; External Recruiter Seats</strong>
              </li>
              <li>
                ✓ <strong>Unlimited Free Inbound Applicant Unlocks</strong>
              </li>
              <li>✓ Eligible for Non-Expiring Rollover Top-Up Packs</li>
              <li>✓ Permanent Founding Partner Status &amp; Distinctions</li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleStripeEmployerCheckout('growth')}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {processingTarget === 'growth'
                ? 'Activating Growth...'
                : activeTier === 'growth'
                ? 'Reset Monthly Plan Bucket (35 Plan Credits) →'
                : 'Switch to Growth (35 Plan Credits & 15 Roles) →'}
            </button>
          </div>
        </div>

        {/* Tier 3: Enterprise & Agency Tier */}
        <div
          className={`bg-white rounded-2xl p-4 sm:p-6 flex flex-col justify-between transition-all ${
            activeTier === 'enterprise'
              ? 'border-2 border-indigo-600 shadow-sm'
              : 'border-2 border-slate-300 shadow-xs'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="text-emerald-700">
                High-Volume, HR Software &amp; Recruiter Ready
              </span>
              {activeTier === 'enterprise' && (
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300">
                  Current Plan
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                Enterprise Tier
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-base font-bold text-slate-400 line-through">$1,999</span>
                <span className="text-3xl font-black text-slate-900">$1,250</span>
                <span className="text-xs font-bold text-amber-700">
                  / mo Founding Rate (Locked 12 Mos)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Built for high-velocity talent acquisition teams, multi-location enterprises, and external recruiting partners.
              </p>
            </div>

            <ul className="space-y-2.5 pt-4 border-t border-slate-300 text-xs text-slate-700 font-medium">
              <li>
                ★ <strong className="text-amber-800">$1,250/mo Locked for First 12 Months</strong> ($1,999/mo retail after)
              </li>
              <li>
                ✓ <strong>Unlimited Simultaneous Active Protected Roles</strong>
              </li>
              <li>
                ✓ <strong>120 Monthly Plan Pitch Credits / month</strong>
              </li>
              <li className="text-emerald-700 font-bold">
                🛡️ <strong>100% Accepted-Only Pitch Credit Protection</strong> (Declined pitches auto-refunded)
              </li>
              <li>
                ✓ <strong>Unlimited Team &amp; External Recruiter Seats</strong>
              </li>
              <li>
                ✓ <strong>Workday &amp; Greenhouse HR Software Sync</strong>
              </li>
              <li>
                ✓ <strong>Automated Stage 2 Vault Export to ATS</strong>
              </li>
              <li>✓ Eligible for Non-Expiring Rollover Top-Up Packs</li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-300">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleStripeEmployerCheckout('enterprise')}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {processingTarget === 'enterprise'
                ? 'Activating Enterprise...'
                : activeTier === 'enterprise'
                ? 'Reset Monthly Plan Bucket (120 Plan Credits) →'
                : 'Switch to Enterprise (120 Plan Credits & Unlimited Roles) →'}
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ON-DEMAND ROLLOVER PITCH CREDIT TOP-UP PACKS (Two-Bucket System)
         ==================================================================== */}
      <section className="rounded-2xl bg-white border-2 border-slate-300 p-4 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="space-y-1 max-w-3xl">
            <div className="inline-flex items-center gap-2 text-indigo-600 text-xs font-extrabold uppercase tracking-wider">
              <span>⚡ Bucket 2: Non-Expiring Rollover Top-Up Packs</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              On-Demand Pitch Credit Top-Ups
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Top-Up Credits are added to your <strong className="text-slate-900">Rollover Top-Up Bucket</strong>. Your monthly plan allowance (<strong className="text-slate-900">{planCredits} Plan Credits remaining</strong>) is always spent first, and Rollover Top-Up Credits (<strong className="text-amber-700">{rolloverCredits} Rollover Credits banked</strong>) never expire as long as your base subscription remains active. Protected by our 100% Accepted-Only Guarantee—if a candidate declines an outbound pitch, your credit is automatically refunded to the exact bucket it came from.
            </p>
          </div>

          <div className="shrink-0 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 space-y-1">
            <div className="flex items-center justify-between gap-6">
              <span className="text-slate-500">1. Monthly Plan Bucket:</span>
              <span className="font-black text-slate-900">{planCredits} Credits</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-amber-700">2. Rollover Top-Up Bucket:</span>
              <span className="font-black text-amber-700">{rolloverCredits} Credits</span>
            </div>
          </div>
        </div>

        {activeTier === 'free' && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span>
              🔒 <strong>Active Base Plan Required:</strong> Activate Starter ($149/mo Founding), Growth ($499/mo Founding), or Enterprise ($1,250/mo Founding) above before purchasing standalone Rollover Pitch Credit Top-Up Packs.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Boost Pack: +10 Credits ($150) */}
          <div className="rounded-2xl border-2 border-slate-300 bg-slate-50/50 p-4 sm:p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  ⚡ Boost Pack
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-300 text-slate-700 text-[11px] font-extrabold">
                  $15.00 / pitch
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <h3 className="text-2xl font-black text-slate-900">
                  +10 Credits
                </h3>
                <span className="text-2xl font-black text-slate-900">$150</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Quick top-up when you need a few extra outbound pitches to round out an interview slate this month.
              </p>
            </div>

            <button
              type="button"
              disabled={isProcessing || activeTier === 'free'}
              onClick={() => handleStripeEmployerCheckout('boost', true)}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition-colors shadow-sm disabled:opacity-40 cursor-pointer"
            >
              {processingTarget === 'topup_boost'
                ? 'Adding +10 Rollover Credits...'
                : 'Add +10 Rollover Credits ($150) →'}
            </button>
          </div>

          {/* Surge Pack: +25 Credits ($325) */}
          <div className="rounded-2xl border-2 border-indigo-500 bg-white p-4 sm:p-6 flex flex-col justify-between space-y-5 shadow-sm relative">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">
                  🚀 Surge Pack • Save 13%
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-extrabold">
                  $13.00 / pitch
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <h3 className="text-2xl font-black text-slate-900">
                  +25 Credits
                </h3>
                <span className="text-2xl font-black text-slate-900">$325</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Built for hiring managers actively sourcing passive candidates across 2 to 4 concurrent open roles.
              </p>
            </div>

            <button
              type="button"
              disabled={isProcessing || activeTier === 'free'}
              onClick={() => handleStripeEmployerCheckout('surge', true)}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition-colors shadow-sm disabled:opacity-40 cursor-pointer"
            >
              {processingTarget === 'topup_surge'
                ? 'Adding +25 Rollover Credits...'
                : 'Add +25 Rollover Credits ($325) →'}
            </button>
          </div>

          {/* Scale Pack: +75 Credits ($825) */}
          <div className="rounded-2xl border-2 border-slate-300 bg-slate-50/50 p-4 sm:p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                  🏢 Scale Pack • Save 27%
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold">
                  $11.00 / pitch
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <h3 className="text-2xl font-black text-slate-900">
                  +75 Credits
                </h3>
                <span className="text-2xl font-black text-slate-900">$825</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Maximum volume discount for multi-department recruiting pushes and quarterly talent acquisition sprints.
              </p>
            </div>

            <button
              type="button"
              disabled={isProcessing || activeTier === 'free'}
              onClick={() => handleStripeEmployerCheckout('scale', true)}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition-colors shadow-sm disabled:opacity-40 cursor-pointer"
            >
              {processingTarget === 'topup_scale'
                ? 'Adding +75 Rollover Credits...'
                : 'Add +75 Rollover Credits ($825) →'}
            </button>
          </div>
        </div>
      </section>

      {/* QA Sandbox Controls for Stress Testing (Hidden in production unless ?qa=1) */}
      {showQaControls && (
      <div className="bg-slate-100 rounded-2xl border-2 border-slate-300 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
              🧪 QA Stress-Testing Controls (Remove Before Public Launch)
            </span>
            <p className="text-xs text-slate-600 mt-0.5">
              Instant 1-click plan switching across all 4 Employer Tiers to test role-slot limits, seat caps, Two-Bucket rollover credits, and the HR Software Sync Hub.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleTierSwitch('free')}
            className={`w-full py-2.5 px-3 rounded-xl border text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50 ${
              activeTier === 'free'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
            }`}
          >
            {processingTarget === 'free'
              ? 'Switching...'
              : '1. No Active Plan (0 Roles / 0 Credits)'}
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleTierSwitch('starter')}
            className={`w-full py-2.5 px-3 rounded-xl border text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50 ${
              activeTier === 'starter'
                ? 'bg-amber-500 text-slate-950 border-slate-300 shadow-xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-amber-50'
            }`}
          >
            {processingTarget === 'starter'
              ? 'Switching...'
              : '2. Starter ($149 Founding / $299 Retail • 5 Roles / 10 Credits)'}
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleTierSwitch('growth')}
            className={`w-full py-2.5 px-3 rounded-xl border text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50 ${
              activeTier === 'growth'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-indigo-50'
            }`}
          >
            {processingTarget === 'growth'
              ? 'Switching...'
              : '3. Growth ($499 Founding / $799 Retail • 15 Roles / 35 Credits)'}
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleTierSwitch('enterprise')}
            className={`w-full py-2.5 px-3 rounded-xl border text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50 ${
              activeTier === 'enterprise'
                ? 'bg-slate-900 text-emerald-400 border-slate-900 ring-2 ring-amber-400 shadow-xs'
                : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-200'
            }`}
          >
            {processingTarget === 'enterprise'
              ? 'Switching...'
              : '4. Enterprise ($1,250 Founding / $1,999 Retail • Unlimited / 120 Credits)'}
          </button>
        </div>
      </div>
      )}
    </div>
  )
}
