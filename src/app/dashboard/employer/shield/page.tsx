'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  getEmployerTalentShieldWorkspaceAction,
  createEmployerTalentShieldLinkAction,
  revokeEmployerTalentShieldLinkAction,
} from '@/app/dashboard/actions'
import type {
  EmployerTalentShieldLinkView,
  EmployerTalentShieldMode,
} from '@/lib/inbound-shield'

type EnrichedEmployerShieldLink = EmployerTalentShieldLinkView & {
  job_title?: string
}

type ActiveProtectedRoleOption = {
  id: string
  title: string
  work_model: string
  salary_min: number | null
  salary_max: number | null
}

export default function EmployerTalentShieldPage() {
  const [loading, setLoading] = useState(true)
  const [organizationName, setOrganizationName] = useState('')
  const [isFullyVerified3of3, setIsFullyVerified3of3] = useState(true)
  const [hasActivePaidPlan, setHasActivePaidPlan] = useState(true)
  const [tierLabel, setTierLabel] = useState('')
  const [credits, setCredits] = useState(0)
  const [activeJobs, setActiveJobs] = useState<ActiveProtectedRoleOption[]>([])
  const [links, setLinks] = useState<EnrichedEmployerShieldLink[]>([])

  const [selectedJobId, setSelectedJobId] = useState('')
  const [mode, setMode] = useState<EmployerTalentShieldMode>('outbound_sourcing')
  const [employerPitch, setEmployerPitch] = useState('')
  const [privateMemo, setPrivateMemo] = useState('')
  const [ttlDays, setTtlDays] = useState<number>(14)

  const [minting, setMinting] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [freshLinkId, setFreshLinkId] = useState<string | null>(null)
  const [freshLinkUrl, setFreshLinkUrl] = useState<string | null>(null)
  const [freshLinkMode, setFreshLinkMode] = useState<EmployerTalentShieldMode>('outbound_sourcing')
  const [freshLinkMemo, setFreshLinkMemo] = useState('')
  const [freshRoleTitle, setFreshRoleTitle] = useState('')
  const [copiedMode, setCopiedMode] = useState<'url' | 'dm' | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'redeemed' | 'inactive'>('all')

  const loadWorkspace = useCallback(async () => {
    const res = await getEmployerTalentShieldWorkspaceAction()
    if (res.error) {
      setErrorMsg(res.error)
    } else {
      setOrganizationName(res.organizationName || '')
      setIsFullyVerified3of3(Boolean(res.isFullyVerified3of3))
      setHasActivePaidPlan(Boolean(res.hasActivePaidPlan))
      setTierLabel(String(res.tierLabel || ''))
      setCredits(Number(res.credits || 0))
      const jobList = res.activeJobs || []
      setActiveJobs(jobList)
      setSelectedJobId((prev) => {
        if (prev && jobList.some((j) => j.id === prev)) return prev
        return jobList[0]?.id || ''
      })
      setLinks(res.links || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadWorkspace()
  }, [loadWorkspace])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setFreshLinkUrl(null)
    if (!selectedJobId) {
      setErrorMsg('Select an active published Protected Role first.')
      return
    }
    setMinting(true)
    const res = await createEmployerTalentShieldLinkAction({
      jobId: selectedJobId,
      mode,
      employerPitch: mode === 'outbound_sourcing' ? employerPitch : '',
      privateMemo,
      ttlDays,
    })
    setMinting(false)

    if (res.error || !res.token || !res.record) {
      setErrorMsg(res.error || 'Could not create Verified Hiring Bridge link.')
      return
    }

    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://www.specialsauce.io'
    setFreshLinkId(res.record.id)
    setFreshLinkUrl(`${origin}/shield/${res.token}`)
    setFreshLinkMode(res.record.mode)
    setFreshLinkMemo(res.record.private_memo || '')
    setFreshRoleTitle(res.record.job_title || 'Protected Role')
    setPrivateMemo('')
    setEmployerPitch('')
    setLinks((prev) => [res.record!, ...prev])
    await loadWorkspace()
  }

  const handleRevoke = async (linkId: string) => {
    setErrorMsg(null)
    setRevokingId(linkId)
    const res = await revokeEmployerTalentShieldLinkAction(linkId)
    setRevokingId(null)
    if (res.error) {
      setErrorMsg(res.error)
      return
    }
    if (!freshLinkId || freshLinkId === linkId) {
      setFreshLinkId(null)
      setFreshLinkUrl(null)
      setCopiedMode(null)
    }
    setLinks((prev) =>
      prev.map((item) =>
        item.id === linkId
          ? { ...item, status: 'revoked', revoked_at: new Date().toISOString() }
          : item
      )
    )
    await loadWorkspace()
  }

  const buildReadyToSendDm = (url: string, linkMode: EmployerTalentShieldMode) => {
    if (linkMode === 'inbound_dm_gate') {
      return `Thanks for reaching out about our open team! To keep hiring fair, spam-free, and private on both sides, we review applicants through SpecialSauce.io (The World's First Secured Workforce Ecosystem). You can verify and check your TrueFit™ alignment through this one-time Protected Role link: ${url}`
    }
    return `Hi! Your background stood out to our hiring team, and we would love to share a Protected Role invitation with you through SpecialSauce.io (The World's First Secured Workforce Ecosystem). Your identity and contact info stay completely private until you review the role and choose to unlock Stage 2: ${url}`
  }

  const copyText = async (text: string, which: 'url' | 'dm') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMode(which)
      setTimeout(() => setCopiedMode(null), 2500)
    } catch {
      setErrorMsg('Clipboard permission blocked. Please highlight and copy manually.')
    }
  }

  const counts = useMemo(() => {
    const active = links.filter((l) => l.status === 'active').length
    const redeemed = links.filter((l) => l.status === 'redeemed').length
    const inactive = links.filter((l) => l.status === 'revoked' || l.status === 'expired').length
    return { all: links.length, active, redeemed, inactive }
  }, [links])

  const filteredLinks = useMemo(() => {
    if (statusFilter === 'active') return links.filter((l) => l.status === 'active')
    if (statusFilter === 'redeemed') return links.filter((l) => l.status === 'redeemed')
    if (statusFilter === 'inactive') {
      return links.filter((l) => l.status === 'revoked' || l.status === 'expired')
    }
    return links
  }, [links, statusFilter])

  const canMint =
    isFullyVerified3of3 &&
    hasActivePaidPlan &&
    activeJobs.length > 0 &&
    (mode === 'inbound_dm_gate' || credits >= 1)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3 py-1 text-xs font-semibold text-indigo-800 dark:text-indigo-300">
            🛡️ Verified Hiring Bridge • One-Time Protected Role Links
          </span>
          <Link
            href="/dashboard/support?tab=security"
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            How our 2-Stage Privacy Handshake works →
          </Link>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Verified Hiring Bridge
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          Issue zero-correlation, single-use Protected Role links for external sourcing on LinkedIn, GitHub, or email — or gate cold inbound DMs sent to your hiring managers. Neither your company name nor role details are exposed publicly before a Real-Person ID-verified Professional signs in.
        </p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5">
            <p className="font-semibold text-slate-900 dark:text-white">1. Zero Public Role Leakage</p>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Scrapers and unverified visitors never see your company name, compensation band, or Protected Role title.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5">
            <p className="font-semibold text-slate-900 dark:text-white">2. 40%+ TrueFit™ Gate</p>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Every redeemed link enforces Stripe Real-Person ID verification and a 40%+ TrueFit Score™ alignment check.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5">
            <p className="font-semibold text-slate-900 dark:text-white">3. Encrypted Team Context</p>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Your private sourcing note stays AES-256 encrypted for your hiring team only and is never shown to Professionals.
            </p>
          </div>
        </div>

        {!loading && (
          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 font-medium text-slate-800 dark:text-slate-200">
              Organization: <strong>{organizationName || 'Employer'}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 font-medium text-slate-800 dark:text-slate-200">
              Plan: <strong>{tierLabel || 'Practice Mode'}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
              Outbound Credits Available: {credits}
            </span>
          </div>
        )}
      </div>

      {!loading && !isFullyVerified3of3 && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
              Complete 3/3 Organization & Admin ID Verification First
            </p>
            <p className="mt-1 text-xs sm:text-sm text-amber-800 dark:text-amber-300">
              Verify your corporate domain, Federal EIN / State of Incorporation, and Admin Real-Person ID on Company Profile before issuing Verified Hiring Bridge links.
            </p>
          </div>
          <Link
            href="/dashboard/employer/organization"
            className="shrink-0 inline-flex items-center justify-center rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition"
          >
            Complete 3/3 Verification →
          </Link>
        </div>
      )}

      {!loading && isFullyVerified3of3 && !hasActivePaidPlan && (
        <div className="rounded-2xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
              Activate an Employer Plan to Issue Live Talent Shield Links
            </p>
            <p className="mt-1 text-xs sm:text-sm text-indigo-800 dark:text-indigo-300">
              Activate Starter ($149/mo Founding), Growth ($499/mo Founding), or Enterprise ($1,250/mo Founding) — your $25 verification fee is 100% credited toward Month 1.
            </p>
          </div>
          <Link
            href="/dashboard/employer/billing"
            className="shrink-0 inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition"
          >
            View Employer Plans →
          </Link>
        </div>
      )}

      {!loading && isFullyVerified3of3 && hasActivePaidPlan && activeJobs.length === 0 && (
        <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Publish an Active Protected Role First
            </p>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Verified Hiring Bridge links attach to a live published Protected Role so Special Sauce can run verified 40%+ TrueFit™ scoring.
            </p>
          </div>
          <Link
            href="/dashboard/employer/jobs"
            className="shrink-0 inline-flex items-center justify-center rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 text-sm font-semibold shadow-sm transition"
          >
            Manage Roles →
          </Link>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
          {errorMsg}
        </div>
      )}

      <form
        onSubmit={handleGenerate}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5"
      >
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Generate a One-Time Protected Role Link
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Each link uses an unguessable ss_inv_ token and burns automatically once redeemed. Active limit: up to 50 unused links per organization.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode('outbound_sourcing')}
            className={`text-left rounded-xl border p-4 transition ${
              mode === 'outbound_sourcing'
                ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Outbound Sourcing Invitation
              </span>
              <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/60 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-800 dark:text-indigo-200">
                1 Credit on 40%+ Delivery
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Invite passive talent you found on LinkedIn, GitHub, or referrals. Any verified Explorer ($0/mo), Professional, or Prestige member can accept. Covered by your Accepted-Only Guarantee.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMode('inbound_dm_gate')}
            className={`text-left rounded-xl border p-4 transition ${
              mode === 'inbound_dm_gate'
                ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Inbound Hiring-Manager DM Gate
              </span>
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-200">
                0 Employer Credits
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Reply to cold LinkedIn DMs or inbound emails asking for a role. Applicant completes Real-Person ID check and submits an Outbound Protected Application into Inbound Applications.
            </p>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-1.5">
              Active Protected Role
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              disabled={activeJobs.length === 0}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {activeJobs.length === 0 ? (
                <option value="">No active published Protected Roles available</option>
              ) : (
                activeJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({String(j.work_model || 'remote').toUpperCase()})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-1.5">
              Auto-Expire Window
            </label>
            <select
              value={ttlDays}
              onChange={(e) => setTtlDays(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={7}>7 Days</option>
              <option value={14}>14 Days (Recommended)</option>
              <option value={30}>30 Days</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-1.5">
            Private Context Note (Encrypted — Visible Only to Your Hiring Team)
          </label>
          <input
            type="text"
            maxLength={140}
            value={privateMemo}
            onChange={(e) => setPrivateMemo(e.target.value)}
            placeholder="e.g., Distributed Systems lead from GitHub PR #412 — Tuesday outreach"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {mode === 'outbound_sourcing' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-1.5">
              Stage 1 Invitation Pitch (Optional — Shown Only After Verified Sign-In)
            </label>
            <textarea
              rows={2}
              maxLength={600}
              value={employerPitch}
              onChange={(e) => setEmployerPitch(e.target.value)}
              placeholder="Share why this role fits their background (do not include personal emails, phone numbers, or external URLs in Stage 1)..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {mode === 'outbound_sourcing'
              ? '1 Outbound Credit is deducted only when a verified Professional clears 40%+ TrueFit™ and receives your invitation.'
              : '0 Employer credits used. Verified Professionals submit an Outbound Protected Application directly to your Inbound Applications queue.'}
          </p>
          <button
            type="submit"
            disabled={minting || !canMint}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition"
          >
            {minting ? 'Generating Link...' : 'Generate One-Time Link'}
          </button>
        </div>
      </form>

      {freshLinkUrl && (
        <div className="rounded-2xl border-2 border-emerald-500/70 bg-emerald-50/70 dark:bg-emerald-950/30 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                ✅ One-Time Protected Role Link Ready ({freshRoleTitle})
              </p>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                Copy this URL or ready-to-send DM now — for zero-correlation security, raw tokens are never stored in plain text once you leave this page.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
              <span className="rounded-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                {freshLinkMode === 'inbound_dm_gate' ? 'Inbound DM Gate (0 Credits)' : 'Outbound Sourcing'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setFreshLinkId(null)
                  setFreshLinkUrl(null)
                  setCopiedMode(null)
                }}
                className="rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white/80 dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-white dark:hover:bg-slate-800 transition"
              >
                Dismiss
              </button>
            </div>
          </div>

          {freshLinkMemo && (
            <p className="text-xs font-medium text-emerald-900 dark:text-emerald-200">
              Private Team Note: <span className="font-normal">{freshLinkMemo}</span>
            </p>
          )}

          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 break-all">
            {freshLinkUrl}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => copyText(freshLinkUrl, 'url')}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition"
            >
              {copiedMode === 'url' ? 'Copied Link!' : 'Copy One-Time Link'}
            </button>
            <button
              type="button"
              onClick={() => copyText(buildReadyToSendDm(freshLinkUrl, freshLinkMode), 'dm')}
              className="inline-flex items-center justify-center rounded-xl border border-emerald-600 dark:border-emerald-500 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-slate-800 px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-200 transition"
            >
              {copiedMode === 'dm' ? 'Copied Ready-to-Send DM!' : 'Copy Ready-to-Send DM'}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Issued Talent Shield Links
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { key: 'all', label: `All (${counts.all})` },
                { key: 'active', label: `Active (${counts.active})` },
                { key: 'redeemed', label: `Redeemed (${counts.redeemed})` },
                { key: 'inactive', label: `Retired / Expired (${counts.inactive})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === tab.key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
            Loading Talent Shield ledger...
          </p>
        ) : filteredLinks.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
            No Talent Shield links in this filter yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredLinks.map((item) => {
              const statusBadge =
                item.status === 'active'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : item.status === 'redeemed'
                    ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'

              return (
                <div
                  key={item.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase ${statusBadge}`}
                      >
                        {item.status === 'revoked' ? 'retired' : item.status}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {item.mode === 'inbound_dm_gate'
                          ? 'Inbound DM Gate (0 Credits)'
                          : 'Outbound Sourcing'}
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.job_title || 'Protected Role'}
                      </span>
                      {item.status === 'active' && Number(item.below_threshold_attempts || 0) > 0 && (
                        <span
                          title="A verified Professional checked this link and did not meet the 40% TrueFit™ threshold. Zero personal identity was shared and this link remains active."
                          className="inline-flex items-center rounded-full border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 dark:text-amber-300"
                        >
                          Checked • Below 40% TrueFit™
                          {typeof item.last_below_threshold_score === 'number'
                            ? ` (${item.last_below_threshold_score}%)`
                            : ''}
                        </span>
                      )}
                    </div>

                    {item.private_memo ? (
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        🔒 Private Team Note: <span className="font-medium">{item.private_memo}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No private team note recorded</p>
                    )}

                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Created {new Date(item.created_at).toLocaleDateString()} • Expires{' '}
                      {new Date(item.expires_at).toLocaleDateString()}
                      {item.redeemed_at
                        ? ` • Redeemed ${new Date(item.redeemed_at).toLocaleDateString()}`
                        : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'redeemed' && (
                      <Link
                        href={
                          item.mode === 'inbound_dm_gate'
                            ? '/dashboard/employer/applications'
                            : '/dashboard/employer/pitches'
                        }
                        className="rounded-lg border border-indigo-300 dark:border-indigo-700 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                      >
                        {item.mode === 'inbound_dm_gate'
                          ? 'View Application →'
                          : 'View Invitation →'}
                      </Link>
                    )}
                    {item.status === 'active' && (
                      <button
                        type="button"
                        disabled={revokingId === item.id}
                        onClick={() => handleRevoke(item.id)}
                        className="rounded-lg border border-rose-300 dark:border-rose-800 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-50 transition"
                      >
                        {revokingId === item.id ? 'Retiring...' : 'Retire Link'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
