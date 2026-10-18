'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { getEmployerInboundApplications } from '@/app/dashboard/actions'
import { ApplicationRevealCard } from '@/components/ApplicationRevealCard'
import {
  STANDARD_INDUSTRY_VERTICALS,
  normalizeIndustryVertical,
} from '@/constants/industries'

type ApplicationSortOption =
  | 'match_high'
  | 'match_low'
  | 'recent_activity'
  | 'newest'
  | 'oldest'
  | 'exp_high'

function getAppIndustry(app: any): string {
  const candInd = app?.profiles?.industry_vertical
  if (candInd) return normalizeIndustryVertical(candInd)
  const jobInd = app?.jobs?.industry || app?.jobs?.job_meta?.industry
  if (jobInd) return normalizeIndustryVertical(jobInd)
  return ''
}

function getLastActivityTimestamp(app: any): number {
  const messages = Array.isArray(app?.match_data?.messages)
    ? app.match_data.messages
    : []
  if (messages.length > 0) {
    const lastMsg = messages[messages.length - 1]
    const msgTime = new Date(lastMsg.created_at || 0).getTime()
    if (!isNaN(msgTime) && msgTime > 0) return msgTime
  }
  if (app?.match_data?.last_message_at) {
    const t = new Date(app.match_data.last_message_at).getTime()
    if (!isNaN(t)) return t
  }
  return new Date(app?.created_at || 0).getTime()
}

