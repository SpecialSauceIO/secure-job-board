'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { getEmployerPitches } from '@/app/dashboard/actions'
import SecureMessageThread from '@/components/SecureMessageThread'
import {
  STANDARD_INDUSTRY_VERTICALS,
  normalizeIndustryVertical,
} from '@/constants/industries'
import {
  normalizeCandidateEducation,
  normalizeJobEducationReq,
} from '@/constants/education'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

type PitchSortOption =
  | 'match_high'
  | 'match_low'
  | 'recent_activity'
  | 'newest'
  | 'oldest'
  | 'exp_high'

function maskFirstInitial(fullName?: string | null): string {
  if (!fullName || !fullName.trim()) return 'Verified Candidate'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]?.toUpperCase() || ''}.`
}

function getPitchIndustry(pitch: any): string {
  const candInd = pitch?.profiles?.industry_vertical
  if (candInd) return normalizeIndustryVertical(candInd)
  const jobInd = pitch?.jobs?.industry || pitch?.jobs?.job_meta?.industry
  if (jobInd) return normalizeIndustryVertical(jobInd)
  return ''
}

function getLastActivityTimestamp(pitch: any): number {
  const messages = Array.isArray(pitch?.match_data?.messages)
    ? pitch.match_data.messages
    : []
  if (messages.length > 0) {
    const lastMsg = messages[messages.length - 1]
    const msgTime = new Date(lastMsg.created_at || 0).getTime()
    if (!isNaN(msgTime) && msgTime > 0) return msgTime
  }
  if (pitch?.match_data?.last_message_at) {
    const t = new Date(pitch.match_data.last_message_at).getTime()
    if (!isNaN(t)) return t
  }
  return new Date(pitch?.created_at || 0).getTime()
}

export default function EmployerSentPitchesPage() {
  const [pitches, setPitches] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'accepted' | 'declined'
  >('all')
  const [industryFilter, setIndustryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<PitchSortOption>('match_high')
  const [daysFilter, setDaysFilter] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRadarId, setExpandedRadarId] = useState<string | null>(null)

  const fetchPitches = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) setIsLoading(true)
      const result = await getEmployerPitches(
        'all',
        daysFilter || undefined,
        searchQuery || undefined
      )
      if (result.data) {
        setPitches(result.data)
      }
      if (showSpinner) setIsLoading(false)
    },
    [daysFilter, searchQuery]
  )

  useEffect(() => {
    fetchPitches(true)
  }, [daysFilter])

  // Silent 5-second background sync so candidate pitch acceptances & Stage 2 Vault Releases appear live
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchPitches(false)
    }, 5000)
    return () => clearInterval(intervalId)
  }, [fetchPitches])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPitches(true)
  }

  const filteredAndSortedPitches = useMemo(() => {
    const filtered = pitches.filter((pitch) => {
      if (statusFilter !== 'all' && pitch.normalized_status !== statusFilter) {
        return false
      }
      if (industryFilter !== 'all') {
        const pitchInd = getPitchIndustry(pitch)
        if (pitchInd.toLowerCase() !== industryFilter.toLowerCase()) {
          return false
        }
      }
      return true
    })

    const getMatchScore = (pitch: any): number =>
      Number(pitch.match_score ?? pitch.match_data?.overall_score ?? 0)

    const getExpYears = (pitch: any): number => {
      const num = parseFloat(String(pitch?.profiles?.experience_years || '0'))
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
  }, [pitches, statusFilter, industryFilter, sortBy])

  const pendingCount = pitches.filter(
    (p) => p.normalized_status === 'pending'
  ).length
  const acceptedCount = pitches.filter(
    (p) => p.normalized_status === 'accepted'
  ).length
  const declinedCount = pitches.filter(
    (p) => p.normalized_status === 'declined'
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
              Sent Connection Pitches
            </h1>
            <p className="text-slate-500 mt-1">
              Track outbound connection requests sent to passive candidates, sort by AI Match score, and message accepted matches in real time.
            </p>
          </div>

          <Link
            href="/dashboard/employer/search"
            className="shrink-0 px-5 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 transition-colors shadow-sm inline-flex items-center gap-2"
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Search More Candidates
          </Link>
        </div>

        {/* Filter Bar: Status Tabs + Search + Date Range + Industry & Sort By */}
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
                All Sent ({pitches.length})
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
                Awaiting Candidate
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
                onClick={() => setStatusFilter('accepted')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  statusFilter === 'accepted'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Accepted &amp; Thread Open
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] ${
                    statusFilter === 'accepted'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {acceptedCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('declined')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  statusFilter === 'declined'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Declined
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] ${
                    statusFilter === 'declined'
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {declinedCount}
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
              placeholder="Filter sent pitches by Reference ID (e.g. SS-...), job title, skill, certification, or bio..."
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
                htmlFor="pitch-industry-filter"
                className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap shrink-0"
              >
                Industry:
              </label>
              <select
                id="pitch-industry-filter"
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
                htmlFor="pitch-sort"
                className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap shrink-0"
              >
                Sort By:
              </label>
              <select
                id="pitch-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as PitchSortOption)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="match_high">
                  AI Match Score (Highest First)
                </option>
                <option value="match_low">AI Match Score (Lowest First)</option>
                <option value="recent_activity">
                  Recent Thread Activity / Unread First
                </option>
                <option value="newest">Newest Sent First</option>
                <option value="oldest">Oldest Sent First</option>
                <option value="exp_high">
                  Candidate Experience (Most Years First)
                </option>
              </select>
            </div>

            <div className="md:col-span-2 text-right">
              <span className="text-xs font-bold text-slate-500">
                Showing{' '}
                <strong className="text-slate-900">
                  {filteredAndSortedPitches.length}
                </strong>{' '}
                of {pitches.length}
              </span>
            </div>
          </div>
        </div>

        {/* Pitches List */}
        {isLoading ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">
              Loading your sent connection pitches...
            </p>
          </div>
        ) : filteredAndSortedPitches.length === 0 ? (
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
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              No sent pitches found
            </h3>
            <p className="text-slate-500 max-w-md mx-auto text-sm mb-6">
              {statusFilter === 'all' && industryFilter === 'all'
                ? "You haven't sent any outbound connection requests yet. Browse the anonymous talent pool to pitch candidates your open roles."
                : 'No pitches match your current status or Industry Vertical filter.'}
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
                href="/dashboard/employer/search"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Browse Passive Candidates →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAndSortedPitches.map((pitch) => {
              const candidate = pitch.profiles || {}
              const job = pitch.jobs || {}
              const pitchIndustry = getPitchIndustry(pitch)
              const candidateEducation = candidate.education_level
                ? normalizeCandidateEducation(candidate.education_level)
                : ''
              const candidateCertifications = candidate.certifications
                ? String(candidate.certifications).trim()
                : ''
              const jobEducationReq =
                job.education_req || job.job_meta?.education_req
                  ? normalizeJobEducationReq(
                      job.education_req || job.job_meta?.education_req
                    )
                  : ''

              const displayId = (pitch.candidate_id || 'ANON')
                .split('-')[0]
                .toUpperCase()
              const referenceId =
                pitch.reference_id ||
                `SS-${(pitch.id || '')
                  .replace(/-/g, '')
                  .substring(0, 8)
                  .toUpperCase()}`
              const matchScore =
                pitch.match_score ?? pitch.match_data?.overall_score ?? null
              const radarData = pitch.match_data?.radar_data || null
              const briefAnalysis =
                pitch.match_data?.brief_analysis ||
                'Candidate profile evaluated against role requirements.'
              const isExpanded = expandedRadarId === pitch.id
              const status = pitch.normalized_status

              const vaultReleased = Boolean(
                pitch.match_data?.candidate_vault_released === true
              )
              const threadMessages = Array.isArray(pitch.match_data?.messages)
                ? pitch.match_data.messages
                : []

              const rawUnlockedName =
                pitch.unlocked_candidate_name ||
                candidate.full_name ||
                pitch.match_data?.candidate_full_name ||
                `Verified Candidate #${displayId}`

              const stageAwareName = vaultReleased
                ? rawUnlockedName
                : maskFirstInitial(rawUnlockedName)

              const unlockedEmail = vaultReleased
                ? pitch.unlocked_candidate_email || null
                : null

              const candidateSkills: string[] =
                Array.isArray(candidate.structured_skills) &&
                candidate.structured_skills.length > 0
                  ? candidate.structured_skills
                      .map((s: any) =>
                        typeof s === 'string' ? s : s.skill || ''
                      )
                      .filter(Boolean)
                  : typeof candidate.skills === 'string'
                  ? candidate.skills
                      .split(',')
                      .map((s: string) => s.trim())
                      .filter(Boolean)
                  : []

              return (
                <div
                  key={pitch.id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-colors ${
                    status === 'accepted'
                      ? 'border-emerald-300 ring-1 ring-emerald-100'
                      : 'border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  <div className="p-6 md:p-8 space-y-5">
                    {/* Top Row: Role Badge, Industry, Reference ID, Timestamp, Match %, and Status */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold">
                          Pitched Role: {job.title || 'Open Role'}
                        </span>
                        {pitchIndustry && (
                          <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-bold">
                            {pitchIndustry}
                          </span>
                        )}
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-200">
                          Ref: {referenceId}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          Sent {new Date(pitch.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {matchScore !== null && (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${
                              matchScore >= 80
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            }`}
                          >
                            {matchScore}% AI Match
                          </span>
                        )}

                        {status === 'pending' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            Awaiting Candidate Response
                          </span>
                        )}

                        {status === 'accepted' && !vaultReleased && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                            🛡️ Stage 1 Thread Open (Vault Locked)
                          </span>
                        )}

                        {status === 'accepted' && vaultReleased && (
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            🔓 Stage 2 Vault Released
                          </span>
                        )}

                        {status === 'declined' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Declined by Candidate
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Candidate Identity Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                            status === 'accepted'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900 text-white'
                          }`}
                        >
                          {status === 'accepted' ? (
                            <svg
                              className="w-6 h-6"
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
                          ) : (
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-extrabold text-slate-900">
                              {status === 'accepted'
                                ? stageAwareName
                                : `Anonymous Candidate #${displayId}`}
                            </h2>
                            {candidate.identity_verified && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold shadow-sm">
                                ✓ Identity Verified
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 mt-1">
                            {candidate.experience_years && (
                              <>
                                <span>
                                  {candidate.experience_years} Yrs Experience
                                </span>
                                <span>•</span>
                              </>
                            )}
                            <span className="text-emerald-600">
                              Min Salary: $
                              {candidate.min_salary_expectation
                                ? (
                                    candidate.min_salary_expectation / 1000
                                  ).toFixed(0) + 'k'
                                : 'Open'}
                            </span>
                            <span>•</span>
                            <span className="capitalize">
                              Prefers {candidate.preferred_work_model || 'Any'}
                            </span>
                            {candidate.location && (
                              <>
                                <span>•</span>
                                <span>{candidate.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Candidate Education & Active Certifications Row */}
                    {(candidateEducation ||
                      candidateCertifications ||
                      jobEducationReq) && (
                      <div className="flex flex-wrap items-center gap-2">
                        {candidateEducation && (
                          <span className="px-3 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold">
                            🎓 {candidateEducation}
                          </span>
                        )}
                        {candidateCertifications && (
                          <span className="px-3 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                            🏅 Certs: {candidateCertifications}
                          </span>
                        )}
                        {jobEducationReq && (
                          <span className="text-[11px] font-semibold text-slate-400 ml-1">
                            (Role Target: {jobEducationReq})
                          </span>
                        )}
                      </div>
                    )}

                    {/* STAGE 1 / STAGE 2 SECURE MESSAGE THREAD & VAULT */}
                    {status === 'accepted' && (
                      <SecureMessageThread
                        applicationId={pitch.id}
                        referenceId={referenceId}
                        viewerRole="employer"
                        initialMessages={threadMessages}
                        initialVaultReleased={vaultReleased}
                        candidateDisplayName={stageAwareName}
                        candidateFullName={
                          vaultReleased ? rawUnlockedName : null
                        }
                        candidateEmail={unlockedEmail}
                        employerEmail={pitch.unlocked_employer_email || null}
                        initialResumeUrl={
                          vaultReleased ? candidate.resume_url : null
                        }
                      />
                    )}

                    {/* AI Assessment & Radar Toggle */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
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
                          AI Fit Summary
                        </span>

                        {radarData && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRadarId(
                                isExpanded ? null : pitch.id
                              )
                            }
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                          >
                            {isExpanded
                              ? 'Hide Radar Breakdown'
                              : 'View 5-Point Radar Breakdown'}
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 font-medium leading-relaxed">
                        {briefAnalysis}
                      </p>
                    </div>

                    {/* Expandable Radar Chart */}
                    {isExpanded && radarData && (
                      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col lg:flex-row items-center gap-6 animate-in fade-in duration-200">
                        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {radarData.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className="bg-white px-3.5 py-2.5 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center"
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
                              outerRadius="60%"
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

                    {/* Candidate Bio & Skills */}
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {candidate.bio || 'No summary bio provided.'}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {candidateSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md border border-slate-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
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