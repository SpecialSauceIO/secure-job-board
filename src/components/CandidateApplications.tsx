'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  getCandidateApplications,
  recalculatePitchMatch,
} from '@/app/dashboard/actions'
import SecureMessageThread from '@/components/SecureMessageThread'
import {
  STANDARD_INDUSTRY_VERTICALS,
  normalizeIndustryVertical,
} from '@/constants/industries'
import { normalizeJobEducationReq } from '@/constants/education'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

type CandidateAppSortOption =
  | 'match_high'
  | 'match_low'
  | 'recent_activity'
  | 'pay_high'
  | 'newest'
  | 'oldest'

function cleanCompanyDescription(raw?: string | null): string {
  return (raw || '')
    .replace(/\s*\[TIER:[a-z]+\]/gi, '')
    .replace(/\s*\[SEATS:[^\]]*\]/gi, '')
    .trim()
}

function getAppJobIndustry(app: any): string {
  const job = app?.jobs || {}
  const rawInd = job.industry || job.job_meta?.industry || ''
  return rawInd ? normalizeIndustryVertical(rawInd) : ''
}

function getAppJobEducation(app: any): string {
  const job = app?.jobs || {}
  const rawEdu = job.education_req || job.job_meta?.education_req || ''
  return rawEdu ? normalizeJobEducationReq(rawEdu) : ''
}

function getAppJobCerts(app: any): string {
  const job = app?.jobs || {}
  return (
    job.required_certifications || job.job_meta?.required_certifications || ''
  )
}

