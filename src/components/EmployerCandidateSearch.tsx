'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
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
  CANDIDATE_AVAILABILITY_STATUSES,
  normalizeCandidateAvailability,
  isCandidatePaused,
  getAvailabilityBadgeClasses,
} from '@/constants/availability'
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

const SEARCH_PILLAR_SUBTITLES: Record<string, string> = {
  'Core Competencies': 'Required & Transferable Role Skills',
  'Skill Tenure': 'Per-Skill Depth & Career-Changer Fair',
  'Logistics & Pay': 'Pay, Work Model, Auth & Start Window',
  'Industry & Creds': 'Vertical, Education & Certifications',
  'Execution & Comm.': 'Ownership, Collaboration & Languages',
}

function normalizeSearchPillarLabel(raw: string): string {
  const s = String(raw || '').trim().toLowerCase()
  if (s.includes('technical') || s.includes('competenc')) return 'Core Competencies'
  if (s.includes('experience') || s.includes('tenure')) return 'Skill Tenure'
  if (s.includes('role') || s.includes('logistic') || s.includes('alignment')) return 'Logistics & Pay'
  if (s.includes('domain') || s.includes('industry') || s.includes('cred')) return 'Industry & Creds'
  if (s.includes('culture') || s.includes('soft') || s.includes('execution') || s.includes('comm')) return 'Execution & Comm.'
  return raw
}