export default function EmployerInboundApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'unrevealed' | 'unlocked' | 'shortlisted' | 'rejected'
  >('all')
  const [industryFilter, setIndustryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<ApplicationSortOption>('match_high')
  const [daysFilter, setDaysFilter] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchApplications = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) setIsLoading(true)
      const result = await getEmployerInboundApplications(
        'all',
        daysFilter || undefined,
        searchQuery || undefined
      )
      if (result.data) {
        setApplications(result.data)
      }
      if (showSpinner) setIsLoading(false)
    },
    [daysFilter, searchQuery]
  )

  useEffect(() => {
    fetchApplications(true)
  }, [daysFilter])

  // Silent 5-second background sync so new applications & Stage 2 Vault Releases appear live
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchApplications(false)
    }, 5000)
    return () => clearInterval(intervalId)
  }, [fetchApplications])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchApplications(true)
  }

  const handleLocalStatusUpdate = (
    appId: string,
    newStatus: 'unrevealed' | 'unlocked' | 'shortlisted' | 'rejected'
  ) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === appId
          ? {
              ...app,
              is_revealed: true,
              normalized_status: newStatus,
            }
          : app
      )
    )
  }

  const filteredAndSortedApplications = useMemo(() => {
    const filtered = applications.filter((app) => {
      if (statusFilter !== 'all' && app.normalized_status !== statusFilter) {
        return false
      }
      if (industryFilter !== 'all') {
        const appInd = getAppIndustry(app)
        if (appInd.toLowerCase() !== industryFilter.toLowerCase()) {
          return false
        }
      }
      return true
    })

    const getMatchScore = (app: any): number =>
      Number(app.match_score ?? app.match_data?.overall_score ?? 0)

    const getExpYears = (app: any): number => {
      const num = parseFloat(String(app?.profiles?.experience_years || '0'))
      return isNaN(num) ? 0 : num
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'match_high':
          return getMatchScore(b) - getMatchScore(a)
        case 'match_low':
          return getMatchScore(a) - getMatchScore(b)
        case 'recent_activity':
          return getLastActivityTimestamp(b) - getLastActivityTimestamp(a)
        case 'newest':
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        case 'oldest':
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        case 'exp_high':
          return getExpYears(b) - getExpYears(a)
        default:
          return 0
      }
    })
  }, [applications, statusFilter, industryFilter, sortBy])

  const unrevealedCount = applications.filter(
    (a) => a.normalized_status === 'unrevealed'
  ).length
  const unlockedCount = applications.filter(
    (a) => a.normalized_status === 'unlocked'
  ).length
  const shortlistedCount = applications.filter(
    (a) => a.normalized_status === 'shortlisted'
  ).length
  const rejectedCount = applications.filter(
    (a) => a.normalized_status === 'rejected'
  ).length

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="text-indigo-600 font-bold text-sm inline-flex items-center gap-1 mb-3 hover:text-indigo-700"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Employer Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Inbound Candidate Applications
            </h1>
            <p className="text-slate-500 mt-1">
              Sort applicants by 5-Point AI Match score, open Stage 1 encrypted message threads for free, and manage shortlisted talent.
            </p>
          </div>

          <Link
            href="/dashboard/employer/pitches"
            className="shrink-0 px-5 py-3 bg-white border border-slate-300 text-slate-800 text-sm font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-sm inline-flex items-center gap-2"
          >
            View Outbound Pitches →
          </Link>
        </div>

        {/* Filter Bar: Status Tabs + Date Range + Keyword Search + Industry & Sort By */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Status Tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Applications ({applications.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('unrevealed')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  statusFilter === 'unrevealed'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Pending Review (Locked)
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] ${
                    statusFilter === 'unrevealed'
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {unrevealedCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('unlocked')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  statusFilter === 'unlocked'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Unlocked &amp; Reviewing
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] ${
                    statusFilter === 'unlocked'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {unlockedCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('shortlisted')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  statusFilter === 'shortlisted'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Shortlisted
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] ${
                    statusFilter === 'shortlisted'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {shortlistedCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('rejected')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  statusFilter === 'rejected'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Passed / Archived
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] ${
                    statusFilter === 'rejected'
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {rejectedCount}
                </span>
              </button>
            </div>

            {/* Date Filter (Includes 180 and 365 Days) */}
            <select
              value={daysFilter}
              onChange={(e) => setDaysFilter(Number(e.target.value))}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value={0}>All Time</option>
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
              <option value={180}>Last 180 Days</option>
              <option value={365}>Last 365 Days (1 Year)</option>
            </select>
          </div>

          {/* Keyword Search */}
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search applications by Reference ID (SS-...), role title, skill, bio, or unlocked candidate name..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              Filter
            </button>
          </form>

          {/* Organizer Row: Industry Vertical Filter + Sort By Dropdown */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-5 flex items-center gap-2">
              <label
                htmlFor="inbound-industry-filter"
                className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap shrink-0"
              >
                Industry:
              </label>
              <select
                id="inbound-industry-filter"
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

            <div className="md:col-span-5 flex items-center gap-2">
              <label
                htmlFor="inbound-app-sort"
                className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap shrink-0"
              >
                Sort By:
              </label>
              <select
                id="inbound-app-sort"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as ApplicationSortOption)
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="match_high">
                  AI Match Score (Highest First)
                </option>
                <option value="match_low">AI Match Score (Lowest First)</option>
                <option value="recent_activity">
                  Recent Thread Activity / Unread First
                </option>
                <option value="newest">Newest Applications First</option>
                <option value="oldest">Oldest Applications First</option>
                <option value="exp_high">
                  Candidate Experience (Most Years First)
                </option>
              </select>
            </div>

            <div className="md:col-span-2 text-right">
              <span className="text-xs font-bold text-slate-500">
                Showing{' '}
                <strong className="text-slate-900">
                  {filteredAndSortedApplications.length}
                </strong>{' '}
                of {applications.length}
              </span>
            </div>
          </div>
        </div>

        {/* Applications Feed */}
        {isLoading ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">
              Loading inbound applications...
            </p>
          </div>
        ) : filteredAndSortedApplications.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-slate-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              No applications match this filter
            </h3>
            <p className="text-slate-500 max-w-md mx-auto text-sm mb-4">
              {statusFilter === 'all' && industryFilter === 'all'
                ? 'When verified candidates apply to your open roles, their blind applications and full review history will appear here.'
                : 'Try switching status tabs or resetting your Industry Vertical filter.'}
            </p>
            {(statusFilter !== 'all' || industryFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all')
                  setIndustryFilter('all')
                }}
                className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-extrabold hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                Reset Active Filters →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8 pt-2">
            {filteredAndSortedApplications.map((app) => {
              const appIndustry = getAppIndustry(app)
              return (
                <div key={app.id} className="relative">
                  <div className="absolute -top-3 left-4 flex items-center gap-2 z-10">
                    <span className="bg-slate-900 text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm">
                      Applied for: {app.jobs?.title || 'Open Role'}
                    </span>
                    {appIndustry && (
                      <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 text-[11px] font-extrabold px-3 py-0.5 rounded-full shadow-2xs">
                        {appIndustry}
                      </span>
                    )}
                  </div>
                  <ApplicationRevealCard
                    application={app}
                    onStatusChange={handleLocalStatusUpdate}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}