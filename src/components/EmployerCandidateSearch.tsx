'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  searchCandidates,
  sendConnectionRequest,
  analyzeCandidateFit,
} from '@/app/dashboard/actions'
import {
  getUserBookmarks,
  toggleBookmarkItem,
} from '@/app/dashboard/bookmark-actions'
import { US_STATES_AND_METROS, US_REMOTE_REGIONS } from '@/constants/usLocations'

const MIN_MATCH_THRESHOLD = 40

const EMPLOYMENT_TYPES = [
  'Full-Time (W-2)',
  'Contract (1099 / Corp-to-Corp)',
  'Contract-to-Hire',
  'Part-Time',
]

function getCandidateEmploymentTypes(candidate: any): string[] {
  if (
    Array.isArray(candidate?.preferred_employment_types) &&
    candidate.preferred_employment_types.length > 0
  ) {
    return candidate.preferred_employment_types
  }
  const rawSkills = Array.isArray(candidate?.structured_skills)
    ? candidate.structured_skills
    : []
  const metaEntry = rawSkills.find(
    (item: any) => item && item._ss_pref_meta === true
  )
  if (
    Array.isArray(metaEntry?.employment_types) &&
    metaEntry.employment_types.length > 0
  ) {
    return metaEntry.employment_types
  }
  return EMPLOYMENT_TYPES
}

function getJobEmploymentType(job: any): string {
  const rawReqs = Array.isArray(job?.structured_requirements)
    ? job.structured_requirements
    : []
  const metaItem =
    rawReqs.find((r: any) => r && r._ss_job_meta === true) || job?.job_meta || {}
  return job?.employment_type || metaItem?.employment_type || 'Full-Time (W-2)'
}

