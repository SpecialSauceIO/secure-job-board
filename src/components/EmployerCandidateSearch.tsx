'use client'

import { useState, useEffect, useMemo } from 'react'
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
import {
  STANDARD_INDUSTRY_VERTICALS,
  normalizeIndustryVertical,
} from '@/constants/industries'
import {
  CANDIDATE_EDUCATION_LEVELS,
  normalizeCandidateEducation,
} from '@/constants/education'
import {
  LanguageEntry,
  STANDARD_LANGUAGES,
  normalizeLanguageList,
  evaluateLanguageRequirements,
} from '@/constants/languages'
import { getQuickCandidateCardRank } from '@/constants/gamification'
import { RankAndFounderPill } from '@/components/ReputationBadgeCase'

const MIN_MATCH_THRESHOLD = 40

const EMPLOYMENT_TYPES = [
  'Full-Time (W-2)',
  'Contract (1099 / Corp-to-Corp)',
  'Contract-to-Hire',
  'Part-Time',
  'Seasonal / Temporary',
]

type CandidateSortOption =
  | 'rank_high'
  | 'exp_high'
  | 'exp_low'
  | 'salary_low'
  | 'salary_high'
  | 'work_model'

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

function getCandidateIndustryVertical(candidate: any): string {
  if (candidate?.industry_vertical) {
    return normalizeIndustryVertical(candidate.industry_vertical)
  }
  const rawSkills = Array.isArray(candidate?.structured_skills)
    ? candidate.structured_skills
    : []
  const metaEntry = rawSkills.find(
    (item: any) => item && item._ss_pref_meta === true
  )
  if (metaEntry?.industry_vertical) {
    return normalizeIndustryVertical(metaEntry.industry_vertical)
  }
  return ''
}

function getCandidateEducationLevel(candidate: any): string {
  if (candidate?.education_level) {
    return normalizeCandidateEducation(candidate.education_level)
  }
  const rawSkills = Array.isArray(candidate?.structured_skills)
    ? candidate.structured_skills
    : []
  const metaEntry = rawSkills.find(
    (item: any) => item && item._ss_pref_meta === true
  )
  if (metaEntry?.education_level) {
    return normalizeCandidateEducation(metaEntry.education_level)
  }
  return ''
}

function getCandidateCertifications(candidate: any): string {
  if (candidate?.certifications) {
    return String(candidate.certifications).trim()
  }
  const rawSkills = Array.isArray(candidate?.structured_skills)
    ? candidate.structured_skills
    : []
  const metaEntry = rawSkills.find(
    (item: any) => item && item._ss_pref_meta === true
  )
  return metaEntry?.certifications ? String(metaEntry.certifications).trim() : ''
}

function getCandidateLanguages(candidate: any): LanguageEntry[] {
  if (Array.isArray(candidate?.languages) && candidate.languages.length > 0) {
    return normalizeLanguageList(candidate.languages, true)
  }
  const rawSkills = Array.isArray(candidate?.structured_skills)
    ? candidate.structured_skills
    : []
  const metaEntry = rawSkills.find(
    (item: any) => item && item._ss_pref_meta === true
  )
  return normalizeLanguageList(metaEntry?.languages, true)
}

function getJobEmploymentType(job: any): string {
  const rawReqs = Array.isArray(job?.structured_requirements)
    ? job.structured_requirements
    : []
  const metaItem =
    rawReqs.find((r: any) => r && r._ss_job_meta === true) || job?.job_meta || {}
  return job?.employment_type || metaItem?.employment_type || 'Full-Time (W-2)'
}

function getJobRequiredLanguages(job: any): LanguageEntry[] {
  const rawReqs = Array.isArray(job?.structured_requirements)
    ? job.structured_requirements
    : []
  const metaItem =
    rawReqs.find((r: any) => r && r._ss_job_meta === true) || job?.job_meta || {}
  return normalizeLanguageList(
    job?.required_languages || metaItem?.required_languages,
    true
  )
}

