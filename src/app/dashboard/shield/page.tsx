'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  getProfessionalShieldLinksAction,
  createProfessionalShieldLinkAction,
  revokeProfessionalShieldLinkAction,
} from '@/app/dashboard/actions'
import type { ProfessionalShieldLinkView } from '@/lib/inbound-shield'

export default function InboundShieldPage() {
  const [links, setLinks] = useState<ProfessionalShieldLinkView[]>([])
  const [isVerified, setIsVerified] = useState(true)
  const [isDiscoverable, setIsDiscoverable] = useState(true)
  const [loading, setLoading] = useState(true)
  const [privateMemo, setPrivateMemo] = useState('')
  const [ttlDays, setTtlDays] = useState<number>(14)
  const [minting, setMinting] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [freshLinkUrl, setFreshLinkUrl] = useState<string | null>(null)
  const [freshLinkMemo, setFreshLinkMemo] = useState<string>('')
  const [copiedMode, setCopiedMode] = useState<'url' | 'dm' | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'redeemed' | 'inactive'>('all')

  const loadShieldState = useCallback(async () => {
    const res = await getProfessionalShieldLinksAction()
    if (res.error) {
      setErrorMsg(res.error)
    } else {
      setLinks(res.links || [])
      setIsVerified(Boolean(res.isVerified))
      setIsDiscoverable(res.isDiscoverable !== false)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadShieldState()
  }, [loadShieldState])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setCopiedMode(null)
    setMinting(true)
    const res = await createProfessionalShieldLinkAction({
      privateMemo,
      ttlDays,
    })
    setMinting(false)
    if (res.error || !res.token || !res.record) {
      setErrorMsg(res.error || 'Unable to create one-time verification link.')
      return
    }
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://www.specialsauce.io'
    setFreshLinkUrl(`${origin}/shield/${res.token}`)
    setFreshLinkMemo(res.record.private_memo || '')
    setPrivateMemo('')
    setLinks((prev) => [res.record!, ...prev])
  }

  const handleRevoke = async (linkId: string) => {
    setErrorMsg(null)
    setRevokingId(linkId)
    const res = await revokeProfessionalShieldLinkAction(linkId)
    setRevokingId(null)
    if (res.error) {
      setErrorMsg(res.error)
      return
    }
    const nowIso = new Date().toISOString()
    setLinks((prev) =>
      prev.map((item) =>
        item.id === linkId ? { ...item, status: 'revoked', revoked_at: nowIso } : item
      )
    )
    await loadShieldState()
  }

  const buildRecruiterReplySnippet = (url: string) =>
    `Thanks for reaching out! To keep external recruiting messages organized and spam-free, I review new opportunities through SpecialSauce.io (The World's First Secured Workforce Ecosystem). You can verify and share the role details through this one-time link: ${url}`

  const copyText = async (text: string, mode: 'url' | 'dm') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMode(mode)
      setTimeout(() => setCopiedMode(null), 2500)
    } catch {
      setErrorMsg('Clipboard permission blocked. Please highlight and copy the link manually.')
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

  if (Boolean(links)) {
    redirect('/dashboard/requests')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            🛡️ Personal Inbound Shield • Zero-Correlation One-Time Links
          </span>
          <Link
            href="/dashboard/support?tab=security"
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            How our privacy architecture works →
          </Link>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Inbound Shield
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          Gate cold recruiter messages on LinkedIn, email, or text without revealing your profile or employment status. Each one-time link contains zero personal or account identifiers, works for a single verified invitation, and cannot be connected back to you or matched against any other link you share.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. Mint a Single-Use Link
            </p>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              Add an optional private note only you can see (such as where the recruiter messaged you) and generate a fresh one-time link.
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              2. Recruiter Verifies First
            </p>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              Opening the link shows zero details about you. The recruiter must verify their company and real-person ID to submit a live Protected Role.
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              3. Link Burns Automatically
            </p>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              Once a verified Protected Role arrives in your Professional Invitations inbox, the link burns permanently. Your personal info stays private until you unlock it.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/60 px-4 py-3 text-xs text-slate-700 dark:text-slate-300">
          <span>
            <strong className="font-semibold text-slate-900 dark:text-white">
              Employer Search Visibility:{" "}
              {isDiscoverable ? 'Visible (Anonymous Profile)' : 'Hidden from Employer Search'}
            </strong>{" "}
            — Your one-time Inbound Shield links work even when your profile is hidden from Employer Search.
          </span>
          <Link
            href="/dashboard/preferences"
            className="font-semibold text-indigo-700 dark:text-indigo-300 hover:underline"
          >
            Manage Visibility & Preferences →
          </Link>
        </div>
      </div>

      {!isVerified && !loading && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-amber-950 dark:text-amber-200">
              One-Time $5 Verification Required
            </h2>
            <p className="mt-1 text-sm text-amber-900/90 dark:text-amber-200/80">
              Complete your one-time $5 Explorer ID verification ($0/mo forever, and 100% credited toward Month 1 if you ever upgrade) to generate Inbound Shield links.
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="shrink-0 inline-flex items-center justify-center rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition"
          >
            Complete Verification →
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
            Generate a One-Time Verification Link
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Create a dedicated burner link for a single recruiter conversation. Active limit: up to 25 unused links at a time.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-1.5">
              Private Context Note (Only Visible to You)
            </label>
            <input
              type="text"
              maxLength={100}
              value={privateMemo}
              onChange={(e) => setPrivateMemo(e.target.value)}
              placeholder="e.g., LinkedIn DM — Cloud Security Director recruiter"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-1.5">
              Auto-Expire If Unused
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

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            🔒 Your private note is encrypted and never shared with the recruiter.
          </p>
          <button
            type="submit"
            disabled={minting || !isVerified}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition cursor-pointer"
          >
            {minting ? 'Generating Link...' : '+ Generate One-Time Link'}
          </button>
        </div>
      </form>

      {freshLinkUrl && (
        <div className="rounded-2xl border-2 border-emerald-500/80 bg-emerald-50/70 dark:bg-emerald-950/30 p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <span className="inline-flex items-center rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white">
                Ready to Share • Copy Now
              </span>
              <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                Your One-Time Inbound Shield Link{freshLinkMemo ? ` (${freshLinkMemo})` : ''}
              </h3>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                For your security, SpecialSauce never stores raw link URLs after creation—copy this link or reply message before leaving the page.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-950 px-4 py-3 font-mono text-xs sm:text-sm text-slate-900 dark:text-emerald-200 break-all select-all">
            {freshLinkUrl}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => copyText(freshLinkUrl, 'url')}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition cursor-pointer"
            >
              {copiedMode === 'url' ? '✓ Link Copied' : 'Copy One-Time Link'}
            </button>
            <button
              type="button"
              onClick={() => copyText(buildRecruiterReplySnippet(freshLinkUrl), 'dm')}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer"
            >
              {copiedMode === 'dm' ? '✓ Recruiter Reply Copied' : 'Copy Ready-to-Send Recruiter Reply'}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Your Inbound Shield Links
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Track which external recruiter conversations verified and delivered a Protected Role.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {([
              ['all', `All (${counts.all})`],
              ['active', `Active (${counts.active})`],
              ['redeemed', `Used (${counts.redeemed})`],
              ['inactive', `Burned / Expired (${counts.inactive})`],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  statusFilter === key
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
            Loading your Inbound Shield ledger...
          </p>
        ) : filteredLinks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No Inbound Shield links in this view yet.
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Generate a one-time link above whenever an external recruiter reaches out.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredLinks.map((item) => (
              <div
                key={item.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.status === 'active' && (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                        Active • Single Use
                      </span>
                    )}
                    {item.status === 'redeemed' && (
                      <span className="inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-950/70 border border-indigo-300 dark:border-indigo-800 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 dark:text-indigo-300">
                        ✓ Used • Verified Invitation Delivered
                      </span>
                    )}
                    {item.status === 'revoked' && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Burned by You
                      </span>
                    )}
                    {item.status === 'expired' && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                        Expired Unused
                      </span>
                    )}
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {item.private_memo || 'Unlabeled One-Time Link'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Created {new Date(item.created_at).toLocaleDateString()} •{" "}
                    {item.status === 'redeemed' && item.redeemed_at
                      ? `Verified & burned on ${new Date(item.redeemed_at).toLocaleDateString()}`
                      : item.status === 'revoked' && item.revoked_at
                        ? `Burned on ${new Date(item.revoked_at).toLocaleDateString()}`
                        : `Expires ${new Date(item.expires_at).toLocaleDateString()}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {item.status === 'redeemed' && (
                    <Link
                      href="/dashboard/requests"
                      className="inline-flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 transition">
                      Open Invitation →
                    </Link>
                  )}
                  {item.status === 'active' && (
                    <button
                      type="button"
                      disabled={revokingId === item.id}
                      onClick={() => handleRevoke(item.id)}
                      className="inline-flex items-center justify-center rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 transition cursor-pointer"
                    >
                      {revokingId === item.id ? 'Burning...' : 'Burn Link'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