export default function EmployerCandidateSearch({
  activeJobs,
  credits,
}: {
  activeJobs: any[]
  credits: number
}) {
  // Search States
  const [query, setQuery] = useState('')
  const [workModel, setWorkModel] = useState('')
  const [employmentType, setEmploymentType] = useState('all')
  const [selectedState, setSelectedState] = useState('')
  const [selectedMetro, setSelectedMetro] = useState('')

  const [candidates, setCandidates] = useState<any[]>([])
  const [savedCandidateIds, setSavedCandidateIds] = useState<string[]>([])
  const [onlyShortlisted, setOnlyShortlisted] = useState(false)
  const [togglingCandidateId, setTogglingCandidateId] = useState<string | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [liveCredits, setLiveCredits] = useState<number>(credits)

  // Modal & AI Matching States
  const [pitchCandidateId, setPitchCandidateId] = useState<string | null>(null)
  const [selectedJobId, setSelectedJobId] = useState('')
  const [isAnalyzingMatch, setIsAnalyzingMatch] = useState(false)
  const [aiMatchData, setAiMatchData] = useState<any | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    setLiveCredits(credits)
  }, [credits])

  // 1. Initial Load: Fetch passive candidates & saved shortlist when the page first opens
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('saved') === 'true') {
        setOnlyShortlisted(true)
      }
    }

    const fetchInitial = async () => {
      setIsLoading(true)
      const [result, bookmarks] = await Promise.all([
        searchCandidates('', '', ''),
        getUserBookmarks(),
      ])
      if (result.data) setCandidates(result.data)
      if (bookmarks.savedCandidateIds) {
        setSavedCandidateIds(bookmarks.savedCandidateIds)
      }
      setIsLoading(false)
    }
    fetchInitial()
  }, [])

  const stateObj = US_STATES_AND_METROS.find((s) => s.code === selectedState)
  const metroOptions =
    selectedState === 'REMOTE_US'
      ? US_REMOTE_REGIONS
      : stateObj
      ? stateObj.metros
      : []

  const handleToggleShortlist = async (candidateId: string) => {
    const normalizedId = String(candidateId)
    setTogglingCandidateId(normalizedId)
    const wasSaved = savedCandidateIds.includes(normalizedId)
    setSavedCandidateIds((prev) =>
      wasSaved
        ? prev.filter((id) => id !== normalizedId)
        : [...prev, normalizedId]
    )

    const res = await toggleBookmarkItem(normalizedId, 'candidate')
    if (!res.error) {
      setSavedCandidateIds(res.savedIds)
    }
    setTogglingCandidateId(null)
  }

  // 2. Explicit Search: Only query the database when the employer clicks the button
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    let locationFilter = ''
    if (selectedMetro) {
      locationFilter = selectedMetro
    } else if (selectedState && selectedState !== 'REMOTE_US') {
      locationFilter = `, ${selectedState}`
    } else if (selectedState === 'REMOTE_US') {
      locationFilter = 'Remote'
    }

    const result = await searchCandidates(query, workModel, locationFilter)
    if (result.data) setCandidates(result.data)
    setIsLoading(false)
  }

  // 3. Role Selection & Real-Time AI Match Analysis (With 30-Second Safety Timer)
  const handleRoleSelect = async (jobId: string, candidateId: string) => {
    setSelectedJobId(jobId)
    setAiMatchData(null)
    setFeedback(null)

    if (!jobId) return

    setIsAnalyzingMatch(true)

    try {
      const timeoutPromise = new Promise<{ error: string }>((resolve) => {
        setTimeout(() => {
          resolve({
            error:
              'AI Match analysis took longer than 30 seconds across our 3-tier matching cascade. Please click "Try AI Match Again" to retry.',
          })
        }, 30000)
      })

      const result: any = await Promise.race([
        analyzeCandidateFit(candidateId, jobId),
        timeoutPromise,
      ])

      if (result?.data) {
        setAiMatchData(result.data)
      } else if (result?.error) {
        setFeedback({
          type: 'error',
          text: `${result.error} Please click "Try AI Match Again" to retry.`,
        })
      } else {
        setFeedback({
          type: 'error',
          text: 'Unable to generate AI Match score at this moment. Please try again.',
        })
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: 'Network or server timeout while calculating AI Match. Please click "Try AI Match Again" to retry.',
      })
    } finally {
      setIsAnalyzingMatch(false)
    }
  }

  // 4. Pitching Logic
  const handlePitch = async () => {
    if (!pitchCandidateId || !selectedJobId) return

    setIsSending(true)
    setFeedback(null)

    const result = await sendConnectionRequest(
      pitchCandidateId,
      selectedJobId,
      aiMatchData
    )

    if (result.error) {
      setFeedback({ type: 'error', text: result.error })
    } else {
      setLiveCredits((prev) => Math.max(0, prev - 1))
      setFeedback({
        type: 'success',
        text: `Connection request sent (Ref: ${result.referenceId || 'SS'})! 1 Credit deducted.`,
      })

      setTimeout(() => {
        setCandidates((prev) => prev.filter((c) => c.id !== pitchCandidateId))
        setPitchCandidateId(null)
        setFeedback(null)
        setSelectedJobId('')
        setAiMatchData(null)
      }, 2200)
    }

    setIsSending(false)
  }

  // Filter candidates by Shortlist toggle & selected Employment Type
  const filteredCandidates = candidates.filter((candidate) => {
    const cid = String(candidate.id)
    if (onlyShortlisted && !savedCandidateIds.includes(cid)) {
      return false
    }
    if (employmentType !== 'all') {
      const acceptedTypes = getCandidateEmploymentTypes(candidate)
      if (
        !acceptedTypes.some(
          (t) => t.toLowerCase() === employmentType.toLowerCase()
        )
      ) {
        return false
      }
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Search Header & Filters */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
      >
        {/* Top Row: Main Search, Shortlist Filter, & Credits + Top Up CTA */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
          <div className="relative flex-1 w-full">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
            <input
              type="text"
              placeholder="Search candidate skills (e.g., Next.js, Python, Leadership)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium text-slate-900 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setOnlyShortlisted((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                onlyShortlisted
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              <svg
                className="w-4 h-4"
                fill={onlyShortlisted ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              {onlyShortlisted
                ? `Shortlisted Only (${savedCandidateIds.length})`
                : `Shortlist (${savedCandidateIds.length})`}
            </button>

            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${
                liveCredits > 0
                  ? 'bg-indigo-50 border-indigo-100 text-indigo-900'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <svg
                className="w-5 h-5 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                ></path>
              </svg>
              <span className="text-sm font-extrabold">
                {liveCredits} {liveCredits === 1 ? 'Credit' : 'Credits'} Remaining
              </span>
            </div>

            <Link
              href="/dashboard/employer/billing"
              className="px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors shadow-sm whitespace-nowrap"
            >
              + Top Up Credits
            </Link>
          </div>
        </div>

        {/* Bottom Row: Work Model, Employment Type, & Cascading US Location Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-2">
            <select
              value={workModel}
              onChange={(e) => setWorkModel(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Work Models</option>
              <option value="remote">Remote Only</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Employment Types</option>
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value)
                setSelectedMetro('')
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All US States</option>
              <option value="REMOTE_US">🇺🇸 US Remote (By Timezone)</option>
              {US_STATES_AND_METROS.map((st) => (
                <option key={st.code} value={st.code}>
                  {st.name} ({st.code})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              disabled={!selectedState}
              value={selectedMetro}
              onChange={(e) => setSelectedMetro(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
            >
              <option value="">
                {!selectedState
                  ? 'Select state...'
                  : selectedState === 'REMOTE_US'
                  ? 'All US Timezones'
                  : `All ${selectedState} Metros`}
              </option>
              {metroOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-full py-2.5 px-4 bg-slate-900 text-white text-sm font-extrabold rounded-xl hover:bg-indigo-600 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? '...' : 'Search Talent'}
            </button>
          </div>
        </div>
      </form>

      {/* Out of Credits Warning Banner */}
      {liveCredits < 1 && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <h3 className="text-sm font-extrabold text-rose-950">
              You have 0 Connection Credits remaining
            </h3>
            <p className="text-xs text-rose-700 mt-0.5">
              You can still browse the anonymous talent pool, save candidates to your Shortlist, and run AI Match predictions, but you need at least 1 Connection Credit to send an outbound pitch.
            </p>
          </div>
          <Link
            href="/dashboard/employer/billing"
            className="shrink-0 px-5 py-2.5 bg-rose-600 text-white text-xs font-extrabold rounded-xl hover:bg-rose-700 transition-colors text-center shadow-sm"
          >
            Top Up Credits →
          </Link>
        </div>
      )}

      {/* Candidate Feed */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">Scanning passive talent pool...</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {onlyShortlisted
                ? 'No candidates in your Shortlist yet'
                : 'No candidates found'}
            </h3>
            <p className="text-slate-500 text-sm">
              {onlyShortlisted
                ? 'Click "Save to Shortlist" on any anonymous candidate card to assemble a comparison pool before pitching.'
                : 'Try adjusting your filters or search terms.'}
            </p>
          </div>
        ) : (
          filteredCandidates.map((candidate) => {
            const cid = String(candidate.id)
            const isShortlisted = savedCandidateIds.includes(cid)

            const candidateSkillStrings: string[] =
              Array.isArray(candidate.structured_skills) &&
              candidate.structured_skills.length > 0
                ? candidate.structured_skills
                    .filter((s: any) => !(s && s._ss_pref_meta === true))
                    .map((s: any) =>
                      typeof s === 'string' ? s : s.skill || s.name || ''
                    )
                    .filter(
                      (str: string) => str && !String(str).startsWith('__SS_')
                    )
                : typeof candidate.skills === 'string'
                ? candidate.skills
                    .split(',')
                    .map((s: string) => s.trim())
                    .filter(Boolean)
                : []

            const acceptedEmploymentTypes = getCandidateEmploymentTypes(candidate)

            const displayId = cid.split('-')[0].toUpperCase()
            const isCandidateVerified = Boolean(
              candidate.identity_verified === true ||
                String(candidate.identity_verified) === 'true' ||
                candidate.is_verified === true ||
                String(candidate.is_verified) === 'true' ||
                candidate.verification_status === 'verified' ||
                candidate.verification_status === 'approved'
            )

            let selectedJob = null
            let salaryFails = false
            let modelFails = false
            let empTypeFails = false
            let selectedJobEmpType = 'Full-Time (W-2)'
            let scoreFails = false
            let hasDealbreaker = false
            let annualizedJobMax = 0

            const matchScore =
              pitchCandidateId === candidate.id
                ? aiMatchData?.overall_score ?? null
                : null

            if (pitchCandidateId === candidate.id && selectedJobId) {
              selectedJob = activeJobs.find((j) => j.id === selectedJobId)

              if (selectedJob) {
                selectedJobEmpType = getJobEmploymentType(selectedJob)

                const isHourlyJob =
                  selectedJob.pay_type === 'hourly' ||
                  (selectedJob.salary_max &&
                    selectedJob.salary_max > 0 &&
                    selectedJob.salary_max <= 500)

                annualizedJobMax =
                  isHourlyJob && selectedJob.salary_max
                    ? selectedJob.salary_max * 2080
                    : selectedJob.salary_max || 0

                if (
                  candidate.min_salary_expectation > 0 &&
                  annualizedJobMax > 0 &&
                  annualizedJobMax < candidate.min_salary_expectation
                ) {
                  salaryFails = true
                }

                if (candidate.preferred_work_model && selectedJob.work_model) {
                  const pref = candidate.preferred_work_model
                    .toLowerCase()
                    .trim()
                  const roleModel = selectedJob.work_model.toLowerCase().trim()

                  if (pref !== 'any' && pref !== 'open' && pref !== roleModel) {
                    modelFails = true
                  }
                }

                if (
                  acceptedEmploymentTypes.length > 0 &&
                  !acceptedEmploymentTypes.some(
                    (t) =>
                      t.toLowerCase() === selectedJobEmpType.toLowerCase()
                  )
                ) {
                  empTypeFails = true
                }

                if (
                  !isAnalyzingMatch &&
                  matchScore !== null &&
                  matchScore < MIN_MATCH_THRESHOLD
                ) {
                  scoreFails = true
                }

                hasDealbreaker =
                  salaryFails || modelFails || empTypeFails || scoreFails
              }
            }

            return (
              <div
                key={candidate.id}
                className={`bg-white p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between gap-6 transition-colors ${
                  isShortlisted
                    ? 'border-amber-300'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
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
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          ></path>
                        </svg>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">
                            Anonymous Candidate #{displayId}
                          </h3>
                          {isCandidateVerified && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-extrabold">
                              <svg
                                className="w-3 h-3 text-emerald-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2.5"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Identity Verified
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1 text-emerald-600">
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
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              ></path>
                            </svg>
                            Min: $
                            {candidate.min_salary_expectation
                              ? (candidate.min_salary_expectation / 1000).toFixed(
                                  0
                                ) + 'k'
                              : 'Open'}
                          </span>
                          <span>•</span>
                          <span className="capitalize">
                            {candidate.preferred_work_model || 'Flexible'} Model
                          </span>

                          {candidate.location && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
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
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"
                                  ></path>
                                </svg>
                                {candidate.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Save to Shortlist Button */}
                    <button
                      type="button"
                      disabled={togglingCandidateId === cid}
                      onClick={() => handleToggleShortlist(cid)}
                      className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        isShortlisted
                          ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <svg
                        className={`w-3.5 h-3.5 ${
                          isShortlisted
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-400'
                        }`}
                        fill={isShortlisted ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                      </svg>
                      {isShortlisted ? 'Shortlisted' : 'Save to Shortlist'}
                    </button>
                  </div>

                  {/* Accepted Employment Types Row */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className="text-[11px] font-bold text-slate-400 mr-1">
                      Open to:
                    </span>
                    {acceptedEmploymentTypes.map((empType) => (
                      <span
                        key={empType}
                        className="px-2 py-0.5 rounded-md bg-indigo-50/80 text-indigo-700 border border-indigo-100 text-[11px] font-bold"
                      >
                        {empType}
                      </span>
                    ))}
                  </div>

                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {candidate.bio || 'Candidate has not provided a summary.'}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {candidateSkillStrings
                      .slice(0, 5)
                      .map((skill: string, i: number) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md border border-slate-200"
                        >
                          {skill}
                        </span>
                      ))}
                    {candidateSkillStrings.length > 5 && (
                      <span className="px-2.5 py-1 text-slate-400 text-xs font-bold">
                        +{candidateSkillStrings.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col justify-center shrink-0 w-full md:w-[360px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  {pitchCandidateId === candidate.id ? (
                    <div className="space-y-3 animate-in fade-in zoom-in duration-200">
                      <select
                        value={selectedJobId}
                        disabled={isAnalyzingMatch}
                        onChange={(e) =>
                          handleRoleSelect(e.target.value, candidate.id)
                        }
                        className="w-full text-sm rounded-lg border-slate-300 bg-white text-slate-900 font-medium focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                      >
                        <option value="">Select a role to pitch...</option>
                        {activeJobs.map((job) => (
                          <option key={job.id} value={job.id}>
                            {job.title} ({getJobEmploymentType(job)})
                          </option>
                        ))}
                      </select>

                      {/* Unified 30-Second Progress Notifier Banner */}
                      {isAnalyzingMatch && (
                        <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-start gap-3 animate-pulse">
                          <div className="w-4 h-4 mt-0.5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin shrink-0" />
                          <div className="text-xs text-indigo-950 leading-relaxed">
                            <span className="font-extrabold block">
                              Analyzing 5-Point AI Fit (May take up to 30s)...
                            </span>
                            <span className="text-indigo-700 font-medium">
                              Routing across our 3-tier AI matching cascade. If all tiers are busy, you will be prompted to try again.
                            </span>
                          </div>
                        </div>
                      )}

                      {selectedJob && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <span className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                              <svg
                                className="w-4 h-4 text-indigo-600"
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
                              AI Skill Match (Min {MIN_MATCH_THRESHOLD}%)
                            </span>

                            {isAnalyzingMatch ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
                                Scoring (Up to 30s)...
                              </span>
                            ) : matchScore !== null ? (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                                    matchScore >= 80
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : matchScore >= MIN_MATCH_THRESHOLD
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-rose-100 text-rose-700'
                                  }`}
                                >
                                  {matchScore}%
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRoleSelect(
                                      selectedJobId,
                                      candidate.id
                                    )
                                  }
                                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline"
                                >
                                  ↻ Re-Run
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRoleSelect(selectedJobId, candidate.id)
                                }
                                className="text-xs text-indigo-600 font-extrabold hover:underline"
                              >
                                ↻ Run AI Match
                              </button>
                            )}
                          </div>

                          {!isAnalyzingMatch && aiMatchData?.brief_analysis && (
                            <p className="text-xs text-slate-600 italic border-b border-slate-200 pb-2">
                              &ldquo;{aiMatchData.brief_analysis}&rdquo;
                            </p>
                          )}

                          {salaryFails && (
                            <div className="flex items-start gap-1.5 text-rose-600 text-xs font-medium">
                              <svg
                                className="w-4 h-4 shrink-0 mt-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                ></path>
                              </svg>
                              <span>
                                Dealbreaker: Candidate minimum ($
                                {(candidate.min_salary_expectation / 1000).toFixed(
                                  0
                                )}
                                k/yr) exceeds role max budget ($
                                {(annualizedJobMax / 1000).toFixed(0)}k/yr).
                              </span>
                            </div>
                          )}

                          {modelFails && (
                            <div className="flex items-start gap-1.5 text-rose-600 text-xs font-medium">
                              <svg
                                className="w-4 h-4 shrink-0 mt-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                ></path>
                              </svg>
                              <span className="capitalize">
                                Dealbreaker: Candidate requires{' '}
                                {candidate.preferred_work_model}, but this role
                                is {selectedJob.work_model}.
                              </span>
                            </div>
                          )}

                          {empTypeFails && (
                            <div className="flex items-start gap-1.5 text-rose-600 text-xs font-medium">
                              <svg
                                className="w-4 h-4 shrink-0 mt-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                ></path>
                              </svg>
                              <span>
                                Dealbreaker: Role is {selectedJobEmpType}, but
                                candidate only accepts{' '}
                                {acceptedEmploymentTypes.join(', ')}.
                              </span>
                            </div>
                          )}

                          {scoreFails && (
                            <div className="flex items-start gap-1.5 text-rose-600 text-xs font-medium">
                              <svg
                                className="w-4 h-4 shrink-0 mt-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                ></path>
                              </svg>
                              <span>
                                Dealbreaker: AI Match Score ({matchScore}%) is
                                below the {MIN_MATCH_THRESHOLD}% minimum
                                relevance threshold.
                              </span>
                            </div>
                          )}

                          {!isAnalyzingMatch &&
                            !hasDealbreaker &&
                            matchScore !== null && (
                              <div className="flex items-start gap-1.5 text-emerald-600 text-xs font-medium">
                                <svg
                                  className="w-4 h-4 shrink-0 mt-0.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  ></path>
                                </svg>
                                <span>
                                  Meets {MIN_MATCH_THRESHOLD}%+ relevance and
                                  all dealbreakers. Clear to pitch!
                                </span>
                              </div>
                            )}
                        </div>
                      )}

                      {feedback && (
                        <div
                          className={`text-xs font-bold p-3 rounded-xl flex flex-col gap-2 ${
                            feedback.type === 'error'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <span>{feedback.text}</span>
                          {feedback.type === 'error' &&
                            selectedJobId &&
                            !isAnalyzingMatch && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRoleSelect(selectedJobId, candidate.id)
                                }
                                className="self-start px-3 py-1.5 bg-rose-700 text-white rounded-lg hover:bg-rose-800 transition-colors text-xs font-extrabold shadow-sm"
                              >
                                ↻ Try AI Match Again
                              </button>
                            )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setPitchCandidateId(null)
                            setSelectedJobId('')
                            setAiMatchData(null)
                          }}
                          className="flex-1 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handlePitch}
                          disabled={
                            !selectedJobId ||
                            isSending ||
                            isAnalyzingMatch ||
                            hasDealbreaker ||
                            matchScore === null ||
                            liveCredits < 1
                          }
                          className="flex-1 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-indigo-600 disabled:opacity-50"
                        >
                          {isSending
                            ? 'Sending...'
                            : isAnalyzingMatch
                            ? 'Analyzing (Up to 30s)...'
                            : 'Send Pitch'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setPitchCandidateId(candidate.id)
                        setFeedback(null)
                        setSelectedJobId('')
                        setAiMatchData(null)
                      }}
                      className="w-full md:w-auto px-6 py-3 bg-white border-2 border-slate-900 text-slate-900 font-bold rounded-xl hover:bg-slate-900 hover:text-white transition-colors"
                    >
                      Request Connection
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}