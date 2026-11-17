'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { SubmitButton } from '@/components/SubmitButton'
import {
  STANDARD_INDUSTRY_VERTICALS,
  normalizeIndustryVertical,
} from '@/constants/industries'

type EmployerJobSortOption =
  | 'closing_soon'
  | 'newest'
  | 'applicants_high'
  | 'pay_high'
  | 'pay_low'
  | 'status_active'

const EMPLOYMENT_TYPES = [
  'Full-Time (W-2)',
  'Contract-to-Hire',
  'Contract (W-2 Fixed-Term)',
  'Contract (W-2 Open-Ended)',
  'Contract (1099 / Corp-to-Corp)',
  'Part-Time',
  'Seasonal / Temporary',
]

export interface ActiveW2EngagementSummary {
  applicationId: string
  professionalLabel: string
  status: string
  contractTrack: string
  durationMonths: number | null
  extensionCount: number
  hourlyPayRate: number
  employerBillRate: number
  targetStartDate: string
  equipmentPolicy: string
  equipmentReturnStatus: string
}

export interface EnrichedEmployerJobRow {
  id: string
  title: string
  work_model: string
  created_at: string
  is_active: boolean
  salary_min: number | null
  salary_max: number | null
  pay_type: 'annual' | 'hourly'
  formattedPay: string
  annualizedMaxPay: number
  annualizedMinPay: number
  location: string
  employmentType: string
  industry: string
  applicantCount: number
  unactionedApplicantCount: number
  renewalCount: number
  maxRenewals: number
  inRenewalWindow: boolean
  daysRemaining: number
  isExpired: boolean
  expiresAtIso: string
  renewedAtIso: string | null
  skillsString: string
  isPracticeDraft?: boolean
  eorContractTrack?: string
  eorDurationMonths?: number
  equipmentPolicy?: string
  equipmentNotes?: string
  w2Engagements?: ActiveW2EngagementSummary[]
}