export default function EmployerCandidateSearch({
  activeJobs,
  credits,
}: {
  activeJobs: any[]
  credits: number
}) {
  const [query, setQuery] = useState('')
  const [workModel, setWorkModel] = useState('')
  const [employmentType, setEmploymentType] = useState('all')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [educationFilter, setEducationFilter] = useState('all')
  const [languageFilter, setLanguageFilter] = useState('all')
  const [sortBy, setSortBy] = useState<CandidateSortOption>('rank_high')
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
    } catch {
      setFeedback({
        type: 'error',
        text: 'Network or server timeout while calculating AI Match. Please click "Try AI Match Again" to retry.',
      })
    } finally {
      setIsAnalyzingMatch(false)
    }
  }

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
        text: `Connection request sent (+150 XP • Ref: ${
          result.referenceId || 'SS'
        })! 1 Credit deducted.`,
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

  const filteredAndSortedCandidates = useMemo(() => {
    const filtered = candidates.filter((candidate) => {
      const cid = String(candidate.id)
      if (onlyShortlisted && !savedCandidateIds.includes(cid)) {
        return false
      }
      if (employmentType !== 'all') {
        const acceptedTypes = getCandidateEmploymentTypes(candidate)
        if (
          !acceptedTypes.some(
            (t) =>
              t.toLowerCase() === employmentType.toLowerCase() ||
              t.toLowerCase().includes(employmentType.toLowerCase())
          )
        ) {
          return false
        }
      }
      if (industryFilter !== 'all') {
        const candIndustry = getCandidateIndustryVertical(candidate)
        if (candIndustry.toLowerCase() !== industryFilter.toLowerCase()) {
          return false
        }
      }
      if (educationFilter !== 'all') {
        const candEdu = getCandidateEducationLevel(candidate)
        const candCerts = getCandidateCertifications(candidate)
        if (
          educationFilter === 'HAS_CERTS' &&
          (!candCerts || candCerts.length === 0)
        ) {
          return false
        } else if (
          educationFilter !== 'HAS_CERTS' &&
          candEdu.toLowerCase() !== educationFilter.toLowerCase()
        ) {
          return false
        }
      }
      if (languageFilter !== 'all') {
        const candLangs = getCandidateLanguages(candidate)
        if (
          !candLangs.some(
            (l) => l.language.toLowerCase() === languageFilter.toLowerCase()
          )
        ) {
          return false
        }
      }
      return true
    })

    const parseExp = (val: any): number => {
      const num = parseFloat(String(val || '0'))
      return isNaN(num) ? 0 : num
    }

    const workModelPriority = (model?: string): number => {
      const m = (model || '').toLowerCase().trim()
      if (m.includes('remote')) return 1
      if (m.includes('hybrid')) return 2
      if (m.includes('onsite') || m.includes('on-site')) return 3
      return 4
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'rank_high': {
          const rankA = getQuickCandidateCardRank(a)
          const rankB = getQuickCandidateCardRank(b)
          if (rankB.totalXp !== rankA.totalXp) {
            return rankB.totalXp - rankA.totalXp
          }
          return parseExp(b.experience_years) - parseExp(a.experience_years)
        }
        case 'exp_high':
          return parseExp(b.experience_years) - parseExp(a.experience_years)
        case 'exp_low':
          return parseExp(a.experience_years) - parseExp(b.experience_years)
        case 'salary_low': {
          const aSal =
            Number(a.min_salary_expectation) || Number.MAX_SAFE_INTEGER
          const bSal =
            Number(b.min_salary_expectation) || Number.MAX_SAFE_INTEGER
          return aSal - bSal
        }
        case 'salary_high':
          return (
            (Number(b.min_salary_expectation) || 0) -
            (Number(a.min_salary_expectation) || 0)
          )
        case 'work_model':
          return (
            workModelPriority(a.preferred_work_model) -
            workModelPriority(b.preferred_work_model)
          )
        default:
          return 0
      }
    })
  }, [
    candidates,
    onlyShortlisted,
    savedCandidateIds,
    employmentType,
    industryFilter,
    educationFilter,
    languageFilter,
    sortBy,
  ])

  return (
    <div className="space-y-6">
      {/* Search Header & Filters */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
      >
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
              placeholder="Search skills, certifications, languages, or keywords (e.g., Next.js, Spanish, AWS, PMP)..."
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

        {/* Middle Row: Work Model, Employment Type, & Cascading US Location Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-2">
            <select
              value={workModel}
              onChange={(e) => setWorkModel(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:outline-none disabled:opacity-50 cursor-pointer"
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

        {/* Bottom Organizer Row: Industry Vertical + Education/Certs + Language + Sort By */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          <div className="flex items-center gap-2">
            <label
              htmlFor="employer-industry-filter"
              className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap shrink-0"
            >
              Industry:
            </label>
            <select
              id="employer-industry-filter"
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

          <div className="flex items-center gap-2">
            <label
              htmlFor="employer-education-filter"
              className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap shrink-0"
            >
              Education:
            </label>
            <select
              id="employer-education-filter"
              value={educationFilter}
              onChange={(e) => setEducationFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Education &amp; Credentials</option>
              <option value="HAS_CERTS">
                🏅 Holds Active Certifications
              </option>
              {CANDIDATE_EDUCATION_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="employer-language-filter"
              className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap shrink-0"
            >
              Language:
            </label>
            <select
              id="employer-language-filter"
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Spoken/Written Languages</option>
              {STANDARD_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  🌐 {lang}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="employer-candidate-sort"
              className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap shrink-0"
            >
              Sort By:
            </label>
            <select
              id="employer-candidate-sort"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as CandidateSortOption)
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="rank_high">
                🥇 Highest Profile Level &amp; XP (Rank Tier)
              </option>
              <option value="exp_high">
                Experience Level (Most Experienced First)
              </option>
              <option value="exp_low">
                Experience Level (Entry / Junior First)
              </option>
              <option value="salary_low">
                Min Salary Expectation (Lowest First)
              </option>
              <option value="salary_high">
                Min Salary Expectation (Highest First)
              </option>
              <option value="work_model">
                Work Arrangement (Remote → Hybrid → On-site)
              </option>
            </select>
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
            <p className="text-slate-500 font-medium">
              Scanning passive talent pool...
            </p>
          </div>
        ) : filteredAndSortedCandidates.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {onlyShortlisted
                ? 'No candidates in your Shortlist yet'
                : 'No candidates match your current filters'}
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              {onlyShortlisted
                ? 'Click "Shortlist" on any anonymous candidate card to assemble a comparison pool before pitching.'
                : 'Try resetting your Industry Vertical, Education, Language, or Employment Type filters.'}
            </p>
            {(industryFilter !== 'all' ||
              educationFilter !== 'all' ||
              languageFilter !== 'all' ||
              employmentType !== 'all' ||
              onlyShortlisted) && (
              <button
                type="button"
                onClick={() => {
                  setIndustryFilter('all')
                  setEducationFilter('all')
                  setLanguageFilter('all')
                  setEmploymentType('all')
                  setOnlyShortlisted(false)
                }}
                className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-extrabold hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                Reset Active Filters →
              </button>
            )}
          </div>
        ) : (
          filteredAndSortedCandidates.map((candidate) => {
            const cid = String(candidate.id)
            const isShortlisted = savedCandidateIds.includes(cid)
            const candidateIndustry = getCandidateIndustryVertical(candidate)
            const candidateEdu = getCandidateEducationLevel(candidate)
            const candidateCerts = getCandidateCertifications(candidate)
            const candidateLanguages = getCandidateLanguages(candidate)
            const rankInfo = getQuickCandidateCardRank(candidate)

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

            const acceptedEmploymentTypes =
              getCandidateEmploymentTypes(candidate)

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
            let langFails = false
            let langMissingDetails: string[] = []
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
                const selectedJobLangs = getJobRequiredLanguages(selectedJob)

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
                      t.toLowerCase() === selectedJobEmpType.toLowerCase() ||
                      selectedJobEmpType
                        .toLowerCase()
                        .includes(t.toLowerCase())
                  )
                ) {
                  empTypeFails = true
                }

                const langCheck = evaluateLanguageRequirements(
                  candidateLanguages,
                  selectedJobLangs
                )
                if (!langCheck.passes) {
                  langFails = true
                  langMissingDetails = langCheck.missingDescriptions
                }

                if (
                  !isAnalyzingMatch &&
                  matchScore !== null &&
                  matchScore < MIN_MATCH_THRESHOLD
                ) {
                  scoreFails = true
                }

                hasDealbreaker =
                  salaryFails ||
                  modelFails ||
                  empTypeFails ||
                  langFails ||
                  scoreFails
              }
            }

            return (
              <div
                key={candidate.id}
                className={`bg-white p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between gap-6 transition-all ${
                  isShortlisted
                    ? 'border-2 border-amber-500 shadow-sm'
                    : rankInfo.isFounder
                    ? 'border-2 border-amber-500 shadow-sm ring-1 ring-amber-400/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex-1 space-y-3">
                  {/* Top Header Row: Candidate Title, Rank/Founder Pill, Verified Check, and Shortlist Button */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-lg font-black text-slate-900">
                          Anonymous Candidate #{displayId}
                        </h3>

                        <RankAndFounderPill
                          level={rankInfo.level}
                          tier={rankInfo.tier}
                          isFounder={rankInfo.isFounder}
                          founderText="Founding Member"
                          size="xs"
                        />

                        {isCandidateVerified && (
                          <span className="text-emerald-700 text-xs font-bold">
                            ✓ Verified
                          </span>
                        )}
                      </div>

                      {/* Clean Inline Primary Metadata Row (No Colored Pills!) */}
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-slate-600">
                        {candidateIndustry && (
                          <>
                            <span className="font-bold text-slate-800">
                              {candidateIndustry}
                            </span>
                            <span className="text-slate-300">•</span>
                          </>
                        )}
                        {candidate.experience_years && (
                          <>
                            <span>{candidate.experience_years} Yrs Exp</span>
                            <span className="text-slate-300">•</span>
                          </>
                        )}
                        <span className="text-emerald-700 font-bold">
                          Min: $
                          {candidate.min_salary_expectation
                            ? (candidate.min_salary_expectation / 1000).toFixed(
                                0
                              ) + 'k'
                            : 'Open'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="capitalize">
                          {candidate.preferred_work_model || 'Flexible'} Model
                        </span>
                        {candidate.location && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>{candidate.location}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Save to Shortlist Button */}
                    <button
                      type="button"
                      disabled={togglingCandidateId === cid}
                      onClick={() => handleToggleShortlist(cid)}
                      className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        isShortlisted
                          ? 'bg-amber-50 border-amber-400 text-amber-900'
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
                      {isShortlisted ? 'Shortlisted' : 'Shortlist'}
                    </button>
                  </div>

                  {/* Clean Inline Credentials & Availability Row */}
                  <div className="text-xs text-slate-600 font-medium flex flex-wrap items-center gap-x-3 gap-y-1">
                    {candidateEdu && (
                      <span>
                        <strong className="text-slate-800">Education:</strong>{' '}
                        {candidateEdu}
                      </span>
                    )}
                    {candidateCerts && (
                      <span>
                        <strong className="text-slate-800">Certs:</strong>{' '}
                        {candidateCerts}
                      </span>
                    )}
                    {candidateLanguages.length > 0 && (
                      <span>
                        <strong className="text-slate-800">Languages:</strong>{' '}
                        {candidateLanguages
                          .map(
                            (l) =>
                              `${l.language} (${l.modality.split(' ')[0]} • ${
                                l.proficiency
                              })`
                          )
                          .join(', ')}
                      </span>
                    )}
                    {acceptedEmploymentTypes.length > 0 && (
                      <span>
                        <strong className="text-slate-800">Open to:</strong>{' '}
                        {acceptedEmploymentTypes.join(', ')}
                      </span>
                    )}
                  </div>

                  {/* Bio Preview */}
                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {candidate.bio || 'Candidate has not provided a summary.'}
                  </p>

                  {/* Clean Inline Skills Line */}
                  {candidateSkillStrings.length > 0 && (
                    <div className="text-xs text-slate-500 pt-1 border-t border-slate-100">
                      <strong className="text-slate-700">Core Skills:</strong>{' '}
                      {candidateSkillStrings.slice(0, 8).join(' • ')}
                      {candidateSkillStrings.length > 8 &&
                        ` (+${candidateSkillStrings.length - 8} more)`}
                    </div>
                  )}
                </div>

                {/* Right Column: Pitch Action & Dealbreaker Firewall */}
                <div className="flex flex-col justify-center shrink-0 w-full md:w-[340px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  {pitchCandidateId === candidate.id ? (
                    <div className="space-y-3 animate-in fade-in zoom-in duration-200">
                      <select
                        value={selectedJobId}
                        disabled={isAnalyzingMatch}
                        onChange={(e) =>
                          handleRoleSelect(e.target.value, candidate.id)
                        }
                        className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-bold py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                      >
                        <option value="">Select a role to pitch...</option>
                        {activeJobs.map((job) => (
                          <option key={job.id} value={job.id}>
                            {job.title} ({getJobEmploymentType(job)})
                          </option>
                        ))}
                      </select>

                      {isAnalyzingMatch && (
                        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-start gap-2.5 animate-pulse">
                          <div className="w-4 h-4 mt-0.5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin shrink-0" />
                          <div className="text-xs text-indigo-950">
                            <span className="font-extrabold block">
                              Analyzing 5-Point AI Fit (Up to 30s)...
                            </span>
                          </div>
                        </div>
                      )}

                      {selectedJob && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <span className="font-bold text-slate-700">
                              AI Skill Match (Min {MIN_MATCH_THRESHOLD}%)
                            </span>

                            {isAnalyzingMatch ? (
                              <span className="font-semibold text-indigo-600">
                                Scoring...
                              </span>
                            ) : matchScore !== null ? (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded-md font-bold ${
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
                                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
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
                                className="text-indigo-600 font-extrabold hover:underline cursor-pointer"
                              >
                                ↻ Run AI Match
                              </button>
                            )}
                          </div>

                          {!isAnalyzingMatch && aiMatchData?.brief_analysis && (
                            <p className="text-slate-600 italic border-b border-slate-200 pb-2">
                              &ldquo;{aiMatchData.brief_analysis}&rdquo;
                            </p>
                          )}

                          {salaryFails && (
                            <div className="text-rose-600 font-medium">
                              • Dealbreaker: Candidate min ($
                              {(candidate.min_salary_expectation / 1000).toFixed(
                                0
                              )}
                              k/yr) exceeds role max budget ($
                              {(annualizedJobMax / 1000).toFixed(0)}k/yr).
                            </div>
                          )}

                          {modelFails && (
                            <div className="text-rose-600 font-medium capitalize">
                              • Dealbreaker: Candidate requires{' '}
                              {candidate.preferred_work_model}, role is{' '}
                              {selectedJob.work_model}.
                            </div>
                          )}

                          {empTypeFails && (
                            <div className="text-rose-600 font-medium">
                              • Dealbreaker: Role is {selectedJobEmpType},
                              candidate accepts{' '}
                              {acceptedEmploymentTypes.join(', ')}.
                            </div>
                          )}

                          {langFails && (
                            <div className="text-rose-600 font-medium">
                              • Dealbreaker (Language):{' '}
                              {langMissingDetails.join('; ')}.
                            </div>
                          )}

                          {scoreFails && (
                            <div className="text-rose-600 font-medium">
                              • Dealbreaker: AI Match ({matchScore}%) is below{' '}
                              {MIN_MATCH_THRESHOLD}% threshold.
                            </div>
                          )}

                          {!isAnalyzingMatch &&
                            !hasDealbreaker &&
                            matchScore !== null && (
                              <div className="text-emerald-700 font-bold">
                                ✓ Meets {MIN_MATCH_THRESHOLD}%+ relevance &amp;
                                all dealbreakers!
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
                                className="self-start px-3 py-1 bg-rose-700 text-white rounded-lg hover:bg-rose-800 transition-colors text-xs font-extrabold cursor-pointer"
                              >
                                ↻ Try AI Match Again
                              </button>
                            )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPitchCandidateId(null)
                            setSelectedJobId('')
                            setAiMatchData(null)
                          }}
                          className="flex-1 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handlePitch}
                          disabled={
                            !selectedJobId ||
                            isSending ||
                            isAnalyzingMatch ||
                            hasDealbreaker ||
                            matchScore === null ||
                            liveCredits < 1
                          }
                          className="flex-1 py-2 bg-slate-900 text-white text-xs font-extrabold rounded-xl hover:bg-indigo-600 disabled:opacity-50 cursor-pointer"
                        >
                          {isSending
                            ? 'Sending...'
                            : isAnalyzingMatch
                            ? 'Scoring...'
                            : 'Send Pitch'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setPitchCandidateId(candidate.id)
                        setFeedback(null)
                        setSelectedJobId('')
                        setAiMatchData(null)
                      }}
                      className="w-full md:w-auto px-5 py-2.5 bg-white border-2 border-slate-900 text-slate-900 text-xs font-extrabold rounded-xl hover:bg-slate-900 hover:text-white transition-colors cursor-pointer"
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