function getAnnualizedMaxPay(app: any): number {
  const job = app?.jobs || {}
  const rawMax = Number(job.salary_max) || Number(job.salary_min) || 0
  if (!rawMax) return 0
  const isHourly =
    job.pay_type === 'hourly' ||
    job.job_meta?.pay_type === 'hourly' ||
    (rawMax > 0 && rawMax <= 500)
  return isHourly ? rawMax * 2080 : rawMax
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

export function CandidateApplications() {
  const [applications, setApplications] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(5)
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'unlocked' | 'shortlisted' | 'rejected'
  >('all')
  const [industryFilter, setIndustryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<CandidateAppSortOption>('newest')
  const [daysFilter, setDaysFilter] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRadarId, setExpandedRadarId] = useState<string | null>(null)
  const [recalculatingId, setRecalculatingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{
    id: string
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const fetchApplications = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) setIsLoading(true)
      const result = await getCandidateApplications(
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

  // Background poll every 5 seconds so if an Employer unlocks or shortlists a Pending card,
  // the card automatically flips to Unlocked and opens the live chat thread without a page refresh!
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

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleRecalculate = async (applicationId: string) => {
    setRecalculatingId(applicationId)
    setFeedback(null)

    const result = await recalculatePitchMatch(applicationId)
    if (result?.error) {
      setFeedback({ id: applicationId, type: 'error', text: result.error })
    } else if (result?.data) {
      const updatedData = result.data
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? {
                ...app,
                match_score: updatedData.match_score,
                employer_pitch: updatedData.employer_pitch,
                match_data: updatedData.match_data,
              }
            : app
        )
      )
      setFeedback({
        id: applicationId,
        type: 'success',
        text: `TrueFit Score™ recalculated (${updatedData.match_score}%) using your latest profile skills!`,
      })
    }

    setRecalculatingId(null)
  }

  const filteredAndSortedApplications = useMemo(() => {
    const filtered = applications.filter((app) => {
      if (statusFilter !== 'all' && app.normalized_status !== statusFilter) {
        return false
      }
      if (industryFilter !== 'all') {
        const jobInd = getAppJobIndustry(app)
        if (jobInd.toLowerCase() !== industryFilter.toLowerCase()) {
          return false
        }
      }
      return true
    })

    const getMatchScore = (app: any): number =>
      Number(app.match_score ?? app.match_data?.overall_score ?? 0)

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'match_high':
          return getMatchScore(b) - getMatchScore(a)
        case 'match_low':
          return getMatchScore(a) - getMatchScore(b)
        case 'recent_activity':
          return getLastActivityTimestamp(b) - getLastActivityTimestamp(a)
        case 'pay_high':
          return getAnnualizedMaxPay(b) - getAnnualizedMaxPay(a)
        case 'newest':
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        case 'oldest':
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        default:
          return 0
      }
    })
  }, [applications, statusFilter, industryFilter, sortBy])

  const pendingCount = applications.filter(
    (a) => a.normalized_status === 'pending'
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

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem('ss_cand_apps_per_page_v1'))
      if ([5, 10, 25, 50].includes(saved)) setItemsPerPage(saved)
    } catch {}
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, industryFilter, sortBy, daysFilter])

  const totalFilteredApps = filteredAndSortedApplications.length
  const totalPages = Math.max(1, Math.ceil(totalFilteredApps / itemsPerPage))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (safeCurrentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalFilteredApps)
  const paginatedApplications = filteredAndSortedApplications.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="space-y-6">
      {/* Filter Bar: Status Tabs + Date Range + Keyword Search + Industry & Sort By */}
      <div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-sm space-y-4 border-slate-300">
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
              All Submitted ({applications.length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Pending (Identity Hidden)
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] ${
                  statusFilter === 'pending'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {pendingCount}
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
              Archived / Not Selected
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
            className="rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer border-slate-300"
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
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter applications by Reference ID (e.g. SS-...), role title, skill, or unlocked company..."
            className="w-full min-w-0 sm:flex-1 rounded-xl border-2 border-slate-300 bg-slate-50 px-3.5 sm:px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-300 hover:bg-indigo-100 transition-colors cursor-pointer shrink-0"
          >
            Filter
          </button>
        </form>

        {/* Organizer Row: Industry Vertical Filter + Sort By Dropdown */}
        <div className="pt-3 border-t border-slate-300 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-5 flex items-center gap-2">
            <label
              htmlFor="candidate-app-industry"
              className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap shrink-0"
            >
              Industry:
            </label>
            <select
              id="candidate-app-industry"
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer border-slate-300"
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
              htmlFor="candidate-app-sort"
              className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap shrink-0"
            >
              Sort By:
            </label>
            <select
              id="candidate-app-sort"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as CandidateAppSortOption)
              }
              className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer border-slate-300"
            >
              <option value="newest">Newest Applied First</option>
              <option value="recent_activity">
                Recent Thread Activity / Unread First
              </option>
              <option value="match_high">TrueFit Score™ (Highest First)</option>
              <option value="match_low">TrueFit Score™ (Lowest First)</option>
              <option value="pay_high">
                Highest Compensation (Annualized)
              </option>
              <option value="oldest">Oldest Applied First</option>
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

      {/* Applications List */}
      {isLoading ? (
        <div className="py-16 text-center bg-white rounded-2xl border-2 border-slate-300 shadow-sm border-slate-300">
          <div className="inline-block w-8 h-8 border-4 border-slate-300 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">
            Loading your application history...
          </p>
        </div>
      ) : filteredAndSortedApplications.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border-2 border-slate-300 text-center shadow-sm border-slate-300">
          <div className="w-16 h-16 bg-slate-50 border border-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            No applications found
          </h3>
          <p className="text-slate-500 max-w-md mx-auto text-sm mb-6">
            {statusFilter === 'all' && industryFilter === 'all'
              ? "You haven't submitted any protected applications yet. Browse open roles to run TrueFit Score™ predictions and apply."
              : 'No applications match your current status or Industry Vertical filter.'}
          </p>
          {statusFilter !== 'all' || industryFilter !== 'all' ? (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all')
                setIndustryFilter('all')
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-extrabold hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              Reset Active Filters →
            </button>
          ) : (
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Browse Open Roles →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {paginatedApplications.map((app) => {
            const job = app.jobs || {}
            const org = job.organizations || {}
            const jobIndustry = getAppJobIndustry(app)
            const jobEducationReq = getAppJobEducation(app)
            const jobRequiredCerts = getAppJobCerts(app)
            const status = app.normalized_status as
              | 'pending'
              | 'unlocked'
              | 'shortlisted'
              | 'rejected'
            const isEmployerRevealed = Boolean(
              app.is_revealed || status === 'unlocked' || status === 'shortlisted'
            )
            const referenceId =
              app.reference_id ||
              `SS-${(app.id || '')
                .replace(/-/g, '')
                .substring(0, 8)
                .toUpperCase()}`
            const employerEmail =
              app.unlocked_employer_email ||
              app.match_data?.employer_contact_email ||
              (org.domain && org.domain !== 'hidden'
                ? `hiring@${org.domain}`
                : '')

            const vaultReleased = Boolean(
              app.match_data?.candidate_vault_released === true
            )
            const threadMessages = Array.isArray(app.match_data?.messages)
              ? app.match_data.messages
              : []

            const matchScore =
              app.match_score ?? app.match_data?.overall_score ?? null
            const radarData = app.match_data?.radar_data || null
            const aiSummary =
              app.match_data?.brief_analysis ||
              app.employer_pitch ||
              app.match_data?.employer_pitch ||
              'Your anonymous profile and skill matrix were matched against this role.'
            const isExpanded = expandedRadarId === app.id

            const requiredSkills: { skill: string; level?: string }[] =
              Array.isArray(job.structured_requirements)
                ? job.structured_requirements
                    .map((item: any) =>
                      typeof item === 'string'
                        ? { skill: item }
                        : {
                            skill: item?.skill || item?.name || '',
                            level: item?.level,
                          }
                    )
                    .filter((r: any) => r.skill)
                : []

            const cleanOrgDesc = cleanCompanyDescription(org.description)
            const isHourlyJob =
              job.pay_type === 'hourly' ||
              job.job_meta?.pay_type === 'hourly' ||
              (job.salary_max && job.salary_max > 0 && job.salary_max <= 500)

            return (
              <div
                key={app.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-colors ${
                  status === 'shortlisted'
                    ? 'border-emerald-300 ring-2 ring-emerald-50'
                    : status === 'unlocked'
                    ? 'border-indigo-300 ring-1 ring-indigo-50'
                    : 'border-slate-300 hover:border-indigo-300'
                }`}
              >
                <div className="p-6 md:p-8 space-y-5">
                  {/* Top Row: Company Identity Status, Reference ID, Date, Match %, and Stage Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 ${
                          isEmployerRevealed
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-900 text-white'
                        }`}
                      >
                        {isEmployerRevealed && org.name ? (
                          org.name.charAt(0).toUpperCase()
                        ) : (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">
                            {isEmployerRevealed
                              ? org.name || 'Unlocked Employer'
                              : 'Anonymous Employer (Protected Listing)'}
                          </span>
                          {org.verification_status === 'verified' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-300">
                              ✓ Verified Company
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-bold border border-slate-300">
                            Ref: {referenceId}
                          </span>
                          {jobIndustry && (
                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-300 text-[11px] font-bold">
                              {jobIndustry}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          Applied on{' '}
                          {new Date(app.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {matchScore !== null && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            matchScore >= 80
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-300'
                          }`}
                        >
                          {matchScore}% TrueFit
                        </span>
                      )}

                      {status === 'pending' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          Pending Review (Identity Hidden)
                        </span>
                      )}

                      {status === 'unlocked' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-300 flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                            />
                          </svg>
                          Private Chat Active
                        </span>
                      )}

                      {status === 'shortlisted' && (
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          ★ Shortlisted for Interview
                        </span>
                      )}

                      {status === 'rejected' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300">
                          Not Selected / Archived
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Role Title, Compensation, Education & Certification Badges */}
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 mb-3">
                      {job.title || 'Open Role'}
                    </h2>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {(job.salary_min || job.salary_max) && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-300">
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
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {isHourlyJob ? (
                            <>
                              ${job.salary_min || ''}
                              {job.salary_min && job.salary_max ? ' – ' : ''}
                              {job.salary_max ? `$${job.salary_max}` : ''} /hr
                            </>
                          ) : (
                            <>
                              $
                              {job.salary_min
                                ? (job.salary_min / 1000).toFixed(0) + 'k'
                                : ''}
                              {job.salary_min && job.salary_max ? ' – ' : ''}
                              {job.salary_max
                                ? '$' + (job.salary_max / 1000).toFixed(0) + 'k'
                                : ''}{' '}
                              /yr
                            </>
                          )}
                        </span>
                      )}

                      {job.work_model && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold capitalize border border-slate-300">
                          {job.work_model} Work Model
                        </span>
                      )}

                      {job.employment_type && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300">
                          {job.employment_type}
                        </span>
                      )}

                      {jobEducationReq && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-300 text-xs font-bold">
                          🎓 {jobEducationReq}
                        </span>
                      )}

                      {jobRequiredCerts && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold">
                          🏅 Certs: {jobRequiredCerts}
                        </span>
                      )}

                      {isEmployerRevealed &&
                        org.domain &&
                        org.domain !== 'hidden' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-300">
                            🌐 {org.domain}
                          </span>
                        )}
                    </div>
                  </div>

                  {/* UNLOCKED EMPLOYER OVERVIEW & SECURE IN-PLATFORM MESSAGE THREAD */}
                  {isEmployerRevealed && (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-900 text-white rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 block mb-0.5">
                            Unlocked Employer: {org.name || 'Verified Employer'}
                          </span>
                          {cleanOrgDesc && (
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {cleanOrgDesc}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(referenceId, `ref-${app.id}`)
                            }
                            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-bold text-amber-300 font-mono transition-colors cursor-pointer"
                          >
                            {copiedKey === `ref-${app.id}`
                              ? '✓ Copied Ref ID'
                              : `Ref: ${referenceId}`}
                          </button>
                        </div>
                      </div>

                      {/* Encrypted Thread + Candidate-Controlled Stage 2 Vault Release */}
                      <SecureMessageThread
                        applicationId={app.id}
                        referenceId={referenceId}
                        viewerRole="candidate"
                        initialMessages={threadMessages}
                        initialVaultReleased={vaultReleased}
                        employerName={org.name || 'Verified Employer'}
                        candidateFullName={app.match_data?.candidate_full_name}
                        candidateEmail={app.unlocked_candidate_email}
                        employerEmail={vaultReleased ? employerEmail : null}
                      />
                    </div>
                  )}

                  {/* TrueFit Score™ Analysis & Radar Toggle */}
                  <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-300 border-slate-300">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
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
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        TrueFit Score™ Analysis
                      </span>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={recalculatingId === app.id}
                          onClick={() => handleRecalculate(app.id)}
                          className="text-xs font-bold text-slate-600 hover:text-indigo-700 flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                        >
                          <svg
                            className={`w-3.5 h-3.5 ${
                              recalculatingId === app.id
                                ? 'animate-spin text-indigo-600'
                                : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          {recalculatingId === app.id
                            ? 'Recalculating...'
                            : 'Refresh Score'}
                        </button>

                        {radarData && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRadarId(isExpanded ? null : app.id)
                            }
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                          >
                            {isExpanded
                              ? 'Hide TrueFit™ Breakdown'
                              : 'View TrueFit™ Breakdown'}
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 font-medium leading-relaxed">
                      {aiSummary}
                    </p>
                  </div>

                  {/* Expandable 5-Point Radar Chart */}
                  {isExpanded && radarData && (
                    <div className="p-5 rounded-xl bg-slate-50 border-2 border-slate-300 flex flex-col lg:flex-row items-center gap-6 animate-in fade-in duration-200 border-slate-300">
                      <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {radarData.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-white px-3.5 py-2.5 rounded-lg border border-slate-300 shadow-sm flex justify-between items-center"
                          >
                            <span className="text-xs font-bold text-slate-600">
                              {item.subject}
                            </span>
                            <span
                              className={`text-sm font-black ${
                                item.score >= 80
                                  ? 'text-emerald-500'
                                  : item.score >= 60
                                  ? 'text-amber-500'
                                  : 'text-rose-500'
                              }`}
                            >
                              {item.score}%
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="w-full max-w-[300px] h-[220px] shrink-0 mx-auto">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart
                            cx="50%"
                            cy="50%"
                            outerRadius="44%" margin={{ top: 14, right: 62, bottom: 14, left: 62 }}
                            data={radarData}
                          >
                            <PolarGrid stroke="#cbd5e1" />
                            <PolarAngleAxis
                              dataKey="subject"
                              tick={{
                                fill: '#475569',
                                fontSize: 10,
                                fontWeight: 600,
                              }}
                            />
                            <PolarRadiusAxis
                              angle={30}
                              domain={[0, 100]}
                              tick={false}
                              axisLine={false}
                            />
                            <Tooltip />
                            <Radar
                              name="Match Score"
                              dataKey="score"
                              stroke="#4f46e5"
                              strokeWidth={2}
                              fill="#10b981"
                              fillOpacity={0.35}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Role Description & Requirements */}
                  <div className="space-y-4">
                    {job.description && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Role Overview
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {job.description}
                        </p>
                      </div>
                    )}

                    {requiredSkills.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Core Role Requirements
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {requiredSkills.map((item, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md border border-slate-300"
                            >
                              {item.skill}
                              {item.level ? (
                                <span className="text-slate-400 font-medium ml-1">
                                  ({item.level})
                                </span>
                              ) : null}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Feedback Banner */}
                  {feedback?.id === app.id && (
                    <div
                      className={`p-3 rounded-xl text-xs font-bold ${
                        feedback?.type === 'error'
                          ? 'bg-rose-50 text-rose-700 border border-rose-300'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                      }`}
                    >
                      {feedback?.text}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          <div className="bg-white px-5 py-4 rounded-2xl border-2 border-slate-300 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-3 text-slate-600 font-medium">
              <span>
                Showing{' '}
                <strong className="text-slate-900 font-extrabold">
                  {startIndex + 1}–{endIndex}
                </strong>{' '}
                of{' '}
                <strong className="text-slate-900 font-extrabold">
                  {totalFilteredApps}
                </strong>{' '}
                {totalFilteredApps === 1 ? 'application' : 'applications'}
              </span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <label className="inline-flex items-center gap-2 font-bold text-slate-700">
                <span>Per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    const nextSize = Number(e.target.value)
                    setItemsPerPage(nextSize)
                    setCurrentPage(1)
                    try {
                      localStorage.setItem('ss_cand_apps_per_page_v1', String(nextSize))
                    } catch {}
                  }}
                  className="rounded-lg border-2 border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-extrabold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </label>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => {
                  setCurrentPage(Math.max(1, safeCurrentPage - 1))
                  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="px-3 py-1.5 rounded-xl border-2 border-slate-300 bg-white text-slate-700 font-extrabold hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap shrink-0"
              >
                ← Prev
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1)
                  .reduce<Array<number | string>>((acc, p, i, arr) => {
                    if (i > 0 && typeof arr[i - 1] === 'number' && (p as number) - (arr[i - 1] as number) > 1) {
                      acc.push('...')
                    }
                    acc.push(p)
                    return acc
                  }, [])
                  .map((item, idx) =>
                    item === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 font-bold">
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setCurrentPage(Number(item))
                          if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer ${
                          safeCurrentPage === item
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
              </div>

              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => {
                  setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))
                  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="px-3 py-1.5 rounded-xl border-2 border-slate-300 bg-white text-slate-700 font-extrabold hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap shrink-0"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}