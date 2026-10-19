'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { CandidateJobFeed } from '@/components/CandidateJobFeed'
import { searchJobs } from '@/app/dashboard/actions'
import { toggleBookmarkItem } from '@/app/dashboard/bookmark-actions'
import { US_STATES_AND_METROS, US_REMOTE_REGIONS } from '@/constants/usLocations'
import {
  STANDARD_INDUSTRY_VERTICALS,
  normalizeIndustryVertical,
} from '@/constants/industries'
import {
  STANDARD_LANGUAGES,
  normalizeLanguageList,
} from '@/constants/languages'

const EMPLOYMENT_TYPES = [
  'Full-Time (W-2)',
  'Contract (1099 / Corp-to-Corp)',
  'Contract-to-Hire',
  'Part-Time',
  'Seasonal / Temporary',
]

type SortOption = 'newest' | 'closing_soon' | 'pay_high' | 'pay_low'

function extractJobFilterMeta(job: any) {
  const rawReqs = Array.isArray(job?.structured_requirements)
    ? job.structured_requirements
    : []
  const metaItem =
    rawReqs.find((r: any) => r && r._ss_job_meta === true) || job?.job_meta || {}

  const employmentType =
    job?.employment_type || metaItem?.employment_type || 'Full-Time (W-2)'

  const rawIndustry = job?.industry || metaItem?.industry || ''
  const industry = rawIndustry ? normalizeIndustryVertical(rawIndustry) : ''

  const requiredLanguages = normalizeLanguageList(
    job?.required_languages || metaItem?.required_languages,
    true
  )

  const payType =
    job?.pay_type === 'hourly' ||
    metaItem?.pay_type === 'hourly' ||
    (job?.salary_max && job.salary_max > 0 && job.salary_max <= 500)
      ? 'hourly'
      : 'annual'

  const rawMax = Number(job?.salary_max) || Number(job?.salary_min) || 0
  const rawMin = Number(job?.salary_min) || Number(job?.salary_max) || 0
  const annualizedMaxPay = payType === 'hourly' ? rawMax * 2080 : rawMax
  const annualizedMinPay = payType === 'hourly' ? rawMin * 2080 : rawMin

  const baseDateIso =
    job?.renewed_at ||
    metaItem?.renewed_at ||
    job?.created_at ||
    new Date().toISOString()
  const startMs = new Date(baseDateIso).getTime()
  const expiresMs = startMs + 30 * 24 * 60 * 60 * 1000
  const diffMs = expiresMs - Date.now()
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
  const isExpired = diffMs <= 0

  return {
    employmentType,
    industry,
    requiredLanguages,
    annualizedMaxPay,
    annualizedMinPay,
    startMs,
    daysRemaining,
    isExpired,
  }
}