function getCandidateAvailability(candidate: any): string {
  if (candidate?.availability_window) {
    return normalizeCandidateAvailability(String(candidate.availability_window))
  }
  const rawSkills = Array.isArray(candidate?.structured_skills)
    ? candidate.structured_skills
    : []
  const metaEntry = rawSkills.find(
    (item: any) => item && item._ss_pref_meta === true
  )
  return normalizeCandidateAvailability(
    metaEntry?.availability_window ? String(metaEntry.availability_window) : null
  )
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
  const [sortBy, setSortBy] = useState<CandidateSortOption>('rank_high')

  // Collapsible Advanced Filters Drawer
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [employmentType, setEmploymentType] = useState('all')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [educationFilter, setEducationFilter] = useState('all')
  const [languageFilter, setLanguageFilter] = useState('all')
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
  // Persistent cache keyed by `${candidateId}_${jobId}` + last selected jobId per candidate
  const [matchCacheMap, setMatchCacheMap] = useState<Record<string, any>>({})
  const [candidateJobMap, setCandidateJobMap] = useState<Record<string, string>>({})
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

    try {
      const savedMatches = localStorage.getItem('ss_emp_match_cache_v1')
      if (savedMatches) {
        const parsed = JSON.parse(savedMatches)
        if (parsed && typeof parsed === 'object') setMatchCacheMap(parsed)
      }
      const savedJobMap = localStorage.getItem('ss_emp_cand_job_map_v1')
      if (savedJobMap) {
        const parsedJobs = JSON.parse(savedJobMap)
        if (parsedJobs && typeof parsedJobs === 'object') setCandidateJobMap(parsedJobs)
      }
    } catch {}

    const fetchInitial = async () => {
      setIsLoading(true)
      const [result, bookmarks, persisted] = await Promise.all([
        searchCandidates('', '', ''),
        getUserBookmarks(),
        getPersistedMatchCache(),
      ])
      if (result.data) setCandidates(result.data)
      if (bookmarks.savedCandidateIds) {
        setSavedCandidateIds(bookmarks.savedCandidateIds)
      }
      if (persisted?.cache) {
        const empEntries: Record<string, any> = {}
        const jobEntries: Record<string, string> = {}
        for (const [k, v] of Object.entries(persisted.cache)) {
          if (k.startsWith('emp_') && v && typeof v === 'object') {
            const rest = k.slice('emp_'.length)
            empEntries[rest] = v
            const lastUnderscore = rest.lastIndexOf('_')
            if (lastUnderscore !== -1) {
              const cId = rest.slice(0, lastUnderscore)
              const jId = rest.slice(lastUnderscore + 1)
              jobEntries[cId] = jId
            }
          }
        }
        if (Object.keys(empEntries).length > 0) {
          setMatchCacheMap((prev) => {
            const merged = { ...empEntries, ...prev }
            try {
              localStorage.setItem('ss_emp_match_cache_v1', JSON.stringify(merged))
            } catch {}
            return merged
          })
          setCandidateJobMap((prev) => {
            const mergedJobs = { ...jobEntries, ...prev }
            try {
              localStorage.setItem('ss_emp_cand_job_map_v1', JSON.stringify(mergedJobs))
            } catch {}
            return mergedJobs
          })
        }
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

  const activeAdvancedCount = [
    employmentType !== 'all',
    industryFilter !== 'all',
    educationFilter !== 'all',
    languageFilter !== 'all',
    Boolean(selectedState),
  ].filter(Boolean).length

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

  const resetAllFilters = async () => {
    setQuery('')
    setWorkModel('')
    setEmploymentType('all')
    setIndustryFilter('all')
    setEducationFilter('all')
    setLanguageFilter('all')
    setSelectedState('')
    setSelectedMetro('')
    setOnlyShortlisted(false)
    setIsLoading(true)
    const result = await searchCandidates('', '', '')
    if (result.data) setCandidates(result.data)
    setIsLoading(false)
  }

  const handleRoleSelect = async (
    jobId: string,
    candidateId: string,
    forceRefresh: boolean = false
  ) => {
    setSelectedJobId(jobId)
    setFeedback(null)

    if (!jobId) {
      setAiMatchData(null)
      return
    }

    const pairKey = `${candidateId}_${jobId}`
    setCandidateJobMap((prev) => {
      const next = { ...prev, [candidateId]: jobId }
      try {
        localStorage.setItem('ss_emp_cand_job_map_v1', JSON.stringify(next))
      } catch {}
      return next
    })

    if (!forceRefresh && matchCacheMap[pairKey]) {
      setAiMatchData(matchCacheMap[pairKey])
      return
    }

    setAiMatchData(null)
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
        analyzeCandidateFit(candidateId, jobId, forceRefresh),
        timeoutPromise,
      ])

      if (result?.data) {
        setAiMatchData(result.data)
        setMatchCacheMap((prev) => {
          const next = { ...prev, [pairKey]: result.data }
          try {
            localStorage.setItem('ss_emp_match_cache_v1', JSON.stringify(next))
          } catch {}
          return next
        })
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
        text: `Connection request sent (Ref:${
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
        } else if (educationFilter !== 'HAS_CERTS') {
          const normCandEdu = normalizeCandidateEducation(candEdu).toLowerCase()
          const normFilter = educationFilter.toLowerCase()
          const isHsOrGedFilter =
            normFilter.includes('high school') || normFilter.includes('ged')
          const isCandHsOrGed =
            normCandEdu.includes('high school') || normCandEdu.includes('ged')

          if (isHsOrGedFilter && isCandHsOrGed) {
            // Both High School Diploma and GED / Equivalency satisfy High School / GED filters
          } else if (normCandEdu !== normFilter) {
            return false
          }
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
      {/* SINGLE UNIFIED COMMAND BAR WITH COLLAPSIBLE ADVANCED FILTERS */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-300 shadow-xs space-y-3.5 border-slate-300"
      >
        {/* Row 1: Keyword Input + Work Model + Sort By + Filters Drawer Toggle + Search Button */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
          <div className="relative flex-1">
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
              placeholder="Search skills, certifications, languages, or keywords..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-300 bg-slate-50 focus:bg-white focus:border-indigo-500 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none border-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex flex-wrap items-center gap-2 shrink-0">
            <select
              value={workModel}
              onChange={(e) => setWorkModel(e.target.value)}
              className="rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2.5 text-xs font-extrabold text-slate-700 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer border-slate-300"
            >
              <option value="">All Work Models</option>
              <option value="remote">Remote Only</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as CandidateSortOption)
              }
              className="rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2.5 text-xs font-extrabold text-slate-700 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer border-slate-300"
            >
              <option value="rank_high">Sort: Highest Rank &amp; XP</option>
              <option value="exp_high">Sort: Most Experienced</option>
              <option value="salary_low">Sort: Lowest Min Salary</option>
              <option value="salary_high">Sort: Highest Min Salary</option>
              <option value="exp_low">Sort: Entry / Junior First</option>
              <option value="work_model">Sort: Work Model</option>
            </select>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-extrabold transition-colors cursor-pointer ${
                showAdvancedFilters || activeAdvancedCount > 0
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span>
                Filters{activeAdvancedCount > 0 ? ` (${activeAdvancedCount})` : ''}
              </span>
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2.5 bg-slate-900 text-white text-xs font-extrabold rounded-xl hover:bg-indigo-600 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? '...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters Drawer */}
        {showAdvancedFilters && (
          <div className="pt-3.5 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 animate-in fade-in duration-150">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Employment Type
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer border-slate-300"
              >
                <option value="all">All Types</option>
                {EMPLOYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Industry Vertical
              </label>
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer border-slate-300"
              >
                <option value="all">All 28 Industries</option>
                {STANDARD_INDUSTRY_VERTICALS.map((vertical) => (
                  <option key={vertical} value={vertical}>
                    {vertical}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Education / Certs
              </label>
              <select
                value={educationFilter}
                onChange={(e) => setEducationFilter(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer border-slate-300"
              >
                <option value="all">All Credentials</option>
                <option value="HAS_CERTS">Holds Active Certifications</option>
                {CANDIDATE_EDUCATION_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Language
              </label>
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer border-slate-300"
              >
                <option value="all">All Languages</option>
                {STANDARD_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                US State
              </label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value)
                  setSelectedMetro('')
                }}
                className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer border-slate-300"
              >
                <option value="">All US States</option>
                <option value="REMOTE_US">🇺🇸 US Remote</option>
                {US_STATES_AND_METROS.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.name} ({st.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Metro Area
              </label>
              <select
                disabled={!selectedState}
                value={selectedMetro}
                onChange={(e) => setSelectedMetro(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none disabled:opacity-50 cursor-pointer border-slate-300"
              >
                <option value="">
                  {!selectedState
                    ? 'Select state...'
                    : selectedState === 'REMOTE_US'
                    ? 'All Timezones'
                    : `All ${selectedState} Metros`}
                </option>
                {metroOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Compact Status & Utility Row */}
        <div className="pt-2 border-t border-slate-300 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Showing{' '}
              <strong className="text-slate-900">
                {filteredAndSortedCandidates.length}
              </strong>{' '}
              verified{' '}
              {filteredAndSortedCandidates.length === 1
                ? 'candidate'
                : 'candidates'}
            </span>

            <button
              type="button"
              onClick={() => setOnlyShortlisted((prev) => !prev)}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold border transition-colors cursor-pointer ${
                onlyShortlisted
                  ? 'bg-amber-50 border-slate-300 text-amber-900'
                  : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100'
              }`}
            >
              ★ Shortlisted ({savedCandidateIds.length})
            </button>

            {employmentType !== 'all' && (
              <button
                type="button"
                onClick={() => setEmploymentType('all')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
              >
                {employmentType} ✕
              </button>
            )}

            {industryFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setIndustryFilter('all')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
              >
                {industryFilter} ✕
              </button>
            )}

            {languageFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setLanguageFilter('all')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
              >
                {languageFilter} ✕
              </button>
            )}

            {(activeAdvancedCount > 0 ||
              workModel !== '' ||
              query.trim() !== '' ||
              onlyShortlisted) && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-indigo-600 hover:text-indigo-800 font-extrabold cursor-pointer ml-1"
              >
                Reset all
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span>
              <strong className="text-slate-900">{liveCredits}</strong> Pitch{' '}
              {liveCredits === 1 ? 'Credit' : 'Credits'} Available
            </span>
            <Link
              href="/dashboard/employer/billing"
              className="text-indigo-600 hover:text-indigo-800 font-extrabold"
            >
              + Top Up
            </Link>
          </div>
        </div>
      </form>

      {/* Out of Credits Warning Banner */}
      {liveCredits < 1 && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
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
          <div className="py-12 text-center bg-white rounded-2xl border-2 border-slate-300 shadow-sm border-slate-300">
            <div className="inline-block w-8 h-8 border-4 border-slate-300 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">
              Scanning passive talent pool...
            </p>
          </div>
        ) : filteredAndSortedCandidates.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border-2 border-slate-300 text-center shadow-sm border-slate-300">
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {onlyShortlisted
                ? 'No candidates in your Shortlist yet'
                : 'No candidates match your current filters'}
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              {onlyShortlisted
                ? 'Click "Shortlist" on any anonymous candidate card to assemble a comparison pool before pitching.'
                : 'Try resetting your active filters to broaden your search.'}
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-extrabold hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              Reset Active Filters →
            </button>
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
                className={`bg-white p-6 md:p-8 rounded-2xl border shadow-sm space-y-5 transition-all ${
                  isShortlisted
                    ? 'border-2 border-slate-300 shadow-sm'
                    : rankInfo.isFounder
                    ? 'border-2 border-slate-300 shadow-sm '
                    : 'border-2 border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="flex-1 space-y-4">
                  {/* Row 1: Fixed Top Identity Bar & Shortlist + Min Pay Group */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">
                        Anonymous Candidate #{displayId}
                      </h3>

                      <div className="shrink-0">
                        <RankAndFounderPill
                          level={rankInfo.level}
                          tier={rankInfo.tier}
                          isFounder={rankInfo.isFounder}
                          founderText="Founding Member"
                          size="xs"
                        />
                      </div>
                    </div>

                    {/* Right Side: Shortlist Button + Min Compensation Pill */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={togglingCandidateId === cid}
                        onClick={() => handleToggleShortlist(cid)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                          isShortlisted
                            ? 'bg-amber-50 border-amber-300 text-amber-900'
                            : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900'
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

                      <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-black text-xs sm:text-sm">
                        Min: $
                        {candidate.min_salary_expectation
                          ? (candidate.min_salary_expectation / 1000).toFixed(0) + 'k'
                          : 'Open'}
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Dedicated Trust, Industry & Availability Sub-Bar */}
                  <div className="pb-3 border-b border-slate-300 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                    <span className="text-emerald-700 font-bold">
                      {isCandidateVerified ? '✓ Identity Verified' : '✓ Blind Vault Active'}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-bold text-slate-800">
                      {candidateIndustry || 'General / Cross-Industry'}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-[11px] border ${getAvailabilityBadgeClasses(
                        getCandidateAvailability(candidate)
                      )}`}
                    >
                      {isCandidatePaused(getCandidateAvailability(candidate)) ? '⏸' : '⚡'}{' '}
                      {getCandidateAvailability(candidate)}
                    </span>
                    {candidate.location && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600 font-medium">{candidate.location}</span>
                      </>
                    )}
                  </div>

                  {/* Row 3: Uniform 4-Column Candidate Specification Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50/90 border border-slate-300 text-xs">
                    <div className="min-w-0">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Experience &amp; Model
                      </span>
                      <span className="font-bold text-slate-900 leading-snug block mt-0.5 capitalize">
                        {candidate.experience_years ? `${candidate.experience_years} Yrs Exp` : 'Exp Verified in Vault'} • {candidate.preferred_work_model || 'Flexible'} Model
                      </span>
                    </div>

                    <div className="min-w-0">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Open To (Work Types)
                      </span>
                      <span
                        title={acceptedEmploymentTypes.join(', ')}
                        className="font-bold text-slate-900 leading-snug block mt-0.5"
                      >
                        {acceptedEmploymentTypes.length > 0
                          ? acceptedEmploymentTypes.join(', ')
                          : 'Full-Time (W-2)'}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Education &amp; Credentials
                      </span>
                      <span
                        title={`${candidateEdu || 'Skills & Experience First'}${candidateCerts ? ' • ' + candidateCerts : ''}`}
                        className="font-bold text-slate-900 leading-snug block mt-0.5"
                      >
                        {candidateEdu || 'Skills & Experience First'}
                        {candidateCerts ? ` • ${candidateCerts}` : ''}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Verified Languages
                      </span>
                      <span className="font-bold text-slate-900 leading-snug block mt-0.5">
                        {candidateLanguages.length > 0
                          ? candidateLanguages
                              .map((l) => `${l.language} (${l.proficiency})`)
                              .join(', ')
                          : 'English (Fluent / Native)'}
                      </span>
                    </div>
                  </div>

                  {/* Row 4: Uniform 2-Line Bio Summary */}
                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {candidate.bio || 'Candidate has not provided a written summary yet.'}
                  </p>

                  {/* Row 5: Always-Present Core Skills Bar */}
                  <div className="text-xs text-slate-600 pt-2.5 border-t border-slate-200 truncate">
                    <strong className="text-slate-800 uppercase tracking-wider text-[11px] mr-2">
                      Core Skills:
                    </strong>
                    {candidateSkillStrings.length > 0 ? (
                      <>
                        {candidateSkillStrings.slice(0, 8).join(' • ')}
                        {candidateSkillStrings.length > 8 &&
                          ` (+${candidateSkillStrings.length - 8} more)`}
                      </>
                    ) : (
                      <span className="text-slate-400 italic">
                        Structured skill matrix pending resume upload
                      </span>
                    )}
                  </div>
                </div>

                {/* Full-Width Pitch Role Selector & 5-Point AI Fit Radar Panel */}
                <div className="pt-4 border-t border-slate-300">
                  {pitchCandidateId === candidate.id ? (
                    <div className="space-y-5 animate-in fade-in duration-200">
                      {/* Role Selector Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border-2 border-slate-300 border-slate-300">
                        <div className="flex-1">
                          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                            Select Active Role to Evaluate &amp; Pitch
                          </label>
                          <select
                            value={selectedJobId}
                            disabled={isAnalyzingMatch}
                            onChange={(e) =>
                              handleRoleSelect(e.target.value, candidate.id)
                            }
                            className="w-full text-xs sm:text-sm rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-bold py-2.5 px-3.5 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 cursor-pointer border-slate-300"
                          >
                            <option value="">Choose one of your open roles...</option>
                            {activeJobs.map((job) => (
                              <option key={job.id} value={job.id}>
                                {job.title} ({getJobEmploymentType(job)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {selectedJobId && !isAnalyzingMatch && (
                            <button
                              type="button"
                              onClick={() =>
                                handleRoleSelect(selectedJobId, candidate.id, true)
                              }
                              className="px-3.5 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-slate-700 text-xs font-extrabold hover:bg-slate-100 transition-colors cursor-pointer border-slate-300"
                            >
                              ↻ Re-Run Fit
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setPitchCandidateId(null)
                              setSelectedJobId('')
                              setAiMatchData(null)
                              setFeedback(null)
                            }}
                            className="px-3.5 py-2.5 rounded-xl bg-slate-200/80 text-slate-700 text-xs font-bold hover:bg-slate-300 transition-colors cursor-pointer"
                          >
                            Close
                          </button>
                        </div>
                      </div>

                      {/* Loading Spinner */}
                      {isAnalyzingMatch && (
                        <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-300 flex items-center gap-3 animate-pulse">
                          <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin shrink-0" />
                          <div className="text-xs sm:text-sm text-indigo-950 font-extrabold">
                            Analyzing 5-Point AI Fit across Core Competencies, Skill Tenure, Logistics &amp; Pay, Industry &amp; Creds, and Execution &amp; Comm. (Up to 30s)...
                          </div>
                        </div>
                      )}

                      {/* Full-Width 5-Point AI Fit Prediction Box (Matches Candidate View) */}
                      {selectedJob && !isAnalyzingMatch && matchScore !== null && (
                        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border-2 border-slate-300 space-y-5 border-slate-300">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300 pb-4">
                            <div>
                              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 block">
                                5-Point AI Fit Prediction • {selectedJob.title}
                              </span>
                              {aiMatchData?.brief_analysis && (
                                <p className="text-sm font-semibold text-slate-800 mt-1">
                                  {aiMatchData.brief_analysis}
                                </p>
                              )}
                            </div>

                            <div
                              className={`shrink-0 px-4 py-2 rounded-xl font-black text-lg border text-center ${
                                matchScore >= 80
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : matchScore >= MIN_MATCH_THRESHOLD
                                  ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                  : 'bg-rose-100 text-rose-800 border-rose-300'
                              }`}
                            >
                              {matchScore}% Match
                            </div>
                          </div>

                          {Array.isArray(aiMatchData?.radar_data) &&
                            aiMatchData.radar_data.length > 0 && (
                              <div className="flex flex-col lg:flex-row items-center gap-6">
                                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  {aiMatchData.radar_data.map(
                                    (item: any, idx: number) => {
                                      const lbl = normalizeSearchPillarLabel(
                                        item.subject
                                      )
                                      const sub = SEARCH_PILLAR_SUBTITLES[lbl]
                                      return (
                                        <div
                                          key={idx}
                                          className="bg-white px-3.5 py-2.5 rounded-lg border border-slate-300 flex items-center justify-between gap-2"
                                        >
                                          <div>
                                            <span className="text-xs font-bold text-slate-800 block">
                                              {lbl}
                                            </span>
                                            {sub && (
                                              <span className="text-[10px] font-medium text-slate-400 block">
                                                {sub}
                                              </span>
                                            )}
                                          </div>
                                          <span
                                            className={`text-sm font-black shrink-0 ${
                                              item.score >= 80
                                                ? 'text-emerald-600'
                                                : item.score >= 60
                                                ? 'text-indigo-600'
                                                : 'text-rose-600'
                                            }`}
                                          >
                                            {item.score}%
                                          </span>
                                        </div>
                                      )
                                    }
                                  )}
                                </div>

                                <div className="w-full max-w-[310px] h-[215px] shrink-0 mx-auto">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart
                                      cx="50%"
                                      cy="50%"
                                      outerRadius="54%"
                                      margin={{
                                        top: 10,
                                        right: 30,
                                        bottom: 10,
                                        left: 30,
                                      }}
                                      data={aiMatchData.radar_data.map(
                                        (d: any) => ({
                                          ...d,
                                          subject: normalizeSearchPillarLabel(
                                            d.subject
                                          ),
                                        })
                                      )}
                                    >
                                      <PolarGrid stroke="#cbd5e1" />
                                      <PolarAngleAxis
                                        dataKey="subject"
                                        tick={{
                                          fill: '#334155',
                                          fontSize: 9.5,
                                          fontWeight: 700,
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
                                        name="Fit Score"
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
                        </div>
                      )}

                      {/* Dealbreaker Firewall & Pitch Submission Footer */}
                      {selectedJob && !isAnalyzingMatch && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                          <div className="text-xs space-y-1">
                            {salaryFails && (
                              <div className="text-rose-600 font-bold">
                                • Dealbreaker: Candidate min ($
                                {(
                                  candidate.min_salary_expectation / 1000
                                ).toFixed(0)}
                                k/yr) exceeds role max budget ($
                                {(annualizedJobMax / 1000).toFixed(0)}k/yr).
                              </div>
                            )}
                            {modelFails && (
                              <div className="text-rose-600 font-bold capitalize">
                                • Dealbreaker: Candidate requires{' '}
                                {candidate.preferred_work_model}, role is{' '}
                                {selectedJob.work_model}.
                              </div>
                            )}
                            {empTypeFails && (
                              <div className="text-rose-600 font-bold">
                                • Dealbreaker: Role is {selectedJobEmpType},
                                candidate accepts{' '}
                                {acceptedEmploymentTypes.join(', ')}.
                              </div>
                            )}
                            {langFails && (
                              <div className="text-rose-600 font-bold">
                                • Dealbreaker (Language):{' '}
                                {langMissingDetails.join('; ')}.
                              </div>
                            )}
                            {scoreFails && (
                              <div className="text-rose-600 font-bold">
                                • Dealbreaker: AI Match ({matchScore}%) is below{' '}
                                {MIN_MATCH_THRESHOLD}% relevance firewall.
                              </div>
                            )}
                            {!hasDealbreaker && matchScore !== null && (
                              <div className="text-emerald-700 font-bold">
                                ✓ Meets {MIN_MATCH_THRESHOLD}%+ relevance firewall &amp; all candidate dealbreakers!
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
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
                              className="px-5 py-2.5 bg-slate-900 text-white text-xs font-extrabold rounded-xl hover:bg-indigo-600 disabled:opacity-50 transition-colors cursor-pointer"
                            >
                              {isSending
                                ? 'Sending Pitch...'
                                : 'Send Role Pitch (1 Credit) →'}
                            </button>
                          </div>
                        </div>
                      )}

                      {feedback && (
                        <div
                          className={`text-xs font-bold p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                            feedback.type === 'error'
                              ? 'bg-rose-50 text-rose-700 border border-rose-300'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
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
                                className="px-3 py-1.5 bg-rose-700 text-white rounded-lg hover:bg-rose-800 transition-colors text-xs font-extrabold cursor-pointer shrink-0"
                              >
                                ↻ Try AI Match Again
                              </button>
                            )}
                        </div>
                      )}
                    </div>
                  ) : (() => {
                    const savedJobForCand =
                      candidateJobMap[candidate.id] ||
                      (activeJobs.length === 1 ? String(activeJobs[0].id) : '')
                    const savedPairData = savedJobForCand
                      ? matchCacheMap[`${candidate.id}_${savedJobForCand}`]
                      : null
                    const savedJobObj = savedJobForCand
                      ? activeJobs.find((j) => String(j.id) === String(savedJobForCand))
                      : null
                    const savedScore = savedPairData?.overall_score ?? null

                    return (
                      <div className="space-y-3">
                        {savedPairData && savedScore !== null && (
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${
                                    savedScore >= 80
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                      : savedScore >= MIN_MATCH_THRESHOLD
                                      ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                      : 'bg-rose-100 text-rose-800 border-rose-300'
                                  }`}
                                >
                                  {savedScore}% AI Match
                                </span>
                                {savedJobObj && (
                                  <span className="text-xs font-extrabold text-slate-700 truncate">
                                    for {savedJobObj.title}
                                  </span>
                                )}
                              </div>
                              {savedPairData.brief_analysis && (
                                <p className="text-xs text-slate-600 font-medium mt-1 line-clamp-2">
                                  {savedPairData.brief_analysis}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs text-slate-500 font-medium">
                            {savedScore !== null
                              ? 'Saved 5-Point AI Fit evaluation ready. Click to view full radar graph or send role pitch.'
                              : 'Run an instant 5-Point AI Fit check against any of your active roles before pitching.'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setPitchCandidateId(candidate.id)
                              setFeedback(null)
                              if (savedJobForCand && savedPairData) {
                                setSelectedJobId(savedJobForCand)
                                setAiMatchData(savedPairData)
                              } else if (activeJobs.length === 1) {
                                const onlyJobId = String(activeJobs[0].id)
                                handleRoleSelect(onlyJobId, candidate.id)
                              } else {
                                setSelectedJobId('')
                                setAiMatchData(null)
                              }
                            }}
                            className="px-5 py-2.5 bg-slate-900 text-white text-xs font-extrabold rounded-xl hover:bg-indigo-600 transition-colors cursor-pointer shrink-0"
                          >
                            {savedScore !== null
                              ? 'View 5-Point Radar & Pitch →'
                              : 'Evaluate Fit & Pitch Role →'}
                          </button>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}