export default function EmployerJobsTableClient({
  jobs,
  activeJobsCount,
  maxActiveJobs,
  slotsFull,
  isPracticeMode = false,
  toggleOrRenewJobStatus,
  manageActiveW2Engagement,
}: {
  jobs: EnrichedEmployerJobRow[]
  activeJobsCount: number
  maxActiveJobs: number
  slotsFull: boolean
  isPracticeMode?: boolean
  toggleOrRenewJobStatus: (formData: FormData) => Promise<void>
  manageActiveW2Engagement?: (formData: FormData) => Promise<void>
}) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>(
    'all'
  )
  const [industryFilter, setIndustryFilter] = useState<string>('all')
  const [employmentTypeFilter, setEmploymentTypeFilter] =
    useState<string>('all')
  const [sortBy, setSortBy] = useState<EmployerJobSortOption>('closing_soon')
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingContractConfirm, setPendingContractConfirm] = useState<{
    jobTitle: string
    eng: ActiveW2EngagementSummary
    action: 'extend_90d' | 'convert_direct' | 'wrap_up_assignment' | 'mark_gear_returned' | 'request_gear_return' | 'reopen_assignment'
  } | null>(null)
  const [confirmIntentChecked, setConfirmIntentChecked] = useState(false)
  const [pendingRoleDelete, setPendingRoleDelete] = useState<EnrichedEmployerJobRow | null>(null)
  const [confirmRoleDeleteChecked, setConfirmRoleDeleteChecked] = useState(false)

  const getRoleDeleteBlockReason = (job: EnrichedEmployerJobRow): string | null => {
    if ((job.w2Engagements || []).some((e) => e.status === 'accepted_pending_eor')) {
      return 'Wrap up or convert the active W-2 assignment before deleting this role.'
    }
    if ((job.w2Engagements || []).some((e) => e.equipmentReturnStatus === 'return_requested')) {
      return 'Confirm hardware return before deleting this role.'
    }
    if (job.unactionedApplicantCount > 0) {
      return 'Reply to or decline waiting applicants before deleting this role.'
    }
    return null
  }

  const openRoleDeleteConfirm = (job: EnrichedEmployerJobRow) => {
    setConfirmRoleDeleteChecked(false)
    setPendingRoleDelete(job)
  }

  const openContractConfirm = (
    jobTitle: string,
    eng: ActiveW2EngagementSummary,
    action: 'extend_90d' | 'convert_direct' | 'wrap_up_assignment' | 'mark_gear_returned' | 'request_gear_return' | 'reopen_assignment'
  ) => {
    setConfirmIntentChecked(false)
    setPendingContractConfirm({ jobTitle, eng, action })
  }

  const activeCount = useMemo(
    () => jobs.filter((j) => j.is_active).length,
    [jobs]
  )
  const closedCount = useMemo(
    () => jobs.filter((j) => !j.is_active).length,
    [jobs]
  )

  const filteredAndSortedJobs = useMemo(() => {
    const filtered = jobs.filter((job) => {
      if (statusFilter === 'active' && !job.is_active) return false
      if (statusFilter === 'closed' && job.is_active) return false

      if (industryFilter !== 'all') {
        const normInd = job.industry
          ? normalizeIndustryVertical(job.industry)
          : ''
        if (normInd.toLowerCase() !== industryFilter.toLowerCase()) {
          return false
        }
      }

      if (employmentTypeFilter !== 'all') {
        if (
          !job.employmentType
            .toLowerCase()
            .includes(employmentTypeFilter.toLowerCase())
        ) {
          return false
        }
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim()
        const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const shortWordRx =
          q.length <= 3
            ? new RegExp(`(^|[^a-z0-9])${escapedQ}([^a-z0-9]|$)`, 'i')
            : null
        const matchesText = (val: string) => {
          const str = String(val || '').toLowerCase()
          if (!str) return false
          return shortWordRx ? shortWordRx.test(str) : str.includes(q)
        }
        const titleMatch = matchesText(job.title)
        const locMatch = matchesText(job.location)
        const indMatch = matchesText(job.industry)
        const empMatch = matchesText(job.employmentType)
        const skillMatch = matchesText(job.skillsString)
        if (!titleMatch && !locMatch && !indMatch && !empMatch && !skillMatch) {
          return false
        }
      }

      return true
    })

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'closing_soon': {
          if (a.is_active !== b.is_active) return a.is_active ? -1 : 1
          if (a.is_active && b.is_active) {
            return a.daysRemaining - b.daysRemaining
          }
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        }
        case 'newest': {
          const aTime = new Date(a.renewedAtIso || a.created_at).getTime()
          const bTime = new Date(b.renewedAtIso || b.created_at).getTime()
          return bTime - aTime
        }
        case 'applicants_high':
          return b.applicantCount - a.applicantCount
        case 'pay_high':
          return b.annualizedMaxPay - a.annualizedMaxPay
        case 'pay_low': {
          const aMin = a.annualizedMinPay || Number.MAX_SAFE_INTEGER
          const bMin = b.annualizedMinPay || Number.MAX_SAFE_INTEGER
          return aMin - bMin
        }
        case 'status_active': {
          if (a.is_active !== b.is_active) return a.is_active ? -1 : 1
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        }
        default:
          return 0
      }
    })
  }, [
    jobs,
    statusFilter,
    industryFilter,
    employmentTypeFilter,
    sortBy,
    searchQuery,
  ])

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-300 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-300'
              }`}
            >
              All Roles ({jobs.length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-300'
              }`}
            >
              Active ({activeCount})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('closed')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'closed'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-300'
              }`}
            >
              Closed / Expired ({closedCount})
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1 min-w-0">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roles by title, US metro, skill, or certification..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-slate-300 bg-slate-50 text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            {(statusFilter !== 'all' ||
              industryFilter !== 'all' ||
              employmentTypeFilter !== 'all' ||
              searchQuery.trim() !== '') && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all')
                  setIndustryFilter('all')
                  setEmploymentTypeFilter('all')
                  setSearchQuery('')
                }}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-300 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-3 flex items-center gap-2">
            <label
              htmlFor="manage-jobs-industry"
              className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap shrink-0"
            >
              Industry:
            </label>
            <select
              id="manage-jobs-industry"
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Industries</option>
              {STANDARD_INDUSTRY_VERTICALS.map((vertical) => (
                <option key={vertical} value={vertical}>
                  {vertical}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <label
              htmlFor="manage-jobs-emp-type"
              className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap shrink-0"
            >
              Type:
            </label>
            <select
              id="manage-jobs-emp-type"
              value={employmentTypeFilter}
              onChange={(e) => setEmploymentTypeFilter(e.target.value)}
              className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Employment Types</option>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-5 flex items-center gap-2">
            <label
              htmlFor="manage-jobs-sort"
              className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap shrink-0"
            >
              Sort:
            </label>
            <select
              id="manage-jobs-sort"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as EmployerJobSortOption)
              }
              className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="closing_soon">
                Closing Soonest (30-Day Countdown)
              </option>
              <option value="newest">Newest Posted / Renewed First</option>
              <option value="applicants_high">Most Applicants First</option>
              <option value="pay_high">
                Highest Compensation ($/yr &amp; $/hr)
              </option>
              <option value="pay_low">Lowest Compensation First</option>
              <option value="status_active">Active Status First</option>
            </select>
          </div>

          <div className="md:col-span-1 text-right whitespace-nowrap">
            <span className="text-xs font-bold text-slate-500">
              Showing{' '}
              <strong className="text-slate-900">
                {filteredAndSortedJobs.length}
              </strong>{' '}
              of {jobs.length}
            </span>
          </div>
        </div>
      </div>

      {/* Jobs Table or Empty Filter State */}
      {filteredAndSortedJobs.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border-2 border-slate-300 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-700 mb-2">
            No roles match your current filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all')
              setIndustryFilter('all')
              setEmploymentTypeFilter('all')
              setSearchQuery('')
            }}
            className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-extrabold hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            Reset Filters →
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm overflow-hidden">
          {/* Mobile Stacked Cards */}
          <div className="md:hidden divide-y divide-slate-300">
            {filteredAndSortedJobs.map((job) => {
              const isExpiringSoon =
                job.is_active && !job.isExpired && job.daysRemaining <= 7
              return (
                <div key={job.id} className="p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-extrabold text-slate-900 text-sm leading-snug">
                      {job.title}
                    </p>
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-black shrink-0">
                      {job.formattedPay}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 font-medium">
                    {job.industry && (
                      <span className="font-bold text-slate-700">{job.industry}</span>
                    )}
                    <span className="font-semibold text-slate-700 capitalize">
                      • {job.work_model}
                    </span>
                    {job.employmentType && <span>• {job.employmentType}</span>}
                    {job.location && <span>• {job.location}</span>}
                  </div>

                  {((job.eorContractTrack && job.eorContractTrack !== 'none') || (job.equipmentPolicy && job.equipmentPolicy !== 'No Equipment Needed / Not Applicable')) && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {job.eorContractTrack && job.eorContractTrack !== 'none' && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-bold text-indigo-800">
                          🛡️{' '}
                          {job.eorContractTrack === 'fixed_term_w2'
                            ? `${job.eorDurationMonths || 6}-Mo Fixed-Term W-2 (+28% EOR)`
                            : job.eorContractTrack === 'open_ended_w2'
                            ? 'Open-Ended W-2 Contract (+28% EOR)'
                            : '90-Day W-2 Trial ($0 Conversion)'}
                        </span>
                      )}
                      {job.equipmentPolicy && job.equipmentPolicy !== 'No Equipment Needed / Not Applicable' && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-300 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          💻 {job.equipmentPolicy.replace(' (Laptop / Security Key)', '').replace(' (Virtual Desktop & Passkey Only)', '')}
                        </span>
                      )}
                    </div>
                  )}

                  {job.eorContractTrack && job.eorContractTrack !== 'none' && (!job.w2Engagements || job.w2Engagements.length === 0) && (
                    <div className="rounded-lg border border-indigo-200/80 bg-indigo-50/40 px-2.5 py-1.5 text-[11px] flex flex-wrap items-center justify-between gap-1.5">
                      <span className="font-semibold text-slate-600">
                        <strong className="text-indigo-900">W-2 Lifecycle Controls:</strong> Unlocks on active W-2 offer
                      </span>
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-400">Extend +90d</span>
                        <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-400">Convert ($0)</span>
                        <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-400">Wrap Up</span>
                      </div>
                    </div>
                  )}

                  {manageActiveW2Engagement && Array.isArray(job.w2Engagements) && job.w2Engagements.length > 0 && (
                    <div className="space-y-2">
                      {job.w2Engagements.map((eng) => (
                        <div key={eng.applicationId} className="rounded-lg border border-indigo-200 bg-indigo-50/50 px-2.5 py-2 text-xs space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span className="font-extrabold text-indigo-950">{eng.professionalLabel}</span>
                            <span className="rounded bg-white border border-indigo-200 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                              {eng.status === 'proposed' ? 'Offer Pending Review' : eng.status === 'converted_direct' ? 'Converted Direct ($0 Fee)' : eng.status === 'ended' ? 'Assignment Wrapped Up' : `Active W-2${eng.extensionCount > 0 ? ` (+${eng.extensionCount * 90}d Ext)` : ''}`}
                            </span>
                          </div>
                          {eng.status === 'accepted_pending_eor' && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button type="button" onClick={() => openContractConfirm(job.title, eng, 'extend_90d')} className="px-2 py-1 rounded bg-white border border-indigo-300 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 cursor-pointer">Extend +90d</button>
                              <button type="button" onClick={() => openContractConfirm(job.title, eng, 'convert_direct')} className="px-2 py-1 rounded bg-emerald-600 text-[11px] font-bold text-white hover:bg-emerald-700 cursor-pointer">Convert Direct ($0)</button>
                              <button type="button" onClick={() => openContractConfirm(job.title, eng, 'wrap_up_assignment')} className="px-2 py-1 rounded bg-white border border-slate-300 text-[11px] font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-700 cursor-pointer">Wrap Up</button>
                            </div>
                          )}
                          {(eng.status === 'converted_direct' || eng.status === 'ended' || eng.equipmentReturnStatus === 'return_requested' || eng.equipmentReturnStatus === 'returned') && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {eng.equipmentReturnStatus === 'return_requested' && (
                                <span className="rounded bg-amber-100 border border-amber-300 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-900">📦 Hardware Return Pending</span>
                              )}
                              {eng.equipmentReturnStatus === 'returned' && (
                                <span className="rounded bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">✓ Hardware Returned</span>
                              )}
                              {eng.status === 'converted_direct' && (
                                <button type="button" onClick={() => openContractConfirm(job.title, eng, 'wrap_up_assignment')} className="px-2 py-1 rounded bg-white border border-slate-300 text-[11px] font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-700 cursor-pointer">Wrap Up</button>
                              )}
                              {eng.equipmentReturnStatus === 'return_requested' && (
                                <button type="button" onClick={() => openContractConfirm(job.title, eng, 'mark_gear_returned')} className="px-2 py-1 rounded bg-amber-600 text-[11px] font-bold text-white hover:bg-amber-700 cursor-pointer">Confirm Gear Returned</button>
                              )}
                              {eng.status === 'ended' && eng.equipmentReturnStatus !== 'return_requested' && eng.equipmentReturnStatus !== 'returned' && (
                                <button type="button" onClick={() => openContractConfirm(job.title, eng, 'request_gear_return')} className="px-2 py-1 rounded bg-amber-50 border border-amber-300 text-[11px] font-bold text-amber-900 hover:bg-amber-100 cursor-pointer">Request Gear Return</button>
                              )}
                              {eng.status === 'ended' && (
                                <button type="button" onClick={() => openContractConfirm(job.title, eng, 'reopen_assignment')} className="px-2 py-1 rounded bg-white border border-indigo-300 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 cursor-pointer">Reopen W-2</button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
                    <div className="flex flex-col gap-0.5">
                      {job.is_active ? (
                        <span className="inline-flex items-center gap-1.5 font-extrabold text-emerald-700">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          Active ({job.daysRemaining}d left)
                        </span>
                      ) : job.isPracticeDraft ? (
                        <span className="inline-flex items-center gap-1.5 font-extrabold text-indigo-700">
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          Practice Draft
                        </span>
                      ) : job.isExpired ? (
                        <span className="inline-flex items-center gap-1.5 font-extrabold text-amber-700">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          Expired (30d Limit)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-bold text-slate-500">
                          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                          Closed
                        </span>
                      )}
                      {job.is_active && (
                        <span className={`text-[11px] font-semibold ${isExpiringSoon ? 'text-amber-700' : 'text-slate-400'}`}>
                          Closes {new Date(job.expiresAtIso).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <Link
                      href="/dashboard/employer/applications"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 font-bold text-slate-800"
                    >
                      <span className="font-extrabold">{job.applicantCount}</span>
                      <span className="text-slate-500">
                        {job.applicantCount === 1 ? 'applicant' : 'applicants'}
                      </span>
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 sm:flex items-center gap-2 pt-1">
                    <Link
                      href={`/dashboard/employer/jobs/${job.id}/edit`}
                      className="px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 text-center"
                    >
                      Edit Role
                    </Link>

                    {job.is_active && (
                      job.renewalCount >= job.maxRenewals ? (
                        <span
                          title="Maximum of 2 consecutive renewals (90 days total) reached for this listing."
                          className="w-full px-3 py-2 text-xs font-bold text-slate-400 bg-slate-100 border border-slate-300 rounded-xl text-center select-none cursor-not-allowed"
                        >
                          🔒 Max 2 Renewals Used
                        </span>
                      ) : job.unactionedApplicantCount > 0 ? (
                        <Link
                          href="/dashboard/employer/applications"
                          title="Please message or decline waiting applicants on this role before renewing."
                          className="w-full px-3 py-2 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 rounded-xl text-center"
                        >
                          ⚡ Reply to {job.unactionedApplicantCount} Applicant{job.unactionedApplicantCount === 1 ? '' : 's'} to Renew
                        </Link>
                      ) : !job.inRenewalWindow ? (
                        <span
                          title={`Renewals open during the final 5 days of a listing (Days 25–30). Opens in ${job.daysRemaining - 5} day(s).`}
                          className="w-full px-3 py-2 text-xs font-bold text-slate-400 bg-slate-100 border border-slate-300 rounded-xl text-center select-none cursor-not-allowed"
                        >
                          🔒 Renews at ≤5d ({job.renewalCount}/{job.maxRenewals})
                        </span>
                      ) : (
                        <form action={toggleOrRenewJobStatus} className="w-full">
                          <input type="hidden" name="job_id" value={job.id} />
                          <input type="hidden" name="action_type" value="renew" />
                          <input type="hidden" name="current_status" value="true" />
                          <SubmitButton
                            pendingText="Renewing..."
                            className="w-full px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer"
                          >
                            ↻ Renew +30d ({job.renewalCount}/{job.maxRenewals})
                          </SubmitButton>
                        </form>
                      )
                    )}

                    <form
                      action={toggleOrRenewJobStatus}
                      className={job.is_active ? 'col-span-2' : 'w-full'}
                    >
                      <input type="hidden" name="job_id" value={job.id} />
                      <input
                        type="hidden"
                        name="current_status"
                        value={job.is_active.toString()}
                      />
                      {job.is_active ? (
                        <>
                          <input type="hidden" name="action_type" value="close" />
                          <SubmitButton
                            pendingText="..."
                            className="w-full px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                          >
                            Close Listing
                          </SubmitButton>
                        </>
                      ) : isPracticeMode ? (
                        <Link
                          href="/dashboard/employer/billing"
                          className="block w-full text-center px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-300 rounded-xl hover:bg-indigo-100"
                        >
                          Activate Plan to Publish →
                        </Link>
                      ) : slotsFull ? (
                        <Link
                          href="/dashboard/employer/billing"
                          className="block w-full text-center px-3 py-2 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 rounded-xl"
                        >
                          Slots Full · Upgrade
                        </Link>
                      ) : (
                        <>
                          <input type="hidden" name="action_type" value="renew" />
                          <SubmitButton
                            pendingText={job.isPracticeDraft ? 'Publishing...' : 'Renewing...'}
                            className="w-full px-3 py-2 text-xs font-extrabold text-white bg-slate-900 rounded-xl hover:bg-indigo-600 cursor-pointer"
                          >
                            {job.isPracticeDraft ? 'Publish Live (30d)' : '↻ Reopen (+30d)'}
                          </SubmitButton>
                        </>
                      )}
                    </form>
                  </div>
                  <div className="pt-1 flex justify-end">
                    {(() => {
                      const blockReason = getRoleDeleteBlockReason(job)
                      return blockReason ? (
                        <span
                          title={blockReason}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded-lg select-none cursor-not-allowed"
                        >
                          🔒 Delete Protected
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openRoleDeleteConfirm(job)}
                          className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 hover:border-rose-300 transition-colors cursor-pointer"
                        >
                          Delete Role
                        </button>
                      )
                    })()}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-300">
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Role, Pay Band &amp; Details
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Status &amp; 30-Day Window
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Applicants
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {filteredAndSortedJobs.map((job) => {
                  const isExpiringSoon =
                    job.is_active && !job.isExpired && job.daysRemaining <= 7

                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <p className="font-extrabold text-slate-900">
                            {job.title}
                          </p>
                          <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-black">
                            {job.formattedPay}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs text-slate-500 font-medium">
                          {job.industry && (
                            <>
                              <span className="font-bold text-slate-700">
                                {job.industry}
                              </span>
                              <span className="text-slate-300">•</span>
                            </>
                          )}
                          <span className="font-semibold text-slate-700 capitalize">
                            {job.work_model}
                          </span>
                          {job.employmentType && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span>{job.employmentType}</span>
                            </>
                          )}
                          {job.location && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span>{job.location}</span>
                            </>
                          )}
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400">
                            Posted{' '}
                            {new Date(job.created_at).toLocaleDateString()}
                          </span>
                          {job.renewedAtIso && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-indigo-600 font-semibold">
                                Renewed{' '}
                                {new Date(
                                  job.renewedAtIso
                                ).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>

                        {((job.eorContractTrack && job.eorContractTrack !== 'none') || (job.equipmentPolicy && job.equipmentPolicy !== 'No Equipment Needed / Not Applicable')) && (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {job.eorContractTrack && job.eorContractTrack !== 'none' && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-bold text-indigo-800">
                                🛡️{' '}
                                {job.eorContractTrack === 'fixed_term_w2'
                                  ? `${job.eorDurationMonths || 6}-Mo Fixed-Term W-2 (+28% EOR)`
                                  : job.eorContractTrack === 'open_ended_w2'
                                  ? 'Open-Ended W-2 Contract (+28% EOR)'
                                  : '90-Day W-2 Trial ($0 Conversion)'}
                              </span>
                            )}
                            {job.equipmentPolicy && job.equipmentPolicy !== 'No Equipment Needed / Not Applicable' && (
                              <span
                                title={job.equipmentNotes || job.equipmentPolicy}
                                className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-300 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                                💻 {job.equipmentPolicy.replace(' (Laptop / Security Key)', '').replace(' (Virtual Desktop & Passkey Only)', '')}
                              </span>
                            )}
                          </div>
                        )}

                        {job.eorContractTrack && job.eorContractTrack !== 'none' && (!job.w2Engagements || job.w2Engagements.length === 0) && (
                          <div className="mt-2 rounded-lg border border-indigo-200/80 bg-indigo-50/40 px-3 py-1.5 text-[11px] flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-slate-600">
                              <strong className="text-indigo-900">W-2 Lifecycle Controls Ready:</strong> Unlocks here once a W-2 offer is accepted.
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-400">Extend +90d</span>
                              <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-400">Convert Direct ($0)</span>
                              <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-400">Wrap Up &amp; Gear</span>
                            </div>
                          </div>
                        )}

                        {manageActiveW2Engagement && Array.isArray(job.w2Engagements) && job.w2Engagements.length > 0 && (
                          <div className="mt-2.5 space-y-2">
                            {job.w2Engagements.map((eng) => (
                              <div
                                key={eng.applicationId}
                                className="rounded-lg border border-indigo-200 bg-indigo-50/50 px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-2"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-extrabold text-indigo-950">
                                      {eng.professionalLabel}
                                    </span>
                                    <span className="rounded bg-white border border-indigo-200 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                                      {eng.status === 'proposed'
                                        ? 'Offer Pending Review'
                                        : eng.status === 'converted_direct'
                                        ? 'Converted Direct ($0 Fee)'
                                        : eng.status === 'ended'
                                        ? 'Assignment Wrapped Up'
                                        : `Active W-2${eng.extensionCount > 0 ? ` (+${eng.extensionCount * 90}d Ext)` : ''}`}
                                    </span>
                                    {eng.equipmentReturnStatus === 'return_requested' && (
                                      <span className="rounded bg-amber-100 border border-amber-300 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-900">
                                        📦 Hardware Return Pending
                                      </span>
                                    )}
                                    {eng.equipmentReturnStatus === 'returned' && (
                                      <span className="rounded bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                        ✓ Hardware Returned
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-600">
                                    ${eng.hourlyPayRate.toFixed(2)}/hr W-2 (${eng.employerBillRate.toFixed(2)}/hr bill) · Start {eng.targetStartDate}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5">
                                  {eng.status === 'accepted_pending_eor' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => openContractConfirm(job.title, eng, 'extend_90d')}
                                        className="px-2.5 py-1 rounded-md bg-white border border-indigo-300 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                                      >
                                        Extend +90d
                                      </button
                                      >
                                      <button
                                        type="button"
                                        onClick={() => openContractConfirm(job.title, eng, 'convert_direct')}
                                        className="px-2.5 py-1 rounded-md bg-emerald-600 text-[11px] font-bold text-white hover:bg-emerald-700 cursor-pointer"
                                      >
                                        Convert Direct ($0)
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openContractConfirm(job.title, eng, 'wrap_up_assignment')}
                                        className="px-2.5 py-1 rounded-md bg-white border border-slate-300 text-[11px] font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 cursor-pointer"
                                      >
                                        Wrap Up
                                      </button>
                                    </>
                                  )}
                                  {eng.status === 'converted_direct' && (
                                    <button
                                      type="button"
                                      onClick={() => openContractConfirm(job.title, eng, 'wrap_up_assignment')}
                                      className="px-2.5 py-1 rounded-md bg-white border border-slate-300 text-[11px] font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 cursor-pointer"
                                    >
                                      Wrap Up
                                    </button>
                                  )}
                                  {eng.equipmentReturnStatus === 'return_requested' && (
                                    <button
                                      type="button"
                                      onClick={() => openContractConfirm(job.title, eng, 'mark_gear_returned')}
                                      className="px-2.5 py-1 rounded-md bg-amber-600 text-[11px] font-bold text-white hover:bg-amber-700 cursor-pointer"
                                    >
                                      Confirm Gear Returned
                                    </button>
                                  )}
                                  {eng.status === 'ended' && eng.equipmentReturnStatus !== 'return_requested' && eng.equipmentReturnStatus !== 'returned' && (
                                    <button
                                      type="button"
                                      onClick={() => openContractConfirm(job.title, eng, 'request_gear_return')}
                                      className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-300 text-[11px] font-bold text-amber-900 hover:bg-amber-100 cursor-pointer"
                                    >
                                      Request Gear Return
                                    </button>
                                  )}
                                  {eng.status === 'ended' && (
                                    <button
                                      type="button"
                                      onClick={() => openContractConfirm(job.title, eng, 'reopen_assignment')}
                                      className="px-2.5 py-1 rounded-md bg-white border border-indigo-300 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                                    >
                                      Reopen W-2
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex flex-col items-start gap-1">
                          {job.is_active ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              Active
                            </span>
                          ) : job.isPracticeDraft ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-700">
                              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                              Practice Draft
                            </span>
                          ) : job.isExpired ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-700">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                              Expired (30d Limit)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
                              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                              Closed
                            </span>
                          )}

                          {job.is_active ? (
                            <span
                              className={`text-[11px] font-semibold ${
                                isExpiringSoon
                                  ? 'text-amber-700'
                                  : 'text-slate-400'
                              }`}
                            >
                              Closes in {job.daysRemaining}{' '}
                              {job.daysRemaining === 1 ? 'day' : 'days'} (
                              {new Date(job.expiresAtIso).toLocaleDateString()})
                            </span>
                          ) : job.isPracticeDraft ? (
                            <span className="text-[11px] text-indigo-600 font-semibold">
                              {isPracticeMode ? 'Activate monthly plan to publish live' : 'Ready to publish live for 30 days'}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">
                              Reopen to accept new applications
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <Link
                          href="/dashboard/employer/applications"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                          title="View inbound applicants"
                        >
                          <span className="font-extrabold text-slate-800 text-sm">
                            {job.applicantCount}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {job.applicantCount === 1
                              ? 'applicant'
                              : 'applicants'}
                          </span>
                        </Link>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/employer/jobs/${job.id}/edit`}
                            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                          >
                            Edit
                          </Link>

                          {job.is_active && (
                            job.renewalCount >= job.maxRenewals ? (
                              <span
                                title="Maximum of 2 consecutive renewals (90 days total) reached for this listing."
                                className="px-3 py-1.5 text-xs font-bold text-slate-400 bg-slate-100 border border-slate-300 rounded-lg select-none cursor-not-allowed"
                              >
                                🔒 Max 2 Renewals Used
                              </span>
                            ) : job.unactionedApplicantCount > 0 ? (
                              <Link
                                href="/dashboard/employer/applications"
                                title="Please message or decline waiting applicants on this role before renewing."
                                className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors"
                              >
                                ⚡ Reply to {job.unactionedApplicantCount} Applicant{job.unactionedApplicantCount === 1 ? '' : 's'} to Renew
                              </Link>
                            ) : !job.inRenewalWindow ? (
                              <span
                                title={`Renewals open during the final 5 days of a listing (Days 25–30). Opens in ${job.daysRemaining - 5} day(s).`}
                                className="px-3 py-1.5 text-xs font-bold text-slate-400 bg-slate-100 border border-slate-300 rounded-lg select-none cursor-not-allowed"
                              >
                                🔒 Renews at ≤5d
                              </span>
                            ) : (
                              <form action={toggleOrRenewJobStatus}>
                                <input
                                  type="hidden"
                                  name="job_id"
                                  value={job.id}
                                />
                                <input
                                  type="hidden"
                                  name="action_type"
                                  value="renew"
                                />
                                <input
                                  type="hidden"
                                  name="current_status"
                                  value="true"
                                />
                                <SubmitButton
                                  pendingText="Renewing..."
                                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                  ↻ Renew +30d ({job.renewalCount}/{job.maxRenewals})
                                </SubmitButton>
                              </form>
                            )
                          )}

                          <form action={toggleOrRenewJobStatus}>
                            <input type="hidden" name="job_id" value={job.id} />
                            <input
                              type="hidden"
                              name="current_status"
                              value={job.is_active.toString()}
                            />

                            {job.is_active ? (
                              <>
                                <input
                                  type="hidden"
                                  name="action_type"
                                  value="close"
                                />
                                <SubmitButton
                                  pendingText="..."
                                  className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition-colors cursor-pointer"
                                >
                                  Close
                                </SubmitButton>
                              </>
                            ) : isPracticeMode ? (
                              <Link
                                href="/dashboard/employer/billing"
                                className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-300 rounded-lg hover:bg-indigo-100 transition-colors"
                              >
                                Activate Plan to Publish →
                              </Link>
                            ) : slotsFull ? (
                              <Link
                                href="/dashboard/employer/billing"
                                className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors"
                              >
                                Slots Full ({activeJobsCount}/{maxActiveJobs}) ·
                                Upgrade
                              </Link>
                            ) : job.renewalCount >= job.maxRenewals ? (
                              <span
                                title="This role has already used its maximum 2 renewals (90 days total)."
                                className="px-3 py-1.5 text-xs font-bold text-slate-400 bg-slate-100 border border-slate-300 rounded-lg select-none cursor-not-allowed"
                              >
                                🔒 Max 2 Renewals Reached
                              </span>
                            ) : job.unactionedApplicantCount > 0 ? (
                              <Link
                                href="/dashboard/employer/applications"
                                title="Please message or decline waiting applicants on this role before reopening."
                                className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors"
                              >
                                ⚡ Reply to {job.unactionedApplicantCount} Applicant{job.unactionedApplicantCount === 1 ? '' : 's'} to Reopen
                              </Link>
                            ) : (
                              <>
                                <input
                                  type="hidden"
                                  name="action_type"
                                  value="renew"
                                />
                                <SubmitButton
                                  pendingText={job.isPracticeDraft ? 'Publishing...' : 'Renewing...'}
                                  className="px-3 py-1.5 text-xs font-extrabold text-white bg-slate-900 rounded-lg hover:bg-indigo-600 transition-colors cursor-pointer"
                                >
                                  {job.isPracticeDraft ? 'Publish Live (30d)' : `↻ Reopen (+30d • ${job.renewalCount}/${job.maxRenewals})`}
                                </SubmitButton>
                              </>
                            )}
                          </form>
                          {(() => {
                            const blockReason = getRoleDeleteBlockReason(job)
                            return blockReason ? (
                              <span
                                title={blockReason}
                                className="px-2.5 py-1.5 text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded-lg select-none cursor-not-allowed"
                              >
                                🔒 Delete
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openRoleDeleteConfirm(job)}
                                title="Permanently delete this role listing"
                                className="px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 hover:border-rose-300 transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            )
                          })()}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pendingContractConfirm && manageActiveW2Engagement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border-2 border-slate-300 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                  pendingContractConfirm.action === 'convert_direct'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : pendingContractConfirm.action === 'wrap_up_assignment'
                    ? 'bg-rose-100 text-rose-900 border border-rose-300'
                    : pendingContractConfirm.action === 'mark_gear_returned' || pendingContractConfirm.action === 'request_gear_return'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
              }`}>
                Contract Action Safeguard
              </span>
              <h3 className="text-base font-black text-slate-900">
                {pendingContractConfirm.action === 'extend_90d'
                  ? 'Confirm +90-Day W-2 Contract Extension'
                  : pendingContractConfirm.action === 'convert_direct'
                  ? 'Confirm $0 Direct W-2 Hire Conversion'
                  : pendingContractConfirm.action === 'wrap_up_assignment'
                  ? 'Confirm W-2 Assignment Wrap-Up'
                  : pendingContractConfirm.action === 'request_gear_return'
                  ? 'Request Company / EOR Hardware Return'
                  : pendingContractConfirm.action === 'reopen_assignment'
                  ? 'Reopen Active W-2 Assignment'
                  : 'Confirm Company / EOR Hardware Returned'}
              </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPendingContractConfirm(null)
                  setConfirmIntentChecked(false)
                }}
                className="text-slate-400 hover:text-slate-700 text-sm font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs space-y-1.5">
              <p className="text-slate-700">
                <strong className="text-slate-900">Role:</strong> {pendingContractConfirm.jobTitle}
              </p>
              <p className="text-slate-700">
                <strong className="text-slate-900">Professional:</strong> {pendingContractConfirm.eng.professionalLabel}
              </p>
              <p className="text-slate-700">
                <strong className="text-slate-900">Locked W-2 Rate:</strong> ${pendingContractConfirm.eng.hourlyPayRate.toFixed(2)}/hr W-2 (${pendingContractConfirm.eng.employerBillRate.toFixed(2)}/hr all-in bill)
              </p>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              {pendingContractConfirm.action === 'extend_90d'
                ? 'This extends the active W-2 engagement by an additional 90 days through our US Employer of Record at the current hourly rate. Do not choose this option if you meant to convert this Professional to your direct W-2 payroll.'
                : pendingContractConfirm.action === 'convert_direct'
                ? 'This initiates a $0-fee direct W-2 hire transition onto your company payroll and notifies our Employer of Record partner to schedule final EOR timesheet closeout.'
                : pendingContractConfirm.action === 'wrap_up_assignment'
                ? 'This concludes the active W-2 contract assignment, notifies the Professional and Employer of Record partner, and opens IT hardware return tracking if equipment was issued.'
                : pendingContractConfirm.action === 'request_gear_return'
                ? 'This opens IT hardware return tracking for this assignment and posts an offboarding return reminder in the secure message thread.'
                : pendingContractConfirm.action === 'reopen_assignment'
                ? 'This restores this W-2 engagement to Active W-2 status and re-enables +90-day extension, $0 direct conversion, and wrap-up controls.'
                : 'This records verified receipt of all company-shipped or EOR-managed hardware and closes open asset-return tracking for this assignment.'}
            </p>

            <label className="flex items-start gap-2.5 rounded-xl border-2 border-indigo-200 bg-indigo-50/50 p-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmIntentChecked}
                onChange={(e) => setConfirmIntentChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-400 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-900 leading-snug">
                {pendingContractConfirm.action === 'extend_90d'
                  ? `I confirm I intend to extend ${pendingContractConfirm.eng.professionalLabel}'s W-2 contract by +90 days (not convert or end the assignment).`
                  : pendingContractConfirm.action === 'convert_direct'
                  ? `I confirm I intend to convert ${pendingContractConfirm.eng.professionalLabel} to a direct W-2 hire ($0 conversion fee).`
                  : pendingContractConfirm.action === 'wrap_up_assignment'
                  ? `I confirm I intend to wrap up and end ${pendingContractConfirm.eng.professionalLabel}'s active W-2 assignment.`
                  : pendingContractConfirm.action === 'request_gear_return'
                  ? `I confirm I want to open hardware return tracking for ${pendingContractConfirm.eng.professionalLabel}.`
                  : pendingContractConfirm.action === 'reopen_assignment'
                  ? `I confirm I want to reopen ${pendingContractConfirm.eng.professionalLabel}'s W-2 assignment and restore active controls.`
                  : `I confirm all assigned hardware from ${pendingContractConfirm.eng.professionalLabel} has been returned and verified.`}
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setPendingContractConfirm(null)
                  setConfirmIntentChecked(false)
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              {confirmIntentChecked ? (
                <form
                  action={async (fd) => {
                    await manageActiveW2Engagement(fd)
                    setPendingContractConfirm(null)
                    setConfirmIntentChecked(false)
                  }}
                >
                  <input type="hidden" name="application_id" value={pendingContractConfirm.eng.applicationId} />
                  <input type="hidden" name="lifecycle_action" value={pendingContractConfirm.action} />
                  <SubmitButton
                    pendingText="Processing..."
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold text-white cursor-pointer ${
                      pendingContractConfirm.action === 'convert_direct'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : pendingContractConfirm.action === 'wrap_up_assignment'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : pendingContractConfirm.action === 'mark_gear_returned' || pendingContractConfirm.action === 'request_gear_return'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {pendingContractConfirm.action === 'extend_90d'
                      ? 'Confirm +90d Extension'
                      : pendingContractConfirm.action === 'convert_direct'
                      ? 'Confirm $0 Direct Conversion'
                      : pendingContractConfirm.action === 'wrap_up_assignment'
                      ? 'Confirm Assignment Wrap-Up'
                      : pendingContractConfirm.action === 'request_gear_return'
                      ? 'Request Gear Return'
                      : pendingContractConfirm.action === 'reopen_assignment'
                      ? 'Confirm Reopen W-2'
                      : 'Confirm Hardware Returned'}
                  </SubmitButton>
                </form>
              ) : (
                <button
                  type="button"
                  disabled
                  className="px-4 py-2 rounded-xl bg-slate-200 text-xs font-extrabold text-slate-400 cursor-not-allowed"
                >
                  Check Box Above to Confirm
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {pendingRoleDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border-2 border-slate-300 shadow-2xl p-6 space-y-4">
            <div className="space-y-1">
              <span className="inline-flex items-center rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-extrabold text-rose-800">
                Permanent Role Cleanup
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">
                Delete Role Listing?
              </h3>
              <p className="text-xs text-slate-600">
                <strong className="text-slate-900">{pendingRoleDelete.title}</strong>
                {pendingRoleDelete.applicantCount > 0
                  ? ` · ${pendingRoleDelete.applicantCount} archived application record${pendingRoleDelete.applicantCount === 1 ? '' : 's'}`
                  : ' · 0 inbound applications'}
              </p>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-xs text-slate-700 space-y-1.5">
              <p>
                Deleting this role permanently removes it from your Job Management table, automatically retires any open Employer Talent Shield links tied to it, and clears its archived application threads.
              </p>
              {pendingRoleDelete.is_active && (
                <p className="font-semibold text-rose-900">
                  Note: If you just want to pause new applications while keeping history, click Cancel and use Close instead.
                </p>
              )}
            </div>

            <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmRoleDeleteChecked}
                onChange={(e) => setConfirmRoleDeleteChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-xs font-semibold text-slate-800">
                I confirm I want to permanently delete {pendingRoleDelete.title} and retire any linked invite tokens.
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setPendingRoleDelete(null)
                  setConfirmRoleDeleteChecked(false)
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                Cancel
              </button>
              {confirmRoleDeleteChecked ? (
                <form
                  action={async (fd) => {
                    await toggleOrRenewJobStatus(fd)
                    setPendingRoleDelete(null)
                    setConfirmRoleDeleteChecked(false)
                  }}
                >
                  <input type="hidden" name="job_id" value={pendingRoleDelete.id} />
                  <input type="hidden" name="action_type" value="delete" />
                  <input type="hidden" name="current_status" value={pendingRoleDelete.is_active.toString()} />
                  <SubmitButton
                    pendingText="Deleting..."
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-extrabold text-white cursor-pointer"
                  >
                    Permanently Delete Role
                  </SubmitButton>
                </form>
              ) : (
                <button
                  type="button"
                  disabled
                  className="px-4 py-2 rounded-xl bg-slate-200 text-xs font-extrabold text-slate-400 cursor-not-allowed"
                >
                  Check Box Above to Confirm
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