export default function CandidateJobsPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [workModel, setWorkModel] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  // Advanced Filters (inside collapsible drawer)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [employmentType, setEmploymentType] = useState('all')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [languageFilter, setLanguageFilter] = useState('all')
  const [selectedState, setSelectedState] = useState('')
  const [selectedMetro, setSelectedMetro] = useState('')

  const [rawJobs, setRawJobs] = useState<any[]>([])
  const [savedEmpTypes, setSavedEmpTypes] = useState<string[]>([])
  const [savedJobIds, setSavedJobIds] = useState<string[]>([])
  const [onlyMyDealbreakers, setOnlyMyDealbreakers] = useState(false)
  const [onlySavedJobs, setOnlySavedJobs] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('saved') === 'true') {
        setOnlySavedJobs(true)
      }
    }

    const initPage = async () => {
      setIsLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'employer') {
        router.replace('/dashboard')
        return
      }

      setIsVerified(
        Boolean(
          profile?.identity_verified === true ||
            String(profile?.identity_verified) === 'true' ||
            profile?.is_verified === true ||
            String(profile?.is_verified) === 'true' ||
            profile?.verification_status === 'verified' ||
            profile?.verification_status === 'approved'
        )
      )

      const rawSkills = Array.isArray(profile?.structured_skills)
        ? profile.structured_skills
        : []
      const prefMeta = rawSkills.find(
        (item: any) => item && item._ss_pref_meta === true
      )
      if (
        Array.isArray(prefMeta?.employment_types) &&
        prefMeta.employment_types.length > 0
      ) {
        setSavedEmpTypes(prefMeta.employment_types)
      }
      if (Array.isArray(prefMeta?.saved_job_ids)) {
        setSavedJobIds(prefMeta.saved_job_ids.map(String))
      }

      const initialJobs = await searchJobs('', 'all', '')
      setRawJobs(initialJobs || [])
      setIsLoading(false)
    }

    initPage()
  }, [router])

  const stateObj = US_STATES_AND_METROS.find((s) => s.code === selectedState)
  const metroOptions =
    selectedState === 'REMOTE_US'
      ? US_REMOTE_REGIONS
      : stateObj
      ? stateObj.metros
      : []

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsLoading(true)

    let locationFilter = ''
    if (selectedMetro) {
      locationFilter = selectedMetro
    } else if (selectedState && selectedState !== 'REMOTE_US') {
      locationFilter = `, ${selectedState}`
    } else if (selectedState === 'REMOTE_US') {
      locationFilter = 'Remote'
    }

    const results = await searchJobs(query, workModel, locationFilter)
    setRawJobs(results || [])
    setIsLoading(false)
  }

  const handleToggleSaveJob = async (jobId: string) => {
    const normalizedId = String(jobId)
    const wasSaved = savedJobIds.includes(normalizedId)
    setSavedJobIds((prev) =>
      wasSaved
        ? prev.filter((id) => id !== normalizedId)
        : [...prev, normalizedId]
    )

    const res = await toggleBookmarkItem(normalizedId, 'job')
    if (!res.error) {
      setSavedJobIds(res.savedIds)
    }
  }

  const activeAdvancedCount = [
    employmentType !== 'all',
    industryFilter !== 'all',
    languageFilter !== 'all',
    Boolean(selectedState),
    onlyMyDealbreakers,
  ].filter(Boolean).length

  const resetAllFilters = async () => {
    setQuery('')
    setWorkModel('all')
    setEmploymentType('all')
    setIndustryFilter('all')
    setLanguageFilter('all')
    setSelectedState('')
    setSelectedMetro('')
    setOnlyMyDealbreakers(false)
    setOnlySavedJobs(false)
    setIsLoading(true)
    const fresh = await searchJobs('', 'all', '')
    setRawJobs(fresh || [])
    setIsLoading(false)
  }

  // Unified client-side filter + sort
  const filteredAndSortedJobs = useMemo(() => {
    const withMeta = rawJobs
      .map((job) => ({
        job,
        meta: extractJobFilterMeta(job),
      }))
      .filter((item) => !item.meta.isExpired)

    const filtered = withMeta.filter(({ job, meta }) => {
      const jobId = String(job.uuid || job.id)

      if (onlySavedJobs && !savedJobIds.includes(jobId)) {
        return false
      }

      if (workModel !== 'all') {
        if ((job.work_model || '').toLowerCase() !== workModel.toLowerCase()) {
          return false
        }
      }

      if (employmentType !== 'all') {
        if (
          meta.employmentType.toLowerCase() !== employmentType.toLowerCase() &&
          !meta.employmentType
            .toLowerCase()
            .includes(employmentType.toLowerCase())
        ) {
          return false
        }
      }

      if (industryFilter !== 'all') {
        if (meta.industry.toLowerCase() !== industryFilter.toLowerCase()) {
          return false
        }
      }

      if (languageFilter !== 'all') {
        if (
          !meta.requiredLanguages.some(
            (l) => l.language.toLowerCase() === languageFilter.toLowerCase()
          )
        ) {
          return false
        }
      }

      if (onlyMyDealbreakers && savedEmpTypes.length > 0) {
        const matchesSaved = savedEmpTypes.some(
          (t) =>
            t.toLowerCase() === meta.employmentType.toLowerCase() ||
            meta.employmentType.toLowerCase().includes(t.toLowerCase())
        )
        if (!matchesSaved) return false
      }

      return true
    })

    return [...filtered]
      .sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return b.meta.startMs - a.meta.startMs
          case 'closing_soon':
            return a.meta.daysRemaining - b.meta.daysRemaining
          case 'pay_high':
            return b.meta.annualizedMaxPay - a.meta.annualizedMaxPay
          case 'pay_low': {
            const aPay = a.meta.annualizedMinPay || Number.MAX_SAFE_INTEGER
            const bPay = b.meta.annualizedMinPay || Number.MAX_SAFE_INTEGER
            return aPay - bPay
          }
          default:
            return b.meta.startMs - a.meta.startMs
        }
      })
      .map((item) => item.job)
  }, [
    rawJobs,
    onlySavedJobs,
    savedJobIds,
    workModel,
    employmentType,
    industryFilter,
    languageFilter,
    onlyMyDealbreakers,
    savedEmpTypes,
    sortBy,
  ])

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-6">
      {/* Clean Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-300">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Discover Blind Roles
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upfront pay transparency (/yr or /hr) and instant 5-Point AI Fit checks—while company identities stay blind until mutual unlock.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setOnlySavedJobs((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
              onlySavedJobs
                ? 'bg-amber-50 border-amber-400 text-amber-900'
                : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
            }`}
          >
            <svg
              className={`w-3.5 h-3.5 ${
                onlySavedJobs ? 'text-amber-500 fill-amber-500' : 'text-slate-400'
              }`}
              fill={onlySavedJobs ? 'currentColor' : 'none'}
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
            Saved Roles ({savedJobIds.length})
          </button>

          {savedEmpTypes.length > 0 && (
            <button
              type="button"
              onClick={() => setOnlyMyDealbreakers((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                onlyMyDealbreakers
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
              }`}
            >
              {onlyMyDealbreakers
                ? '✓ Matching My Dealbreakers'
                : 'Match My Dealbreakers'}
            </button>
          )}
        </div>
      </header>

      {/* SINGLE UNIFIED COMMAND BAR (REPLACES THE 2 STACKED FILTER BOXES) */}
      <form
        onSubmit={handleSearch}
        className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-2-slate-200 shadow-xs space-y-3.5"
      >
        {/* Primary Everyday Row: Keyword + Work Model + Sort By + Filters Toggle + Search Button */}
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, skills, or certifications..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-2-slate-200 bg-slate-50 text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:border-2-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
            <select
              value={workModel}
              onChange={(e) => setWorkModel(e.target.value)}
              className="rounded-xl border-2 border-2-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-extrabold text-slate-700 focus:bg-white focus:border-2-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Work Models</option>
              <option value="remote">Remote Only</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-xl border-2 border-2-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-extrabold text-slate-700 focus:bg-white focus:border-2-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="pay_high">Sort: Highest Pay</option>
              <option value="closing_soon">Sort: Closing Soonest</option>
              <option value="pay_low">Sort: Lowest Pay First</option>
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

        {/* Collapsible Advanced Filters Drawer (Progressive Disclosure) */}
        {showAdvancedFilters && (
          <div className="pt-3.5 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 animate-in fade-in duration-150">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Employment Type
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full rounded-xl border-2 border-2-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-2-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="all">All Employment Types</option>
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
                className="w-full rounded-xl border-2 border-2-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-2-indigo-500 focus:outline-none cursor-pointer"
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
                Required Language
              </label>
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="w-full rounded-xl border-2 border-2-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-2-indigo-500 focus:outline-none cursor-pointer"
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
                US State / Remote Region
              </label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value)
                  setSelectedMetro('')
                }}
                className="w-full rounded-xl border-2 border-2-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-2-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="">All US States</option>
                <option value="REMOTE_US">🇺🇸 US Remote Regions</option>
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
                className="w-full rounded-xl border-2 border-2-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-2-indigo-500 focus:outline-none disabled:opacity-50 cursor-pointer"
              >
                <option value="">
                  {!selectedState
                    ? 'Select state first...'
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

        {/* Subtle Status & Active Filter Summary Bar */}
        <div className="pt-2 border-t border-slate-300 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Showing{' '}
              <strong className="text-slate-900">
                {filteredAndSortedJobs.length}
              </strong>{' '}
              active {filteredAndSortedJobs.length === 1 ? 'role' : 'roles'}
            </span>

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
          </div>

          {(activeAdvancedCount > 0 ||
            workModel !== 'all' ||
            query.trim() !== '' ||
            onlySavedJobs) && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-indigo-600 hover:text-indigo-800 font-extrabold cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>
      </form>

      {isLoading ? (
        <div className="py-16 text-center bg-white rounded-2xl border-2 border-2-slate-200 shadow-xs">
          <div className="inline-block w-8 h-8 border-4 border-slate-300 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-slate-500 font-medium text-sm">
            Loading blind roles...
          </p>
        </div>
      ) : (
        /* Pass showSortControls={false} so CandidateJobFeed doesn't render a second filter box! */
        <CandidateJobFeed
          jobs={filteredAndSortedJobs}
          isVerified={isVerified}
          savedJobIds={savedJobIds}
          onToggleSaveJob={handleToggleSaveJob}
          showSortControls={false}
        />
      )}
    </div>
  )
}