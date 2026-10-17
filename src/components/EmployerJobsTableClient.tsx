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
  'Contract (1099 / Corp-to-Corp)',
  'Contract-to-Hire',
  'Part-Time',
  'Seasonal / Temporary',
]

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
  daysRemaining: number
  isExpired: boolean
  expiresAtIso: string
  renewedAtIso: string | null
  skillsString: string
}

export default function EmployerJobsTableClient({
  jobs,
  activeJobsCount,
  maxActiveJobs,
  slotsFull,
  toggleOrRenewJobStatus,
}: {
  jobs: EnrichedEmployerJobRow[]
  activeJobsCount: number
  maxActiveJobs: number
  slotsFull: boolean
  toggleOrRenewJobStatus: (formData: FormData) => Promise<void>
}) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>(
    'all'
  )
  const [industryFilter, setIndustryFilter] = useState<string>('all')
  const [employmentTypeFilter, setEmploymentTypeFilter] =
    useState<string>('all')
  const [sortBy, setSortBy] = useState<EmployerJobSortOption>('closing_soon')
  const [searchQuery, setSearchQuery] = useState('')

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
        const titleMatch = job.title.toLowerCase().includes(q)
        const locMatch = job.location.toLowerCase().includes(q)
        const indMatch = job.industry.toLowerCase().includes(q)
        const empMatch = job.employmentType.toLowerCase().includes(q)
        const skillMatch = job.skillsString.toLowerCase().includes(q)
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
      {/* Organizer Toolbar: Status Tabs + Search + Industry + Work Type + Sort By */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
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
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
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
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
              }`}
            >
              Closed / Expired ({closedCount})
            </button>
          </div>

          {/* Keyword Search Input */}
          <div className="relative flex-1 max-w-md">
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
              placeholder="Search roles by title, US metro, or skill..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Bottom Row: Industry + Work Type + Sort By Dropdown */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-4 flex items-center gap-2">
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Industry Verticals</option>
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Employment Types</option>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
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

          <div className="md:col-span-2 text-right">
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
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-700 mb-2">
            No roles match your current status, keyword, Employment Type, or Industry Vertical filter.
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
            Reset Active Filters →
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100">
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
                          <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
                            {job.formattedPay}
                          </span>
                        </div>

                        {/* Clean Inline Metadata Row (No Extra Colored Pills) */}
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
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex flex-col items-start gap-1">
                          {job.is_active ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              Active
                            </span>
                          ) : job.isExpired ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-700">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                              Auto-Expired (30d Limit)
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
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">
                              Manual renewal required to reopen
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
                            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                          >
                            Edit
                          </Link>

                          {job.is_active && (
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
                                className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                              >
                                ↻ Renew +30d
                              </SubmitButton>
                            </form>
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
                                  className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
                                >
                                  Close
                                </SubmitButton>
                              </>
                            ) : slotsFull ? (
                              <Link
                                href="/dashboard/employer/billing"
                                className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                              >
                                Slots Full ({activeJobsCount}/{maxActiveJobs}) ·
                                Upgrade
                              </Link>
                            ) : (
                              <>
                                <input
                                  type="hidden"
                                  name="action_type"
                                  value="renew"
                                />
                                <SubmitButton
                                  pendingText="Renewing..."
                                  className="px-3 py-1.5 text-xs font-extrabold text-white bg-slate-900 rounded-lg hover:bg-indigo-600 transition-colors cursor-pointer"
                                >
                                  ↻ Reopen (+30d)
                                </SubmitButton>
                              </>
                            )}
                          </form>
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
    </div>
  )
}