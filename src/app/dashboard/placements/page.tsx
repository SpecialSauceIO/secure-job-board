'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { getCandidatePlacements } from '@/app/dashboard/actions'
import SecureMessageThread from '@/components/SecureMessageThread'

type FilterTab = 'all' | 'proposed' | 'active' | 'completed'

function formatTrackLabel(track?: string | null, durationMonths?: number | null): string {
  if (track === 'fixed_term_w2') {
    const mos = Number(durationMonths) || 6
    return `Fixed-Term W-2 Contract (${mos} Mos)`
  }
  if (track === 'open_ended_w2') {
    return 'Open-Ended W-2 Contract'
  }
  return 'W-2 Contract-to-Hire ($0 Conversion)'
}

function formatStatusMeta(status?: string | null, bossStatusDisplay?: string | null) {
  switch (status) {
    case 'proposed':
      return {
        label: 'Offer Pending Review',
        badgeClass: 'bg-emerald-600 text-white border-emerald-700',
        dotClass: 'bg-amber-300 animate-pulse',
      }
    case 'accepted_pending_eor':
      return {
        label: bossStatusDisplay
          ? bossStatusDisplay.replace(/\bBOSS\s*/gi, '').replace(/\bEOR\b/g, 'W-2 Payroll')
          : 'Active W-2 Payroll Onboarding',
        badgeClass: 'bg-indigo-600 text-white border-indigo-700',
        dotClass: 'bg-emerald-300',
      }
    case 'converted_direct':
      return {
        label: 'Converted Full-Time Direct ($0 Fee)',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        dotClass: 'bg-emerald-600',
      }
    case 'ended':
      return {
        label: 'Engagement Completed',
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
        dotClass: 'bg-slate-500',
      }
    case 'declined':
      return {
        label: 'Offer Declined',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
        dotClass: 'bg-rose-500',
      }
    case 'withdrawn':
      return {
        label: 'Offer Withdrawn',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-300',
        dotClass: 'bg-slate-400',
      }
    default:
      return {
        label: 'W-2 Engagement',
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
        dotClass: 'bg-slate-500',
      }
  }
}

