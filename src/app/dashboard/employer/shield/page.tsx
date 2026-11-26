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
  const mode: EmployerTalentShieldMode = 'inbound_dm_gate'
  const [privateMemo, setPrivateMemo] = useState('')
  const [ttlDays, setTtlDays] = useState<number>(14)

  const [minting, setMinting] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [freshLinkId, setFreshLinkId] = useState<string | null>(null)
  const [freshLinkUrl, setFreshLinkUrl] = useState<string | null>(null)
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
      employerPitch: '',
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
    setFreshLinkMemo(res.record.private_memo || '')
    setFreshRoleTitle(res.record.job_title || 'Protected Role')
    setPrivateMemo('')
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

  const buildReadyToSendMessage = (url: string) => {
    return `Apply directly through our Verified Hiring Bridge on SpecialSauce.io (The World's First Secured Workforce Ecosystem). Complete a quick Real-Person ID check ($0 cost to you) and check your TrueFit Score™ alignment here: ${url}`
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
    activeJobs.length > 0

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3 py-1 text-xs font-semibold text-indigo-800 dark:text-indigo-300">
            🛡️ Verified Hiring Bridge • Included on Starter, Growth &amp; Enterprise
          </span>
          <Link
            href="/dashboard/employer/talent-shield"
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            How Verified Hiring Bridge works →
          </Link>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Verified Hiring Bridge
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          Drop a Verified Hiring Bridge link on your careers page, LinkedIn post, or external listing—or send it directly to a standout person. Every applicant completes a quick Real-Person ID check at $0 cost (covered by your plan) and clears your 40%+ TrueFit Score™ before reaching your Inbound Applications.
        </p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5">
            <p className="font-semibold text-slate-900 dark:text-white">1. Share One Link Anywhere</p>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Post on your careers page, LinkedIn, or any external job listing—or send directly to someone you want to invite.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5">
            <p className="font-semibold text-slate-900 dark:text-white">2. Stop Bots ($0 to Applicants)</p>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              External applicants verify their real identity via Stripe for $0 up to your role's sponsored cap, while Ecosystem Professionals apply unlimited at $0.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5">
            <p className="font-semibold text-slate-900 dark:text-white">3. 40%+ TrueFit™ Gate</p>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Qualified, ID-verified applicants land directly in Inbound Applications with zero per-applicant fees and 0 outbound credits used.
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
              Activate a Base Membership to Issue Verified Hiring Bridge Links
            </p>
            <p className="mt-1 text-xs sm:text-sm text-indigo-800 dark:text-indigo-300">
              Activate Starter ($299/mo · 2 Active Roles), Growth ($599/mo · 5 Active Roles), or Enterprise ($999/mo · 15 Active Roles) — your $25 verification fee is credited toward Month 1.
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
            Generate a Verified Hiring Bridge Link
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Attach a shareable ss_inv_ link to any active Protected Role. Uses 0 Employer outbound credits—verified applicants land directly in Inbound Applications.
          </p>
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

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            0 Employer outbound credits used. Applicants complete Real-Person ID verification ($0 to them) and 40%+ TrueFit™ before entering Inbound Applications.
          </p>
          <button
            type="submit"
            disabled={minting || !canMint}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition"
          >
            {minting ? 'Generating Link...' : 'Generate Bridge Link'}
          </button>
        </div>
      </form>

      {freshLinkUrl && (
        <div className="rounded-2xl border-2 border-emerald-500/70 bg-emerald-50/70 dark:bg-emerald-950/30 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                ✅ Verified Hiring Bridge Link Ready ({freshRoleTitle})
              </p>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                Copy this link or ready-to-send message now—raw tokens are not stored in plain text once you leave this page.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
              <span className="rounded-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                0 Outbound Credits
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
              {copiedMode === 'url' ? 'Copied Link!' : 'Copy Bridge Link'}
            </button>
            <button
              type="button"
              onClick={() => copyText(buildReadyToSendMessage(freshLinkUrl), 'dm')}
              className="inline-flex items-center justify-center rounded-xl border border-emerald-600 dark:border-emerald-500 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-slate-800 px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-200 transition"
            >
              {copiedMode === 'dm' ? 'Copied Ready-to-Send Message!' : 'Copy Ready-to-Send Message'}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Issued Verified Hiring Bridge Links
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
            Loading Verified Hiring Bridge ledger...
          </p>
        ) : filteredLinks.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
            No Verified Hiring Bridge links in this filter yet.
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
                        Verified Hiring Bridge
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
