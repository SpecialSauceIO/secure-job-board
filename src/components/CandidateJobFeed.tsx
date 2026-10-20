'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { analyzeJobFit, applyBlind } from '@/app/dashboard/actions'
import {
  getUserBookmarks,
  toggleBookmarkItem,
} from '@/app/dashboard/bookmark-actions'
import {
  STANDARD_INDUSTRY_VERTICALS,
  normalizeIndustryVertical,
} from '@/constants/industries'
import { normalizeJobEducationReq } from '@/constants/education'
import {
  STANDARD_LANGUAGES,
  normalizeLanguageList,
} from '@/constants/languages'
import { getQuickJobCardRank } from '@/constants/gamification'
import { RankAndFounderPill } from '@/components/ReputationBadgeCase'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const MIN_MATCH_THRESHOLD = 40
const JOB_EXPIRATION_DAYS = 30

type SortOption =
  | 'newest'
  | 'closing_soon'
  | 'pay_high'
  | 'pay_low'
  | 'work_model'
  | 'employment_type'

function extractJobCardMeta(job: any) {
  const rawReqs = Array.isArray(job.structured_requirements)
    ? job.structured_requirements
    : []
  const metaItem =
    rawReqs.find((r: any) => r && r._ss_job_meta === true) || job.job_meta || {}
  const visibleReqs = rawReqs.filter(
    (r: any) =>
      r &&
      typeof r === 'object' &&
      !r._ss_job_meta &&
      (r.skill || r.name) &&
      !String(r.skill || r.name).startsWith('__SS_')
  )

  const payType: 'annual' | 'hourly' =
    job.pay_type === 'hourly' ||
    metaItem.pay_type === 'hourly' ||
    (job.salary_max && job.salary_max > 0 && job.salary_max <= 500)
      ? 'hourly'
      : 'annual'

  const formatAmount = (val?: number | null) => {
    if (!val || isNaN(Number(val))) return null
    const num = Number(val)
    if (payType === 'hourly') {
      return `$${num.toLocaleString()}`
    }
    if (num >= 1000) {
      const kVal = num / 1000
      return `$${Number.isInteger(kVal) ? kVal : kVal.toFixed(1)}k`
    }
    return `$${num.toLocaleString()}`
  }

  const minStr = formatAmount(job.salary_min)
  const maxStr = formatAmount(job.salary_max)
  const unitSuffix = payType === 'hourly' ? '/hr' : '/yr'

  let formattedPay = 'Compensation Open'
  if (minStr && maxStr) {
    formattedPay = `${minStr} – ${maxStr} ${unitSuffix}`
  } else if (minStr) {
    formattedPay = `${minStr}+ ${unitSuffix}`
  } else if (maxStr) {
    formattedPay = `Up to ${maxStr} ${unitSuffix}`
  }

  const rawMax = Number(job.salary_max) || Number(job.salary_min) || 0
  const rawMin = Number(job.salary_min) || Number(job.salary_max) || 0
  const annualizedMaxPay = payType === 'hourly' ? rawMax * 2080 : rawMax
  const annualizedMinPay = payType === 'hourly' ? rawMin * 2080 : rawMin

  const baseDateIso =
    job.renewed_at ||
    metaItem.renewed_at ||
    job.created_at ||
    new Date().toISOString()
  const startMs = new Date(baseDateIso).getTime()
  const expiresMs = startMs + JOB_EXPIRATION_DAYS * 24 * 60 * 60 * 1000
  const diffMs = expiresMs - Date.now()
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
  const isExpired = diffMs <= 0

  const rawIndustry = job.industry || metaItem.industry || ''
  const normalizedIndustry = rawIndustry
    ? normalizeIndustryVertical(rawIndustry)
    : ''

  const rawEduReq = job.education_req || metaItem.education_req || ''
  const educationReq = rawEduReq ? normalizeJobEducationReq(rawEduReq) : ''
  const requiredCertifications =
    job.required_certifications || metaItem.required_certifications || ''

  const requiredLanguages = normalizeLanguageList(
    job.required_languages || metaItem.required_languages,
    true
  )

  const rankInfo = getQuickJobCardRank(job)

  return {
    formattedPay,
    payType,
    annualizedMaxPay,
    annualizedMinPay,
    startMs,
    compPerks: job.comp_perks || metaItem.comp_perks || '',
    location: job.location || metaItem.location || '',
    employmentType:
      job.employment_type || metaItem.employment_type || 'Full-Time (W-2)',
    experienceLevel: job.experience_level || metaItem.experience_level || '',
    educationReq,
    requiredCertifications,
    requiredLanguages,
    industry: normalizedIndustry,
    companySize: job.company_size || metaItem.company_size || '',
    workAuth: job.work_auth || metaItem.work_auth || '',
    hiringTimeline: job.hiring_timeline || metaItem.hiring_timeline || 'Active Hiring (2–4 Weeks)',
    daysRemaining,
    isExpired,
    visibleReqs,
    rankInfo,
  }
}