export default function ProfessionalPlacementsPage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  const loadPlacements = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    const res = await getCandidatePlacements()
    if (res.error) {
      setErrorMsg(res.error)
    } else {
      const list = Array.isArray(res.data) ? res.data : []
      setRecords(list)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadPlacements()
  }, [loadPlacements])

  const counts = useMemo(() => {
    const proposed = records.filter((r) => r.placement?.status === 'proposed').length
    const active = records.filter(
      (r) =>
        r.placement?.status === 'accepted_pending_eor' ||
        r.placement?.status === 'converted_direct'
    ).length
    const completed = records.filter(
      (r) =>
        r.placement?.status === 'ended' ||
        r.placement?.status === 'declined' ||
        r.placement?.status === 'withdrawn'
    ).length
    return { all: records.length, proposed, active, completed }
  }, [records])

  const filteredRecords = useMemo(() => {
    if (activeTab === 'proposed') {
      return records.filter((r) => r.placement?.status === 'proposed')
    }
    if (activeTab === 'active') {
      return records.filter(
        (r) =>
          r.placement?.status === 'accepted_pending_eor' ||
          r.placement?.status === 'converted_direct'
      )
    }
    if (activeTab === 'completed') {
      return records.filter(
        (r) =>
          r.placement?.status === 'ended' ||
          r.placement?.status === 'declined' ||
          r.placement?.status === 'withdrawn'
      )
    }
    return records
  }, [records, activeTab])

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-14">
      {/* Header */}
      <div className="bg-white rounded-2xl border-2 border-slate-300 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[11px] font-extrabold uppercase tracking-wider text-indigo-800 mb-2.5">
              <span className="h-2 w-2 rounded-full bg-indigo-600" />
              Protected W-2 Placements &amp; Payroll
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Placements
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Review protected W-2 Contract-to-Hire offers, track W-2 Payroll onboarding packets, and manage active engagements with $0 direct-hire conversion friction.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={loadPlacements}
              className="px-3.5 py-2 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors cursor-pointer"
            >
              Refresh Status
            </button>
            <Link
              href="/dashboard/profile"
              className="px-3.5 py-2 rounded-xl border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-bold text-indigo-900 transition-colors"
            >
              Profile &amp; Preferences →
            </Link>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-200">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Engagements
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{counts.all}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Pending Offers
            </p>
            <p className="text-2xl font-extrabold text-emerald-950 mt-1">{counts.proposed}</p>
          </div>
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
              Active / Converted
            </p>
            <p className="text-2xl font-extrabold text-indigo-950 mt-1">{counts.active}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Past / Closed
            </p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{counts.completed}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {([
          { key: 'all', label: `All (${counts.all})` },
          { key: 'proposed', label: `Offers Pending (${counts.proposed})` },
          { key: 'active', label: `Active & Direct (${counts.active})` },
          { key: 'completed', label: `Past / Closed (${counts.completed})` },
        ] as { key: FilterTab; label: string }[]).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border-2 transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-xs font-bold text-rose-900">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border-2 border-slate-300 p-10 text-center">
          <p className="text-sm font-bold text-slate-600">
            Loading your W-2 placements &amp; onboarding packets...
          </p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-slate-300 p-8 sm:p-10 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.75"
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              {records.length === 0
                ? 'No W-2 Placements Yet'
                : 'No Placements Match This Filter'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl mx-auto">
              When a Verified Employer extends a protected W-2 Contract-to-Hire or W-2 Contract offer inside your conversation thread, your pay rate, start date, and W-2 onboarding packet appear right here.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard/requests"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition-colors"
            >
              Check Professional Invitations →
            </Link>
            <Link
              href="/dashboard/jobs"
              className="px-4 py-2 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-extrabold transition-colors"
            >
              Browse Protected Roles →
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredRecords.map((item) => {
            const p = item.placement || {}
            const statusMeta = formatStatusMeta(
              p.status,
              p.boss_placement_status_display
            )
            const trackLabel = formatTrackLabel(p.contract_track, p.duration_months)
            const payRate = Number(p.hourly_pay_rate || 0)
            const weeklyHours = Number(p.weekly_hours || 40)
            const estWeeklyGross = Math.round(payRate * weeklyHours * 100) / 100
            const isExpanded = Boolean(expandedIds[item.id])

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border-2 border-slate-300 shadow-xs overflow-hidden"
              >
                <div className="p-5 sm:p-6 space-y-5">
                  {/* Card Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${statusMeta.badgeClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
                          {statusMeta.label}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-300 text-[11px] font-bold text-slate-800">
                          {trackLabel}
                        </span>
                        {p.eor_packet_id && (
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-[11px] font-mono font-extrabold text-indigo-900">
                            Packet {p.eor_packet_id}
                          </span>
                        )}
                        {item.has_unread && (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-300 text-[11px] font-extrabold text-amber-950">
                            Unread Message
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-extrabold text-slate-900 pt-1">
                        {item.job_title}
                      </h2>
                      <p className="text-xs sm:text-sm font-semibold text-slate-600">
                        {item.employer_name}
                        {item.employer_domain ? ` (${item.employer_domain})` : ''} • Ref {item.reference_id}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpanded(item.id)}
                      className="self-start px-3.5 py-2 rounded-xl border-2 border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-extrabold text-slate-900 transition-colors cursor-pointer"
                    >
                      {isExpanded
                        ? 'Hide Offer & Thread'
                        : p.status === 'proposed'
                        ? 'Review & Accept Offer →'
                        : 'Open Placement & Thread →'}
                    </button>
                  </div>

                  {/* Terms Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        Gross W-2 Pay Rate
                      </p>
                      <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                        ${payRate.toFixed(2)}/hr
                      </p>
                      <p className="text-[11px] font-semibold text-slate-600">
                        ~${estWeeklyGross.toLocaleString()}/wk ({weeklyHours} hrs/wk)
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        Target Start &amp; State
                      </p>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5">
                        {p.target_start_date || 'TBD'}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-600">
                        Work State: {p.work_state || 'US'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        Direct Conversion Fee
                      </p>
                      <p className="text-base font-extrabold text-emerald-800 mt-0.5">
                        ${Number(p.conversion_fee_usd || 0).toLocaleString()}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-600">
                        Zero agency buyout penalty
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        Onboarding &amp; Equipment
                      </p>
                      <p className="text-xs font-extrabold text-slate-900 mt-0.5 line-clamp-2">
                        {p.boss_associate_onboarded
                          ? 'W-2 Payroll Onboarded'
                          : p.eor_packet_id
                          ? `Queued (${p.eor_packet_id})`
                          : 'Awaiting Offer Acceptance'}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-600 truncate">
                        {(p.equipment_policy || 'Standard Equipment Policy').replace('Request EOR Managed Laptop Add-On', 'Request Managed Laptop Add-On')}
                      </p>
                    </div>
                  </div>

                  {/* Additional EOR Metadata Bar */}
                  {(p.supervisor_name || p.timecard_approver_name || p.scope_note) && (
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-3 text-xs text-slate-700 space-y-1">
                      <div className="flex flex-wrap gap-x-5 gap-y-1">
                        {p.supervisor_name && (
                          <span>
                            <strong className="text-slate-900">Supervisor:</strong> {p.supervisor_name}
                          </span>
                        )}
                        {p.timecard_approver_name && (
                          <span>
                            <strong className="text-slate-900">Timecard Approver:</strong>{' '}
                            {p.timecard_approver_name}
                          </span>
                        )}
                        {(p.require_background_check || p.require_drug_screening) && (
                          <span>
                            <strong className="text-slate-900">Screenings:</strong>{' '}
                            {[
                              p.require_background_check ? 'Background Check' : null,
                              p.require_drug_screening ? 'Drug Screening' : null,
                            ]
                              .filter(Boolean)
                              .join(' + ')}
                          </span>
                        )}
                      </div>
                      {p.scope_note && (
                        <p className="text-slate-700 pt-0.5">
                          <strong className="text-slate-900">Engagement Scope:</strong> {p.scope_note}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Expandable Live Placement & Message Thread */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-200">
                      <SecureMessageThread
                        applicationId={item.id}
                        referenceId={item.reference_id}
                        viewerRole="professional"
                        initialMessages={item.messages}
                        initialVaultReleased={item.vault_released}
                        employerName={item.employer_name}
                        employerDomain={item.employer_domain}
                        candidateFullName={item.professional_full_name}
                        candidateEmail={item.professional_email}
                        employerEmail={item.employer_email}
                        initialTrialToHire={item.placement}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
