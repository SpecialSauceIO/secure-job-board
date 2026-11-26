'use client'
import { trackAdConversion } from '@/components/MarketingPixels'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { HiringTracksFlowchart } from '@/components/W2HiringGuideView'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  activateSandboxEmployerTier,
  purchaseEmployerCreditTopUp,
  purchaseEmployerRolePass,
  resolveEmployerTierInfo,
} from '@/app/dashboard/actions'
import type {
  ProtectedRolePassId,
  RolePassInventory,
} from '@/lib/sponsored-verification'

export default function EmployerBillingPage() {
  const router = useRouter()
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
  const [processingTarget, setProcessingTarget] = useState<string | null>(null)

  const [orgData, setOrgData] = useState<any>(null)
  const [isOrgVerified, setIsOrgVerified] = useState(false)
  const [activeTier, setActiveTier] = useState<string>('starter')
  const [tierLabel, setTierLabel] = useState<string>('Starter Tier')
  const [maxActiveJobs, setMaxActiveJobs] = useState<number>(2)
  const [maxSeats, setMaxSeats] = useState<number>(2)
  const [activeJobsCount, setActiveJobsCount] = useState<number>(0)
  const [credits, setCredits] = useState<number>(0)
  const [planCredits, setPlanCredits] = useState<number>(0)
  const [rolloverCredits, setRolloverCredits] = useState<number>(0)
  const [rolePasses, setRolePasses] = useState<RolePassInventory>({
    extraRoleSlots: 0,
    role_25: 0,
    role_50: 0,
    role_100: 0,
    totalPasses: 0,
    firstRoleGranted: false,
  })

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
        setIsOrgVerified(Boolean(fetchedOrg?.verification_status === 'verified' || (fetchedOrg as any)?.domain_verified === true || ['active', 'verified_sandbox'].includes(String(fetchedOrg?.subscription_status || '').toLowerCase()) || ['explorer', 'starter', 'growth', 'enterprise'].includes(String(fetchedOrg?.subscription_tier || '').toLowerCase())))
        setCredits(fetchedOrg.connection_credits ?? 0)

        const resolved = await resolveEmployerTierInfo(fetchedOrg)
        setActiveTier(resolved.tier)
        setTierLabel(resolved.label)
        setMaxActiveJobs(resolved.maxActiveJobs)
        setMaxSeats(resolved.maxSeats)
        setPlanCredits(resolved.planCreditsRemaining)
        setRolloverCredits(resolved.rolloverCreditsRemaining)
        setRolePasses(resolved.rolePasses)
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
    const passParam = params.get('pass') as ProtectedRolePassId | 'extra_role_slot' | null
    const sessionIdParam = params.get('session_id')
    const selectParam = params.get('select') as 'starter' | 'growth' | 'enterprise' | null

    if (billingStatus === 'success' && sessionIdParam && tierParam && ['starter', 'growth', 'enterprise'].includes(tierParam)) {
      window.history.replaceState({}, '', '/dashboard/employer/billing')
      activateSandboxEmployerTier(tierParam, sessionIdParam).then((res) => {
        if (res?.error) {
          setFeedback({ type: 'error', text: res.error })
        } else {
          const tierPriceMap = { starter: 299, growth: 599, enterprise: 999 }
          trackAdConversion('Purchase', {
            value: tierPriceMap[tierParam] || 299,
            currency: 'USD',
            plan: `employer_${tierParam}`,
            role: 'employer',
          })
          setFeedback({
            type: 'success',
            text: res?.message || `Subscription Confirmed: Activated ${tierParam.toUpperCase()} Base Membership.`,
          })
        }
        loadBillingState()
      })
    } else if (billingStatus === 'role_pass_success' && sessionIdParam && passParam && ['extra_role_slot', 'role_25', 'role_50', 'role_100'].includes(passParam)) {
      window.history.replaceState({}, '', '/dashboard/employer/billing')
      purchaseEmployerRolePass(passParam, sessionIdParam).then((res) => {
        if (res?.error) {
          setFeedback({ type: 'error', text: res.error })
        } else {
          const passPriceMap: Record<string, number> = { extra_role_slot: 199, role_25: 199, role_50: 349, role_100: 599 }
          trackAdConversion('Purchase', {
            value: passPriceMap[passParam] || 199,
            currency: 'USD',
            plan: `employer_${passParam}`,
            role: 'employer',
          })
          setFeedback({
            type: 'success',
            text: res?.message || 'Payment Confirmed: Added 1 Extra Protected Role Slot ($199) to your account.',
          })
        }
        loadBillingState()
      })
    } else if (billingStatus === 'topup_success' && sessionIdParam && packParam && ['boost', 'surge', 'scale'].includes(packParam)) {
      window.history.replaceState({}, '', '/dashboard/employer/billing')
      purchaseEmployerCreditTopUp(packParam, sessionIdParam).then((res) => {
        if (res?.error) {
          setFeedback({ type: 'error', text: res.error })
        } else {
          setFeedback({
            type: 'success',
            text: res?.message || 'Payment Confirmed: Added rollover invitation credits to your account.',
          })
        }
        loadBillingState()
      })
    } else if (billingStatus === 'cancelled') {
      window.history.replaceState({}, '', '/dashboard/employer/billing')
      setFeedback({
        type: 'error',
        text: 'Checkout was cancelled. No billing changes were made.',
      })
    } else if (selectParam && ['starter', 'growth', 'enterprise'].includes(selectParam)) {
      window.history.replaceState({}, '', '/dashboard/employer/billing')
      const planNames: Record<string, string> = {
        starter: 'Starter ($299/mo Base Membership)',
        growth: 'Growth ($599/mo Base Membership)',
        enterprise: 'Enterprise ($999/mo Base Membership)',
      }
      setFeedback({
        type: 'success',
        text: `Welcome to Special Sauce: Select ${planNames[selectParam]} below when you are ready to activate your Base Membership.`,
      })
    }
  }, [loadBillingState])

  const handleStripeEmployerCheckout = async (
    targetId:
      | 'starter'
      | 'growth'
      | 'enterprise'
      | 'boost'
      | 'surge'
      | 'scale'
      | 'extra_role_slot'
      | ProtectedRolePassId,
    isTopUp = false
  ) => {
    const isRolePass = targetId === 'extra_role_slot' || targetId === 'role_25' || targetId === 'role_50' || targetId === 'role_100'
    setIsProcessing(true)
    setProcessingTarget(isTopUp ? `topup_${targetId}` : targetId)
    setFeedback(null)
    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isRolePass
            ? { packId: targetId }
            : isTopUp
            ? { packId: `topup_${targetId}` }
            : { tierId: targetId }
        ),
      })
      const data = await response.json()
      if (!response.ok || data.error) {
        if (!isTopUp && (targetId === 'starter' || targetId === 'growth' || targetId === 'enterprise') && String(data.error || '').includes('Permission denied')) {
          await handleTierSwitch(targetId)
          return
        }
        setFeedback({
          type: 'error',
          text: data.error || 'Could not launch Stripe Checkout.',
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setIsProcessing(false)
        setProcessingTarget(null)
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
    <div className="max-w-6xl mx-auto py-3 space-y-8">
      {/* Clean Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-300">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Membership &amp; Plan Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Base Memberships include 2, 5, or 15 Active Protected Roles (+$199 Extra Protected Role Slots anytime), unlimited $0 applications from verified Ecosystem Professionals, sponsored external Bridge verifications, and auto-refunded declined invites.
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
            Company &amp; Team Settings
          </Link>
          <Link
            href="/dashboard/employer/search"
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors shadow-sm"
          >
            Search Talent Pool →
          </Link>
        </div>
      </header>

      {/* Plan Status & Credit Balances Banner */}
      {isLoading ? (
        <div className="rounded-2xl bg-white border-2 border-slate-300 p-5 sm:p-8 text-center shadow-xs">
          <div className="inline-block w-6 h-6 border-3 border-slate-300 border-t-indigo-600 rounded-full animate-spin mb-2" />
          <p className="text-xs font-bold text-slate-500">
            Loading plan and credit balances...
          </p>
        </div>
      ) : isOrgVerified ? (
        <div className="rounded-2xl bg-slate-900 text-white p-4 sm:p-8 border-2 border-slate-300 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-wider">
                <span className="text-amber-300">
                  ★ Permanent Base Ecosystem Membership
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400">
                  ✓ {orgData?.domain || 'Company Domain'} Verified
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Current Plan: {tierLabel}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {maxActiveJobs < 1
                  ? 'Draft roles in $0/mo Practice Mode and activate Starter (2 Active Roles), Growth (5 Active Roles), or Enterprise (15 Active Roles) whenever you are ready to publish.'
                  : `Your plan includes ${maxActiveJobs} Active Protected Roles at a time, plus flat $199 Extra Protected Role Slots whenever you open additional concurrent roles. Monthly outbound credits are used first, and rollover credits never expire while active.`}
              </p>
            </div>

            {/* Live Account Balances */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 shrink-0 bg-slate-800/90 border border-slate-700 rounded-2xl p-4 text-center">
              <div className="px-2">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Active Roles
                </span>
                <span className="text-lg font-black text-white mt-0.5 block">
                  {maxActiveJobs < 1 ? '0 / 0' : `${activeJobsCount} / ${maxActiveJobs + rolePasses.totalPasses}`}
                </span>
                <span className="block text-[10px] font-bold text-slate-400">
                  {maxActiveJobs < 1 ? 'Practice Mode' : `${maxActiveJobs} Plan + ${rolePasses.totalPasses} Extra`}
                </span>
              </div>
              <div className="px-2 sm:border-l border-slate-700">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
                  Extra Role Slots
                </span>
                <span className="text-lg font-black text-indigo-300 mt-0.5 block">
                  {rolePasses.totalPasses}
                </span>
                <span className="block text-[10px] font-bold text-slate-400">
                  +$199 Overflow Bank
                </span>
              </div>
              <div className="px-2 border-t sm:border-t-0 sm:border-l border-slate-700 pt-2 sm:pt-0">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Plan Credits
                </span>
                <span className="text-lg font-black text-white mt-0.5 block">
                  {planCredits}
                </span>
              </div>
              <div className="px-2 border-t sm:border-t-0 sm:border-l border-slate-700 pt-2 sm:pt-0">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                  Rollover Credits
                </span>
                <span className="text-lg font-black text-amber-300 mt-0.5 block">
                  {rolloverCredits}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1 px-2 border-t sm:border-t-0 sm:border-l border-slate-700 pt-2 sm:pt-0">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                  Total Invites
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
                ★ Verified Employer Ecosystem Membership
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Verify Your Company to Unlock Protected Hiring
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Complete your one-time $25 organization verification to enter $0/mo Practice Mode—your $25 verification fee is credited directly toward Month 1 when you activate Starter ($299/mo · 2 Active Roles), Growth ($599/mo · 5 Active Roles), or Enterprise ($999/mo · 15 Active Roles).
              </p>
            </div>

            <div className="shrink-0">
              <Link
                href="/dashboard/employer/organization"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-colors shadow-md"
              >
                Verify Organization →
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
              Open HR Software Sync →
            </Link>
          )}
        </div>
      )}

      {/* Pricing Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tier 1: Starter */}
        <div
          className={`bg-white rounded-2xl p-4 sm:p-6 flex flex-col justify-between transition-all ${
            activeTier === 'starter'
              ? 'border-2 border-indigo-600 shadow-sm'
              : 'border-2 border-slate-300 shadow-xs'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="text-indigo-700">
                ★ Base Ecosystem Membership
              </span>
              {activeTier === 'starter' && (
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300">
                  Current Plan
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                Starter
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">$299</span>
                <span className="text-xs font-bold text-slate-600">
                  / mo
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Complete hiring home for lean teams with up to 2 Active Protected Roles included.
              </p>
            </div>

            <ul className="space-y-2.5 pt-4 border-t border-slate-300 text-xs text-slate-700 font-medium">
              <li className="text-indigo-900 font-bold">
                ★ <strong>2 Active Protected Roles Included</strong> (up to 25 sponsored Bridge verifications/role)
              </li>
              <li className="text-emerald-700 font-bold">
                ✓ <strong>$25 Verification Fee Credited</strong> toward Month 1
              </li>
              <li>
                ✓ <strong>+$199 Extra Protected Role Slots</strong> anytime you need more concurrent roles
              </li>
              <li>
                ✓ <strong>Verified Hiring Bridge</strong> links for external sourcing &amp; inbound leads • <Link href="/dashboard/talent-shield" className="text-indigo-700 underline hover:text-indigo-900 font-bold">How it works →</Link>
              </li>
              <li>
                ✓ <strong>Built-In W-2 Employer of Record (EOR)</strong> • Direct Hire, Contract-to-Hire ($0 conversion), Limited &amp; Indefinite W-2 • <Link href="/dashboard/w2-hiring" className="text-indigo-700 underline hover:text-indigo-900 font-bold">4 Hiring Paths →</Link>
              </li>
              <li>
                ✓ <strong>10 Outbound Invitation Credits / mo</strong>
              </li>
              <li className="text-emerald-700 font-bold">
                🛡️ <strong>Accepted-Only Guarantee</strong> (Declined invites auto-refund)
              </li>
              <li>
                ✓ <strong>Unlimited Verified Ecosystem Applicants ($0)</strong>
              </li>
              <li>
                ✓ <strong>2 Team Seats</strong> &amp; Founding Partner Badge
              </li>
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
                ? '✓ Starter Plan Active (Refresh Credits) →'
                : 'Activate Starter ($299/mo) →'}
            </button>
          </div>
        </div>

        {/* Tier 2: Growth */}
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
                ★ Most Popular • Base Ecosystem Membership
              </span>
              {activeTier === 'growth' && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  Current Plan
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl font-black text-white">Growth</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">$599</span>
                <span className="text-xs font-bold text-amber-300">
                  / mo
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                For growing companies hiring across departments with up to 5 Active Protected Roles included.
              </p>
            </div>

            <ul className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-200 font-medium">
              <li className="text-amber-300 font-bold">
                ★ <strong>5 Active Protected Roles Included</strong> (up to 50 sponsored Bridge verifications/role)
              </li>
              <li className="text-emerald-300 font-bold">
                ✓ <strong>$25 Verification Fee Credited</strong> toward Month 1
              </li>
              <li>
                ✓ <strong>+$199 Extra Protected Role Slots</strong> anytime you need more concurrent roles
              </li>
              <li>
                ✓ <strong>Verified Hiring Bridge</strong> links for external sourcing &amp; inbound leads • <Link href="/dashboard/talent-shield" className="text-emerald-300 underline hover:text-emerald-200 font-bold">How it works →</Link>
              </li>
              <li>
                ✓ <strong>Built-In W-2 Employer of Record (-1% W-2 Markup)</strong> • $0 conversion &amp; Net-30 billing • <Link href="/dashboard/w2-hiring" className="text-emerald-300 underline hover:text-emerald-200 font-bold">4 Hiring Paths →</Link>
              </li>
              <li>
                ✓ <strong>35 Outbound Invitation Credits / mo</strong>
              </li>
              <li className="text-emerald-300 font-bold">
                🛡️ <strong>Accepted-Only Guarantee</strong> (Declined invites auto-refund)
              </li>
              <li>
                ✓ <strong>Unlimited Verified Ecosystem Applicants ($0)</strong>
              </li>
              <li>
                ✓ <strong>Up to 5 Team &amp; Recruiter Seats</strong> + Founding Partner Badge
              </li>
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
                ? '✓ Growth Plan Active (Refresh Credits) →'
                : 'Activate Growth ($599/mo) →'}
            </button>
          </div>
        </div>

        {/* Tier 3: Enterprise */}
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
                ★ Scale, -2% W-2 &amp; HR Auto-Sync
              </span>
              {activeTier === 'enterprise' && (
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300">
                  Current Plan
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                Enterprise
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">$999</span>
                <span className="text-xs font-bold text-slate-600">
                  / mo
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                For multi-team hiring with HR software sync and up to 15 Active Protected Roles included.
              </p>
            </div>

            <ul className="space-y-2.5 pt-4 border-t border-slate-300 text-xs text-slate-700 font-medium">
              <li className="text-indigo-900 font-bold">
                ★ <strong>15 Active Protected Roles Included</strong> (up to 100 sponsored Bridge verifications/role)
              </li>
              <li className="text-emerald-700 font-bold">
                ✓ <strong>$25 Verification Fee Credited</strong> toward Month 1
              </li>
              <li>
                ✓ <strong>+$199 Extra Protected Role Slots</strong> anytime you need more concurrent roles
              </li>
              <li>
                ✓ <strong>Verified Hiring Bridge</strong> links for external sourcing &amp; inbound leads • <Link href="/dashboard/talent-shield" className="text-indigo-700 underline hover:text-indigo-900 font-bold">How it works →</Link>
              </li>
              <li>
                ✓ <strong>Built-In W-2 Employer of Record (-2% W-2 Markup)</strong> • Lowest volume W-2 rate &amp; $0 conversion • <Link href="/dashboard/w2-hiring" className="text-indigo-700 underline hover:text-indigo-900 font-bold">4 Hiring Paths →</Link>
              </li>
              <li>
                ✓ <strong>120 Outbound Invitation Credits / mo</strong>
              </li>
              <li className="text-emerald-700 font-bold">
                🛡️ <strong>Accepted-Only Guarantee</strong> (Declined invites auto-refund)
              </li>
              <li>
                ✓ <strong>Workday &amp; Greenhouse Auto-Sync</strong> + CSV Export
              </li>
              <li>
                ✓ <strong>Unlimited Team &amp; Recruiter Seats</strong>
              </li>
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
                ? '✓ Enterprise Plan Active (Refresh Credits) →'
                : 'Activate Enterprise ($999/mo) →'}
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          EXTRA PROTECTED ROLE SLOT ($199 FLAT OVERFLOW ADD-ON)
         ==================================================================== */}
      <section className="rounded-2xl bg-white border-2 border-slate-300 p-4 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="space-y-1 max-w-3xl">
            <div className="inline-flex items-center gap-2 text-emerald-700 text-xs font-extrabold uppercase tracking-wider">
              <span>🛡️ Overflow Role Capacity Add-On</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Need Another Concurrent Role? Add an Extra Protected Role Slot ($199)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Starter includes 2 Active Protected Roles, Growth includes 5, and Enterprise includes 15—and closing or pausing a filled role frees its plan slot right away. Whenever all of your included plan slots are active at once, add a flat $199 Extra Protected Role Slot without changing your monthly tier.
            </p>
          </div>

          <div className="shrink-0 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 space-y-1.5">
            <div className="flex items-center justify-between gap-6">
              <span className="text-slate-500">Included Plan Slots:</span>
              <span className="font-black text-slate-900">{maxActiveJobs < 1 ? '0 (Practice Mode)' : `${Math.min(activeJobsCount, maxActiveJobs)} / ${maxActiveJobs} Active`}</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-indigo-700">Extra Role Slots Banked:</span>
              <span className="font-black text-indigo-700">{rolePasses.totalPasses}</span>
            </div>
            {(maxActiveJobs > activeJobsCount || rolePasses.totalPasses > 0) && (
              <div className="pt-1.5 border-t border-slate-200 text-right">
                <Link href="/dashboard/employer/jobs/new" className="text-indigo-700 hover:text-indigo-900 font-extrabold underline">
                  Post a Protected Role →
                </Link>
              </div>
            )}
          </div>
        </div>

        {activeTier === 'free' && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span>
              🔒 <strong>Active Base Membership Required:</strong> Activate Starter ($299/mo · 2 Active Roles), Growth ($599/mo · 5 Active Roles), or Enterprise ($999/mo · 15 Active Roles) above first.
            </span>
          </div>
        )}

        <div className="rounded-2xl border-2 border-indigo-500 bg-slate-50/70 p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">
                ★ Extra Protected Role Slot
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-extrabold">
                {rolePasses.totalPasses} Banked
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              $199 Flat Add-On • +1 Extra Protected Role Slot
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Publishes 1 additional concurrent Protected Role beyond your included plan capacity, including up to 25 Employer-Sponsored external ID verifications via Verified Hiring Bridge (pre-gated before Stripe ID) plus unlimited $0 applications from already-verified Special Sauce Professionals.
            </p>
          </div>

          <div className="shrink-0 w-full lg:w-auto">
            <button
              type="button"
              disabled={isProcessing || activeTier === 'free'}
              onClick={() => handleStripeEmployerCheckout('extra_role_slot')}
              className="w-full lg:w-auto py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition-colors shadow-sm disabled:opacity-40 cursor-pointer"
            >
              {processingTarget === 'extra_role_slot'
                ? 'Opening Checkout...'
                : 'Add Extra Protected Role Slot ($199) →'}
            </button>
          </div>
        </div>
      </section>

      <HiringTracksFlowchart isDashboard={true} showGuideLink={true} />

      {/* ====================================================================
          ON-DEMAND ROLLOVER CREDIT TOP-UP PACKS ($150 / $350 / $900)
         ==================================================================== */}
      <section className="rounded-2xl bg-white border-2 border-slate-300 p-4 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="space-y-1 max-w-3xl">
            <div className="inline-flex items-center gap-2 text-indigo-600 text-xs font-extrabold uppercase tracking-wider">
              <span>⚡ Rollover Invitation Credit Packs</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Need Extra Outbound Reach?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Add invitation credits anytime. Your monthly plan credits are used first, and top-up credits roll over and never expire while your plan is active. If a professional declines an invitation, your credit is automatically refunded.
            </p>
          </div>

          <div className="shrink-0 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 space-y-1">
            <div className="flex items-center justify-between gap-6">
              <span className="text-slate-500">Monthly Plan Credits:</span>
              <span className="font-black text-slate-900">{planCredits}</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-amber-700">Rollover Top-Up Credits:</span>
              <span className="font-black text-amber-700">{rolloverCredits}</span>
            </div>
          </div>
        </div>

        {activeTier === 'free' && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span>
              🔒 <strong>Active Plan Required:</strong> Activate Starter, Growth, or Enterprise above before adding top-up credit packs.
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
                  $15 / invite
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <h3 className="text-2xl font-black text-slate-900">
                  +10 Credits
                </h3>
                <span className="text-2xl font-black text-slate-900">$150</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Quick top-up to round out an interview slate.
              </p>
            </div>

            <button
              type="button"
              disabled={isProcessing || activeTier === 'free'}
              onClick={() => handleStripeEmployerCheckout('boost', true)}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition-colors shadow-sm disabled:opacity-40 cursor-pointer"
            >
              {processingTarget === 'topup_boost'
                ? 'Adding +10 Credits...'
                : 'Add +10 Credits ($150) →'}
            </button>
          </div>

          {/* Surge Pack: +25 Credits ($350) */}
          <div className="rounded-2xl border-2 border-indigo-500 bg-white p-4 sm:p-6 flex flex-col justify-between space-y-5 shadow-sm relative">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">
                  🚀 Surge Pack • Most Popular
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-extrabold">
                  $14 / invite
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <h3 className="text-2xl font-black text-slate-900">
                  +25 Credits
                </h3>
                <span className="text-2xl font-black text-slate-900">$350</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Built for teams actively sourcing across multiple open roles.
              </p>
            </div>

            <button
              type="button"
              disabled={isProcessing || activeTier === 'free'}
              onClick={() => handleStripeEmployerCheckout('surge', true)}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition-colors shadow-sm disabled:opacity-40 cursor-pointer"
            >
              {processingTarget === 'topup_surge'
                ? 'Adding +25 Credits...'
                : 'Add +25 Credits ($350) →'}
            </button>
          </div>

          {/* Scale Pack: +75 Credits ($900) */}
          <div className="rounded-2xl border-2 border-slate-300 bg-slate-50/50 p-4 sm:p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                  🏢 Scale Pack • Best Value
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold">
                  $12 / invite
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <h3 className="text-2xl font-black text-slate-900">
                  +75 Credits
                </h3>
                <span className="text-2xl font-black text-slate-900">$900</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Best per-invite value for multi-department hiring sprints.
              </p>
            </div>

            <button
              type="button"
              disabled={isProcessing || activeTier === 'free'}
              onClick={() => handleStripeEmployerCheckout('scale', true)}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition-colors shadow-sm disabled:opacity-40 cursor-pointer"
            >
              {processingTarget === 'topup_scale'
                ? 'Adding +75 Credits...'
                : 'Add +75 Credits ($900) →'}
            </button>
          </div>
        </div>
      </section>

      {/* Step Down / Pause Hiring to Verified Practice Mode ($0/mo) */}
      {activeTier !== 'free' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
              Hiring Paused Between Roles?
            </span>
            <h4 className="text-sm font-black text-slate-900">
              Step Down to Verified Practice Mode ($0/mo)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              Keep your verified organization badge, company profile, and drafted roles active at $0/mo while hiring is paused. Reactivate Starter, Growth, or Enterprise anytime.
            </p>
          </div>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleTierSwitch('free')}
            className="shrink-0 px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50"
          >
            {processingTarget === 'free' ? 'Switching...' : 'Pause to $0/mo Practice Mode'}
          </button>
        </div>
      )}

      {/* QA Sandbox Controls */}
      {showQaControls && (
      <div className="bg-slate-100 rounded-2xl border-2 border-slate-300 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
              🧪 QA Controls (Local Only)
            </span>
            <p className="text-xs text-slate-600 mt-0.5">
              Switch between Employer plans to test included active role limits, $199 extra role slots, seats, and rollover credits.
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
            1. Practice Mode ($0/mo)
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
            2. Starter ($299/mo)
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
            3. Growth ($599/mo)
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
            4. Enterprise ($999/mo)
          </button>
        </div>
      </div>
      )}
    </div>
  )
}