function normalizePillarLabel(raw: string): string {
  const s = String(raw || '').trim().toLowerCase()
  if (s.includes('technical') || s.includes('competenc')) return 'Core Competencies'
  if (s.includes('experience') || s.includes('tenure')) return 'Skill Tenure'
  if (s.includes('role') || s.includes('logistic') || s.includes('alignment')) return 'Logistics & Pay'
  if (s.includes('domain') || s.includes('industry') || s.includes('cred')) return 'Industry & Creds'
  if (s.includes('culture') || s.includes('soft') || s.includes('execution') || s.includes('comm')) return 'Execution & Comm.'
  return raw
}

const PILLAR_SUBTITLES: Record<string, string> = {
  'Core Competencies': 'Required & Transferable Role Skills',
  'Skill Tenure': 'Per-Skill Depth & Career-Changer Fair',
  'Logistics & Pay': 'Pay, Work Model, Auth & Start Window',
  'Industry & Creds': 'Vertical, Education & Certifications',
  'Execution & Comm.': 'Ownership, Collaboration & Languages',
}

export function CandidateJobFeed({
  jobs,
  isVerified = false,
  savedJobIds: externalSavedIds,
  onToggleSaveJob,
  showSortControls = true,
}: {
  jobs: any[]
  isVerified?: boolean
  savedJobIds?: string[]
  onToggleSaveJob?: (jobId: string) => void
  showSortControls?: boolean
}) {
  const [jobList, setJobList] = useState<any[]>(jobs || [])
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [employmentTypeFilter, setEmploymentTypeFilter] =
    useState<string>('all')
  const [industryFilter, setIndustryFilter] = useState<string>('all')
  const [languageFilter, setLanguageFilter] = useState<string>('all')
  const [internalSavedIds, setInternalSavedIds] = useState<string[]>([])
  const [togglingSaveId, setTogglingSaveId] = useState<string | null>(null)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [appliedJobs, setAppliedJobs] = useState<Record<string, string>>({})
  const [matchResults, setMatchResults] = useState<Record<string, any>>({})
  const [feedback, setFeedback] = useState<
    Record<string, { type: 'success' | 'error'; text: string }>
  >({})

  useEffect(() => {
    setJobList(jobs || [])
  }, [jobs])

  // Load persisted AI Match results from localStorage immediately + hydrate from server
  useEffect(() => {
    let mounted = true
    try {
      const localRaw = localStorage.getItem('ss_cand_match_results_v1')
      if (localRaw) {
        const parsed = JSON.parse(localRaw)
        if (parsed && typeof parsed === 'object') {
          setMatchResults((prev) => ({ ...parsed, ...prev }))
        }
      }
    } catch {}

    getPersistedMatchCache()
      .then((res) => {
        if (!mounted || !res?.cache) return
        const serverMatches: Record<string, any> = {}
        for (const [k, v] of Object.entries(res.cache)) {
          if (k.startsWith('cand_') && v && typeof v === 'object') {
            const jId = k.slice('cand_'.length)
            serverMatches[jId] = v
          }
        }
        if (Object.keys(serverMatches).length > 0) {
          setMatchResults((prev) => {
            const merged = { ...serverMatches, ...prev }
            try {
              localStorage.setItem('ss_cand_match_results_v1', JSON.stringify(merged))
            } catch {}
            return merged
          })
        }
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (externalSavedIds !== undefined) return
    let mounted = true
    getUserBookmarks().then((res) => {
      if (mounted) setInternalSavedIds(res.savedJobIds || [])
    })
    return () => {
      mounted = false
    }
  }, [externalSavedIds])

  const activeSavedIds =
    externalSavedIds !== undefined ? externalSavedIds : internalSavedIds

  const handleToggleBookmark = async (jobId: string) => {
    if (onToggleSaveJob) {
      onToggleSaveJob(jobId)
      return
    }
    setTogglingSaveId(jobId)
    const normalizedId = String(jobId)
    const wasSaved = internalSavedIds.includes(normalizedId)
    setInternalSavedIds((prev) =>
      wasSaved
        ? prev.filter((id) => id !== normalizedId)
        : [...prev, normalizedId]
    )

    const res = await toggleBookmarkItem(normalizedId, 'job')
    if (!res.error) {
      setInternalSavedIds(res.savedIds)
    }
    setTogglingSaveId(null)
  }

  const handleAnalyzeFit = async (jobId: string) => {
    setAnalyzingId(jobId)
    setFeedback((prev) => {
      const copy = { ...prev }
      delete copy[jobId]
      return copy
    })

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
        analyzeJobFit(jobId),
        timeoutPromise,
      ])

      if (result?.error) {
        setFeedback((prev) => ({
          ...prev,
          [jobId]: {
            type: 'error',
            text: `${result.error} Please click "Try AI Match Again" to retry.`,
          },
        }))
      } else if (result?.data) {
        setMatchResults((prev) => {
          const updated = {
            ...prev,
            [jobId]: result.data,
          }
          try {
            localStorage.setItem('ss_cand_match_results_v1', JSON.stringify(updated))
          } catch {}
          return updated
        })
      } else {
        setFeedback((prev) => ({
          ...prev,
          [jobId]: {
            type: 'error',
            text: 'Unable to generate AI Match score at this moment. Please try again.',
          },
        }))
      }
    } catch {
      setFeedback((prev) => ({
        ...prev,
        [jobId]: {
          type: 'error',
          text: 'Network or server timeout while calculating AI Match. Please click "Try AI Match Again" to retry.',
        },
      }))
    } finally {
      setAnalyzingId(null)
    }
  }

  const handleBlindApply = async (jobId: string) => {
    const matchData = matchResults[jobId]
    if (!matchData) return

    setApplyingId(jobId)
    setFeedback((prev) => {
      const copy = { ...prev }
      delete copy[jobId]
      return copy
    })

    const formData = new FormData()
    formData.append('job_id', jobId)
    formData.append('match_score', String(matchData.overall_score ?? 0))
    formData.append(
      'employer_pitch',
      matchData.employer_pitch || matchData.brief_analysis || ''
    )
    formData.append('match_data', JSON.stringify(matchData))

    const result = await applyBlind(formData)

    if (result?.error) {
      setFeedback((prev) => ({
        ...prev,
        [jobId]: { type: 'error', text: result.error },
      }))
      setApplyingId(null)
      return
    }

    const refCode = result.referenceId || 'SS-CONFIRMED'
    setAppliedJobs((prev) => ({
      ...prev,
      [jobId]: refCode,
    }))

    setFeedback((prev) => ({
      ...prev,
      [jobId]: {
        type: 'success',
        text: `Blind Application Submitted (Ref: ${refCode})! Your identity remains hidden until the employer unlocks your profile.`,
      },
    }))

    setApplyingId(null)
  }

  const sortedAndFilteredJobs = useMemo(() => {
    const freshWithMeta = (jobList || [])
      .map((job) => ({
        job,
        meta: extractJobCardMeta(job),
      }))
      .filter((item) => !item.meta.isExpired)

    const filteredByType =
      employmentTypeFilter === 'all'
        ? freshWithMeta
        : freshWithMeta.filter((item) =>
            item.meta.employmentType
              .toLowerCase()
              .includes(employmentTypeFilter.toLowerCase())
          )

    const filteredByIndustry =
      industryFilter === 'all'
        ? filteredByType
        : filteredByType.filter(
            (item) =>
              item.meta.industry.toLowerCase() === industryFilter.toLowerCase()
          )

    const filteredByLanguage =
      languageFilter === 'all'
        ? filteredByIndustry
        : filteredByIndustry.filter((item) =>
            item.meta.requiredLanguages.some(
              (l) => l.language.toLowerCase() === languageFilter.toLowerCase()
            )
          )

    const workModelPriority = (model?: string): number => {
      const m = (model || '').toLowerCase().trim()
      if (m === 'remote') return 1
      if (m === 'hybrid') return 2
      if (m === 'onsite' || m === 'on-site') return 3
      return 4
    }

    const sorted = [...filteredByLanguage].sort((a, b) => {
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
        case 'work_model': {
          const diff =
            workModelPriority(a.job.work_model) -
            workModelPriority(b.job.work_model)
          return diff !== 0 ? diff : b.meta.startMs - a.meta.startMs
        }
        case 'employment_type': {
          const cmp = a.meta.employmentType.localeCompare(b.meta.employmentType)
          return cmp !== 0 ? cmp : b.meta.startMs - a.meta.startMs
        }
        default:
          return b.meta.startMs - a.meta.startMs
      }
    })

    return sorted
  }, [
    jobList,
    sortBy,
    employmentTypeFilter,
    industryFilter,
    languageFilter,
  ])

  const totalFreshCount = useMemo(() => {
    return (jobList || []).filter((j) => !extractJobCardMeta(j).isExpired).length
  }, [jobList])

  if (totalFreshCount === 0) {
    return (
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
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          No unapplied roles match right now
        </h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
          You have either applied to all matching active roles or no roles match your current filter.
        </p>
        <Link
          href="/dashboard/applications"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors shadow-sm"
        >
          Check My Application Tracker →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* SORT, INDUSTRY VERTICAL, LANGUAGE & WORK TYPE ORGANIZER BAR */}
      {showSortControls && (
        <div className="bg-white p-4 rounded-2xl border-2 border-slate-300 shadow-xs space-y-3.5 border-slate-300">
          {/* Row 1: Employment Type Quick Filter Pills + Role Count */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1.5">
                Work Type:
              </span>
              {[
                { id: 'all', label: 'All Types' },
                { id: 'Full-Time', label: 'Full-Time (W-2)' },
                { id: '1099', label: 'Contract (1099 / C2C)' },
                { id: 'Contract-to-Hire', label: 'Contract-to-Hire' },
                { id: 'Part-Time', label: 'Part-Time' },
                { id: 'Seasonal', label: 'Seasonal / Temporary' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setEmploymentTypeFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    employmentTypeFilter === tab.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <span className="text-xs font-bold text-slate-500">
              Showing{' '}
              <strong className="text-slate-900">
                {sortedAndFilteredJobs.length}
              </strong>{' '}
              of {totalFreshCount}{' '}
              {totalFreshCount === 1 ? 'active role' : 'active roles'}
            </span>
          </div>

          {/* Row 2: Industry Vertical + Language Requirement + Sort By Dropdown */}
          <div className="pt-3 border-t border-slate-300 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <label
                htmlFor="candidate-industry-filter"
                className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap shrink-0"
              >
                Industry:
              </label>
              <select
                id="candidate-industry-filter"
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer shadow-2xs border-slate-300"
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
                htmlFor="candidate-language-filter"
                className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap shrink-0"
              >
                Language:
              </label>
              <select
                id="candidate-language-filter"
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer shadow-2xs border-slate-300"
              >
                <option value="all">All Languages</option>
                {STANDARD_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    🌐 {lang}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="candidate-job-sort"
                className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap shrink-0"
              >
                Sort By:
              </label>
              <select
                id="candidate-job-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer shadow-2xs border-slate-300"
              >
                <option value="newest">Newest Posted (Freshness)</option>
                <option value="closing_soon">
                  Closing Soonest (30d Window)
                </option>
                <option value="pay_high">
                  Highest Pay (Annualized $/yr &amp; $/hr)
                </option>
                <option value="pay_low">Lowest Pay First</option>
                <option value="work_model">
                  Work Arrangement (Remote → Hybrid → On-site)
                </option>
                <option value="employment_type">
                  Employment Type (W-2 / 1099 / C2H / Seasonal)
                </option>
              </select>
            </div>
          </div>
        </div>
      )}

      {sortedAndFilteredJobs.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border-2 border-slate-300 text-center shadow-xs border-slate-300">
          <p className="text-sm font-bold text-slate-700 mb-2">
            No open roles match your selected Work Type, Industry Vertical, or Language filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setEmploymentTypeFilter('all')
              setIndustryFilter('all')
              setLanguageFilter('all')
            }}
            className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-extrabold hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            Reset Active Filters →
          </button>
        </div>
      ) : (
        sortedAndFilteredJobs.map(({ job, meta }) => {
          const jobId = String(job.uuid || job.id)
          const matchData = matchResults[jobId]
          const score = matchData?.overall_score ?? null
          const isAnalyzing = analyzingId === jobId
          const isApplying = applyingId === jobId
          const appliedRef = appliedJobs[jobId]
          const isApplied = Boolean(appliedRef)
          const isBookmarked = activeSavedIds.includes(jobId)
          const cardFeedback = feedback[jobId]
          const orgVerified =
            job.organizations?.verification_status === 'verified'

          const anonymousTeaserParts = [
            meta.industry || 'Verified Employer',
            meta.companySize,
          ].filter(Boolean)

          return (
            <div
              key={jobId}
              className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                isApplied
                  ? 'border-emerald-300 ring-2 ring-emerald-500/10 shadow-md'
                  : isBookmarked
                  ? 'border-2 border-slate-300 shadow-sm'
                  : meta.rankInfo.isFounder
                  ? 'border-2 border-slate-300 shadow-sm '
                  : 'border-2 border-slate-300 shadow-sm hover:border-slate-400'
              }`}
            >
              <div className="p-6 md:p-7 space-y-4">
                {/* Row 1: Fixed Top Identity Bar & Save / Compensation Action Group */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      title={`Blind Role • ${anonymousTeaserParts.join(' • ')}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 text-white text-[11px] font-extrabold uppercase tracking-wider min-w-0 shrink overflow-hidden"
                    >
                      <span className="shrink-0">🔒</span>
                      <span className="truncate">
                        Blind Role • {anonymousTeaserParts.join(' • ')}
                      </span>
                    </span>

                    <div className="shrink-0">
                      <RankAndFounderPill
                        level={meta.rankInfo.level}
                        tier={meta.rankInfo.tier}
                        isFounder={meta.rankInfo.isFounder}
                        founderText="Founding Partner"
                        size="xs"
                      />
                    </div>
                  </div>

                  {/* Right Side: Save Button + Compensation Pill */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={togglingSaveId === jobId}
                      onClick={() => handleToggleBookmark(jobId)}
                      title={
                        isBookmarked
                          ? 'Remove from saved roles'
                          : 'Save role to bookmark list'
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        isBookmarked
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <svg
                        className={`w-3.5 h-3.5 ${
                          isBookmarked
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-400'
                        }`}
                        fill={isBookmarked ? 'currentColor' : 'none'}
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
                      {isBookmarked ? 'Saved' : 'Save'}
                    </button>

                    <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-black text-sm">
                      {meta.formattedPay}
                    </div>
                  </div>
                </div>

                {/* Row 2: Dedicated Trust & Timeline Bar + Role Title */}
                <div className="pb-3.5 border-b border-slate-300 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                      <span className="text-emerald-700 font-bold">
                        {orgVerified ? '✓ Verified Domain' : '✓ Verified Employer'}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-300">
                        ⏱️ {meta.hiringTimeline}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500 font-medium">
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span
                        className={`font-bold ${
                          meta.daysRemaining <= 5
                            ? 'text-amber-700'
                            : 'text-slate-600'
                        }`}
                        title="All Special Sauce roles auto-expire after 30 days to prevent ghost listings"
                      >
                        Closes in {meta.daysRemaining}d
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                      {job.title}
                    </h3>
                  </div>

                  {meta.compPerks && meta.compPerks !== 'Base Salary Only' && (
                    <span className="text-[11px] font-bold text-indigo-700 shrink-0">
                      {meta.compPerks}
                    </span>
                  )}
                </div>

                {/* Row 3: Uniform 4-Column Role Specification Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50/90 border border-slate-300 text-xs">
                  <div className="min-w-0">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Work Model &amp; Location
                    </span>
                    <span className="font-bold text-slate-900 leading-snug block mt-0.5">
                      {(job.work_model || 'Flexible').toUpperCase()} • {meta.location || 'US Nationwide'}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Employment &amp; Level
                    </span>
                    <span className="font-bold text-slate-900 leading-snug block mt-0.5">
                      {meta.employmentType || 'Full-Time (W-2)'} • {meta.experienceLevel || 'Mid-Senior'}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Education &amp; Auth
                    </span>
                    <span
                      title={`${meta.educationReq || 'Skills First'} • ${meta.workAuth || 'US Authorized'}`}
                      className="font-bold text-slate-900 leading-snug block mt-0.5"
                    >
                      {meta.educationReq || 'Skills & Experience First'}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Languages &amp; Certs
                    </span>
                    <span className="font-bold text-slate-900 leading-snug block mt-0.5">
                      {meta.requiredLanguages.length > 0
                        ? meta.requiredLanguages
                            .map((l) => `${l.language} (${l.proficiency})`)
                            .join(', ')
                        : 'English (Standard)'}
                      {meta.requiredCertifications ? ` • ${meta.requiredCertifications}` : ''}
                    </span>
                  </div>
                </div>

                {/* Row 4: Role Description (Clamped for Uniform Card Height) */}
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                  {job.description}
                </p>

                {/* Row 5: Uniform Core Skills Footer Bar */}
                <div className="text-xs text-slate-600 pt-2.5 border-t border-slate-200 truncate">
                  <strong className="text-slate-800 uppercase tracking-wider text-[11px] mr-2">
                    Core Skills:
                  </strong>
                  {meta.visibleReqs.length > 0
                    ? meta.visibleReqs
                        .map((req) =>
                          req.level
                            ? `${req.skill || req.name} (${req.level})`
                            : req.skill || req.name
                        )
                        .join(' • ')
                    : 'General role competencies'}
                </div>

                {/* Live 30-Second Progress Notifier Banner */}
                {isAnalyzing && (
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-300 flex items-center gap-3.5 animate-pulse">
                    <div className="w-5 h-5 border-3 border-indigo-300 border-t-indigo-600 rounded-full animate-spin shrink-0" />
                    <div className="text-xs text-indigo-950">
                      <span className="font-extrabold block">
                        Analyzing 5-Point AI Fit (This may take up to 30 seconds)...
                      </span>
                      <span className="text-indigo-700 font-medium">
                        Evaluating your anonymous skill matrix, education, certifications, and language proficiencies.
                      </span>
                    </div>
                  </div>
                )}

                {/* AI Match Radar & Fit Analysis Results Box */}
                {matchData && !isAnalyzing && (
                  <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-300 space-y-5 animate-in fade-in duration-300 border-slate-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300 pb-4">
                      <div>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 block">
                          5-Point AI Fit Prediction
                        </span>
                        <p className="text-sm font-semibold text-slate-800 mt-1">
                          {matchData.brief_analysis}
                        </p>
                      </div>

                      <div
                        className={`shrink-0 px-4 py-2 rounded-xl font-black text-lg border text-center ${
                          score >= 80
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : score >= MIN_MATCH_THRESHOLD
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}
                      >
                        {score}% Match
                      </div>
                    </div>

                    {matchData.radar_data && (
                      <div className="flex flex-col lg:flex-row items-center gap-6">
                        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {matchData.radar_data.map((item: any, i: number) => {
                            const label = normalizePillarLabel(item.subject)
                            const sub = PILLAR_SUBTITLES[label]
                            return (
                              <div
                                key={i}
                                className="bg-white px-3.5 py-2.5 rounded-lg border border-slate-300 flex items-center justify-between gap-2"
                              >
                                <div>
                                  <span className="text-xs font-bold text-slate-800 block">
                                    {label}
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
                          })}
                        </div>

                        <div className="w-full max-w-[310px] h-[215px] shrink-0 mx-auto">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart
                              cx="50%"
                              cy="50%"
                              outerRadius="54%"
                              margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
                              data={matchData.radar_data.map((d: any) => ({
                                ...d,
                                subject: normalizePillarLabel(d.subject),
                              }))}
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
                  </div>
                )}

                {/* Persistent Application Confirmation & Tracker CTA Banner */}
                {isApplied && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 font-black text-sm">
                        ✓
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-emerald-950">
                          Blind Application Submitted (+150 XP! Ref:{' '}
                          {appliedRef})
                        </h4>
                        <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                          Your anonymous skill matrix and {score}% AI Match Radar are now in the employer&apos;s pipeline.
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard/applications"
                      className="shrink-0 px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-extrabold hover:bg-emerald-800 transition-colors text-center shadow-sm whitespace-nowrap"
                    >
                      View in Application Tracker →
                    </Link>
                  </div>
                )}

                {/* Error / Upgrade Prompt Banner */}
                {cardFeedback && cardFeedback.type === 'error' && (
                  <div className="p-3.5 rounded-xl text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-rose-50 text-rose-700 border border-rose-300">
                    <span>{cardFeedback.text}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {!cardFeedback.text.includes('Candidate Pro') && (
                        <button
                          type="button"
                          onClick={() => handleAnalyzeFit(jobId)}
                          className="px-3.5 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-extrabold hover:bg-rose-800 transition-colors cursor-pointer"
                        >
                          ↻ Try AI Match Again
                        </button>
                      )}
                      {cardFeedback.text.includes('Candidate Pro') && (
                        <Link
                          href="/dashboard/billing"
                          className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors text-center"
                        >
                          Upgrade to Pro ($9/mo) →
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                {/* Bottom Action Bar */}
                <div className="pt-3 border-t border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-xs text-slate-500">
                    {isApplied
                      ? `✓ Application logged under Reference ID ${appliedRef}.`
                      : !matchData
                      ? `Step 1: Run a free AI Fit Analysis (${MIN_MATCH_THRESHOLD}%+ match required to apply).`
                      : score >= MIN_MATCH_THRESHOLD
                      ? '✓ You meet the 40%+ relevance firewall! Submitting Rewards +150 Profile XP.'
                      : `Requires ${MIN_MATCH_THRESHOLD}%+ AI Match Score to apply (Current: ${score}%).`}
                  </p>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {!isApplied && (
                      <button
                        type="button"
                        disabled={isAnalyzing || isApplying}
                        onClick={() => handleAnalyzeFit(jobId)}
                        className="px-4 py-2 rounded-xl border-2 border-slate-300 bg-white text-slate-800 text-xs font-extrabold hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer border-slate-300"
                      >
                        {isAnalyzing
                          ? 'Analyzing Fit...'
                          : matchData
                          ? '↻ Re-Run Fit'
                          : '⚡ Check AI Fit Score'}
                      </button>
                    )}

                    {matchData &&
                      (isApplied ? (
                        <span className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold">
                          ✓ Applied Blindly
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={
                            isApplying ||
                            !isVerified ||
                            score < MIN_MATCH_THRESHOLD
                          }
                          onClick={() => handleBlindApply(jobId)}
                          className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors shadow-2xs disabled:opacity-40 cursor-pointer"
                        >
                          {isApplying
                            ? 'Submitting...'
                            : !isVerified
                            ? '🔒 Verify Identity to Apply'
                            : score < MIN_MATCH_THRESHOLD
                            ? `Locked (<${MIN_MATCH_THRESHOLD}% Match)`
                            : 'Submit Blind Application →'}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}