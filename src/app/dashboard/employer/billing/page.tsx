'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  activateSandboxEmployerTier,
  resolveEmployerTierInfo,
} from '@/app/dashboard/actions'

export default function EmployerBillingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingTarget, setProcessingTarget] = useState<string | null>(null)

  const [orgData, setOrgData] = useState<any>(null)
  const [isOrgVerified, setIsOrgVerified] = useState(false)
  const [activeTier, setActiveTier] = useState<string>('starter')
  const [tierLabel, setTierLabel] = useState<string>('Starter Tier')
  const [maxActiveJobs, setMaxActiveJobs] = useState<number>(5)
  const [maxSeats, setMaxSeats] = useState<number>(2)
  const [activeJobsCount, setActiveJobsCount] = useState<number>(0)
  const [credits, setCredits] = useState<number>(0)

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

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-8">
      {/* Clean Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Employer Billing, Role Slots &amp; Pitch Credits
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Reviewing and unlocking candidates who apply to your blind job listings is 100% free (0 credits) on every active plan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/dashboard/employer/organization"
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-extrabold hover:bg-slate-50 transition-colors"
          >
            Company, Seats &amp; ATS Hub
          </Link>
          <Link
            href="/dashboard/employer/search"
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors shadow-sm"
          >
            Search Talent Pool →
          </Link>
        </div>
      </header>

      {/* Dynamic Founding Partner Status & Live Plan Summary Banner */}
      {isLoading ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center shadow-xs">
          <div className="inline-block w-6 h-6 border-3 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-2" />
          <p className="text-xs font-bold text-slate-500">
            Syncing organization verification &amp; plan status...
          </p>
        </div>
      ) : isOrgVerified ? (
        <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-8 border-2 border-amber-500 shadow-sm ring-1 ring-amber-400/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
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
                Your verified organization has permanent{' '}
                <strong className="text-amber-300">
                  ★ Founding Partner Gold Card Trim &amp; 1.25x XP Boost
                </strong>{' '}
                active across all blind job listings, plus{' '}
                <strong className="text-white">
                  100% free inbound applicant unlocks
                </strong>
                .
              </p>
            </div>

            {/* Live Account Balances */}
            <div className="grid grid-cols-3 gap-3 shrink-0 bg-slate-800/90 border border-slate-700 rounded-2xl p-4 text-center">
              <div className="px-2">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Active Roles
                </span>
                <span className="text-lg font-black text-white mt-0.5 block">
                  {activeJobsCount} / {maxActiveJobs}
                </span>
              </div>
              <div className="px-2 border-x border-slate-700">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Pitch Credits
                </span>
                <span className="text-lg font-black text-amber-300 mt-0.5 block">
                  {credits}
                </span>
              </div>
              <div className="px-2">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Team Seats
                </span>
                <span className="text-lg font-black text-emerald-400 mt-0.5 block">
                  Up to {maxSeats}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-8 border-2 border-amber-500 shadow-sm ring-1 ring-amber-400/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                ★ 30-Day Founding Partner Award ($99 Value — $0 for 30 Days)
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Verify Your Corporate Domain to Unlock Your 30-Day Founding Starter Award
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Organizations that verify their corporate domain during our Founding Member Launch automatically receive{' '}
                <strong className="text-white">
                  30 days of Starter Tier access ($0)
                </strong>{' '}
                including{' '}
                <strong className="text-amber-300">
                  5 Active Blind Job Slots
                </strong>
                ,{' '}
                <strong className="text-amber-300">
                  10 Outbound Pitch Credits
                </strong>
                ,{' '}
                <strong className="text-amber-300">
                  2 Team / BPO Collaborator Seats
                </strong>
                , and the permanent{' '}
                <strong className="text-emerald-300">
                  ★ Founding Partner Gold Card Trim &amp; 1.25x XP Multiplier
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
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
          }`}
        >
          <span>{feedback.text}</span>
          {activeTier === 'enterprise' && (
            <Link
              href="/dashboard/employer/organization"
              className="shrink-0 px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-extrabold hover:bg-emerald-800 transition-colors"
            >
              Open Enterprise ATS &amp; Webhook Hub →
            </Link>
          )}
        </div>
      )}

      {/* Pricing Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tier 1: Starter Tier */}
        <div
          className={`bg-white rounded-2xl p-6 flex flex-col justify-between transition-all ${
            activeTier === 'starter'
              ? 'border-2 border-amber-500 shadow-sm ring-1 ring-amber-400/50'
              : 'border border-slate-200 shadow-xs'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="text-amber-700">
                ★ Free for 30 Days (Founding Partner Award)
              </span>
              {activeTier === 'starter' && (
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Current Plan
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                Starter Tier
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">$99</span>
                <span className="text-xs font-bold text-slate-500">
                  / month after 30d award
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
                ✓ <strong>2 Team / BPO Collaborator Seats</strong>
              </li>
              <li>
                ✓ <strong>Unlimited Free Inbound Applicant Unlocks</strong>
              </li>
              <li>✓ 5-Point AI Fit Radar &amp; Dealbreaker Firewall</li>
              <li>✓ ★ Permanent Founding Partner Gold Trim</li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleTierSwitch('starter')}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {processingTarget === 'starter'
                ? 'Activating Starter...'
                : activeTier === 'starter'
                ? 'Top Up Starter (+10 Pitch Credits) →'
                : 'Switch to Starter (+10 Credits) →'}
            </button>
          </div>
        </div>

        {/* Tier 2: Growth Tier */}
        <div
          className={`bg-slate-900 text-white rounded-2xl p-6 flex flex-col justify-between transition-all ${
            activeTier === 'growth'
              ? 'border-2 border-amber-500 shadow-lg ring-1 ring-amber-400/50'
              : 'border-2 border-indigo-500 shadow-md'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="text-indigo-300">
                Most Popular for Recruiting Teams
              </span>
              {activeTier === 'growth' && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Current Plan
                </span>
              )}
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
              <li>
                ✓ <strong>Unlimited Free Inbound Applicant Unlocks</strong>
              </li>
              <li>✓ Shared Candidate Shortlist &amp; Encrypted Threads</li>
              <li>✓ ★ Permanent Founding Partner Gold Trim</li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleTierSwitch('growth')}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {processingTarget === 'growth'
                ? 'Activating Growth...'
                : activeTier === 'growth'
                ? 'Top Up Growth (+30 Pitch Credits) →'
                : 'Activate Growth (+30 Credits & 15 Roles) →'}
            </button>
          </div>
        </div>

        {/* Tier 3: Enterprise & Agency Tier */}
        <div
          className={`bg-white rounded-2xl p-6 flex flex-col justify-between transition-all ${
            activeTier === 'enterprise'
              ? 'border-2 border-amber-500 shadow-sm ring-1 ring-amber-400/50'
              : 'border border-slate-200 shadow-xs'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="text-emerald-700">
                High-Volume, ATS &amp; BPO Ready
              </span>
              {activeTier === 'enterprise' && (
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Current Plan
                </span>
              )}
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
              <li>
                ✓ <strong>Workday &amp; Greenhouse ATS / Webhook API Sync</strong>
              </li>
              <li>
                ✓ <strong>Automated Stage 2 Vault Export to ATS</strong>
              </li>
              <li>
                ✓ <strong>Unlimited Free Inbound Applicant Unlocks</strong>
              </li>
              <li>✓ ★ Permanent Founding Partner Gold Trim &amp; 1.25x XP</li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleTierSwitch('enterprise')}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {processingTarget === 'enterprise'
                ? 'Activating Enterprise...'
                : activeTier === 'enterprise'
                ? 'Top Up Enterprise (+100 Pitch Credits) →'
                : 'Activate Enterprise (+100 Credits & 50 Roles) →'}
            </button>
          </div>
        </div>
      </div>

      {/* QA Sandbox Controls for Stress Testing (All 4 Employer Tiers Included!) */}
      <div className="bg-slate-100 rounded-2xl border border-slate-300 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
            🧪 QA Stress-Testing Controls (Remove Before Public Launch)
          </span>
          <p className="text-xs text-slate-600 mt-0.5">
            Instant 1-click plan switching across all 4 Employer Tiers (Free, Starter, Growth, and Enterprise) to test role-slot limits, seat caps, and the Enterprise ATS &amp; Webhook Hub.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleTierSwitch('free')}
            className={`px-3.5 py-2 rounded-xl border text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50 ${
              activeTier === 'free'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
            }`}
          >
            {processingTarget === 'free'
              ? 'Switching...'
              : '1. Free Explorer (0 Roles / 0 Credits)'}
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleTierSwitch('starter')}
            className={`px-3.5 py-2 rounded-xl border text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50 ${
              activeTier === 'starter'
                ? 'bg-amber-500 text-slate-950 border-amber-500'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-amber-50'
            }`}
          >
            {processingTarget === 'starter'
              ? 'Switching...'
              : '2. Starter ($99 • 5 Roles / 2 Seats)'}
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleTierSwitch('growth')}
            className={`px-3.5 py-2 rounded-xl border text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50 ${
              activeTier === 'growth'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-indigo-50'
            }`}
          >
            {processingTarget === 'growth'
              ? 'Switching...'
              : '3. Growth ($299 • 15 Roles / 3 Seats)'}
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleTierSwitch('enterprise')}
            className={`px-3.5 py-2 rounded-xl border text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50 ${
              activeTier === 'enterprise'
                ? 'bg-slate-900 text-emerald-400 border-slate-900 ring-2 ring-amber-400'
                : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-200'
            }`}
          >
            {processingTarget === 'enterprise'
              ? 'Switching...'
              : '4. Enterprise ($899 • 50 Roles / 10 Seats / ATS API)'}
          </button>
        </div>
      </div>
    </div>
  )
}