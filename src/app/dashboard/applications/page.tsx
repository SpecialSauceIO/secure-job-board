'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCandidateApplications } from '@/app/dashboard/actions'
import SecureMessageThread from '@/components/SecureMessageThread'
import { normalizeIndustryVertical } from '@/constants/industries'
import { normalizeJobEducationReq } from '@/constants/education'
import {
  normalizeLanguageList,
  formatLanguageBadge,
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

function formatJobPayBand(job: any): string {
  if (!job) return 'Compensation Open'
  const payType =
    job.pay_type === 'hourly' ||
    job.job_meta?.pay_type === 'hourly' ||
    (job.salary_max && job.salary_max > 0 && job.salary_max <= 500)
      ? 'hourly'
      : 'annual'

  const fmt = (val?: number | null) => {
    if (!val || isNaN(Number(val))) return null
    const num = Number(val)
    if (payType === 'hourly') return `$${num.toLocaleString()}`
    if (num >= 1000) {
      const k = num / 1000
      return `$${Number.isInteger(k) ? k : k.toFixed(1)}k`
    }
    return `$${num.toLocaleString()}`
  }

  const minS = fmt(job.salary_min)
  const maxS = fmt(job.salary_max)
  const suffix = payType === 'hourly' ? '/hr' : '/yr'

  if (minS && maxS) return `${minS} – ${maxS} ${suffix}`
  if (minS) return `${minS}+ ${suffix}`
  if (maxS) return `Up to ${maxS} ${suffix}`
  return 'Compensation Open'
}

export default function CandidateApplicationsPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [applications, setApplications] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(5)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [daysFilter, setDaysFilter] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [expandedRadarIds, setExpandedRadarIds] = useState<
    Record<string, boolean>
  >({})

  useEffect(() => {
    setIsMounted(true)
    try {
      const saved = Number(localStorage.getItem('ss_cand_apps_per_page_v1'))
      if ([5, 10, 25, 50].includes(saved)) setItemsPerPage(saved)
    } catch {}
  }, [])

  const fetchApplications = async () => {
    setIsLoading(true)
    const res = await getCandidateApplications(
      statusFilter,
      daysFilter,
      searchQuery
    )
    if (res?.data) {
      setApplications(res.data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchApplications()
  }, [statusFilter, daysFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchApplications()
  }

  const toggleRadar = (id: string) => {
    setExpandedRadarIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, daysFilter, applications.length])

  const totalApplications = applications.length
  const totalPages = Math.max(1, Math.ceil(totalApplications / itemsPerPage))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (safeCurrentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalApplications)
  const paginatedApplications = applications.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="max-w-6xl mx-auto py-3 space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-300">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Protected Application Tracker
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your anonymous applications, chat privately with verified employers, and share your full resume and contact info when ready.
          </p>
        </div>

        <Link
          href="/dashboard/jobs"
          className="shrink-0 inline-flex items-center px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors shadow-sm"
        >
          + Browse More Roles →
        </Link>
      </header>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-300 shadow-xs space-y-4 border-slate-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Applications' },
              { id: 'shortlisted', label: '★ Shortlisted' },
              { id: 'unlocked', label: '💬 Private Chat Open' },
              { id: 'pending', label: '🔒 Protected / Pending Review' },
              { id: 'rejected', label: 'Archived' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Timeframe Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Timeframe:
            </span>
            <select
              value={daysFilter}
              onChange={(e) => setDaysFilter(Number(e.target.value))}
              className="rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer border-slate-300"
            >
              <option value={0}>All Time</option>
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>
        </div>

        {/* Keyword Search */}
        <form
          onSubmit={handleSearchSubmit}
          className="pt-3 border-t border-slate-300 flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by role title, skill, Reference ID (SS-...), or unlocked company name..."
            className="w-full min-w-0 sm:flex-1 rounded-xl border-2 border-slate-300 bg-slate-50 px-3.5 sm:px-4 py-2.5 sm:py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors cursor-pointer shrink-0"
          >
            Search
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                getCandidateApplications(statusFilter, daysFilter, '').then(
                  (res) => {
                    if (res?.data) setApplications(res.data)
                  }
                )
              }}
              className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 cursor-pointer"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border-2 border-slate-300 text-center shadow-xs border-slate-300">
          <div className="inline-block w-8 h-8 border-4 border-slate-300 border-t-indigo-600 rounded-full animate-spin mb-3" />
          <p className="text-sm font-bold text-slate-500">
            Loading your application pipeline...
          </p>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border-2 border-slate-300 text-center shadow-xs space-y-3 border-slate-300">
          <h3 className="text-lg font-extrabold text-slate-900">
            No protected applications match your current filter
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Run a free TrueFit Score™ check on open roles and submit a protected application whenever you score 40%+.
          </p>
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors"
          >
            Explore Open Roles →
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {paginatedApplications.map((app) => {
            const job = app.jobs || {}
            const normStatus = app.normalized_status || 'pending'
            const isUnlocked = Boolean(
              app.is_revealed ||
                normStatus === 'unlocked' ||
                normStatus === 'shortlisted'
            )
            const vaultReleased = Boolean(
              app.match_data?.candidate_vault_released === true
            )

            const rankInfo = getQuickJobCardRank(job)
            const payBand = formatJobPayBand(job)

            const rawIndustry = job.industry || job.job_meta?.industry || ''
            const industryLabel = rawIndustry
              ? normalizeIndustryVertical(rawIndustry)
              : 'Verified Employer'

            const rawEduReq =
              job.education_req || job.job_meta?.education_req || ''
            const eduReqLabel = rawEduReq
              ? normalizeJobEducationReq(rawEduReq)
              : ''
            const reqCerts =
              job.required_certifications ||
              job.job_meta?.required_certifications ||
              ''
            const reqLanguages = normalizeLanguageList(
              job.required_languages || job.job_meta?.required_languages,
              true
            )

            const matchScore =
              app.match_score ?? app.match_data?.overall_score ?? null
            const radarData = app.match_data?.radar_data || null
            const showRadar = Boolean(expandedRadarIds[app.id])
            const threadMessages = Array.isArray(app.match_data?.messages)
              ? app.match_data.messages
              : []

            const employerBadgeText = isUnlocked
              ? app.unlocked_employer_name ||
                job.organizations?.name ||
                'Verified Employer'
              : `Protected Role • ${industryLabel}`

            return (
              <div
                key={app.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  normStatus === 'shortlisted'
                    ? 'border-emerald-300 ring-2 ring-emerald-50'
                    : isUnlocked
                    ? 'border-indigo-300 ring-1 ring-indigo-50'
                    : normStatus === 'rejected'
                    ? 'border-slate-300 opacity-75'
                    : rankInfo.isFounder
                    ? 'border-amber-300/90 hover:border-indigo-300'
                    : 'border-slate-300 hover:border-indigo-300'
                }`}
              >
                <div className="p-6 md:p-8 space-y-5">
                  {/* Top Bar: Employer Status / Protected Badge, Metal Rank & Founder Pill, Ref ID, Pay Band */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-300">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider ${
                            isUnlocked
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900 text-white'
                          }`}
                        >
                          {isUnlocked ? '🔓' : '🔒'} {employerBadgeText}
                        </span>

                        <RankAndFounderPill
                          level={rankInfo.level}
                          tier={rankInfo.tier}
                          isFounder={rankInfo.isFounder}
                          founderText="Founding Partner"
                          size="xs"
                        />

                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-300">
                          Ref: {app.reference_id}
                        </span>

                        <span className="text-xs text-slate-400 font-medium">
                          Applied{' '}
                          {new Date(app.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {job.title || 'Open Role'}
                      </h2>
                    </div>

                    {/* Right Side: Pay Band & Stage Status Pill */}
                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-black text-base shadow-2xs">
                        <span>{payBand}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {matchScore !== null && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-300">
                            {matchScore}% TrueFit
                          </span>
                        )}

                        {normStatus === 'shortlisted' && (
                          <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ★ Shortlisted{' '}
                            {vaultReleased ? '• Vault Released' : ''}
                          </span>
                        )}

                        {normStatus === 'unlocked' && !vaultReleased && (
                          <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-300">
                            💬 Private Chat Open (Resume Still Hidden)
                          </span>
                        )}

                        {normStatus === 'unlocked' && vaultReleased && (
                          <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-emerald-600 text-white">
                            🔓 Full Resume & Contact Shared
                          </span>
                        )}

                        {normStatus === 'pending' && (
                          <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            🔒 Protected Review Pending
                          </span>
                        )}

                        {normStatus === 'rejected' && (
                          <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300">
                            Archived by Employer
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Role Metadata Pills (Including Required Languages) */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-300 text-xs font-extrabold capitalize">
                      {job.work_model || 'Flexible'} Work Model
                    </span>
                    {job.location && (
                      <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold">
                        📍 {job.location}
                      </span>
                    )}
                    {job.employment_type && (
                      <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold">
                        {job.employment_type}
                      </span>
                    )}
                    {eduReqLabel && (
                      <span className="px-3 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-300 text-xs font-bold">
                        🎓 {eduReqLabel}
                      </span>
                    )}
                    {reqCerts && (
                      <span className="px-3 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold">
                        🏅 Certs: {reqCerts}
                      </span>
                    )}
                    {reqLanguages.map((langEntry, lIdx) => (
                      <span
                        key={`${langEntry.language}-${lIdx}`}
                        className="px-3 py-1 rounded-lg bg-teal-50 text-teal-900 border border-teal-200 text-xs font-bold"
                      >
                        🌐 {formatLanguageBadge(langEntry)}
                      </span>
                    ))}
                  </div>

                  {/* EMPLOYER ARCHIVE FEEDBACK CALLOUT */}
                  {normStatus === 'rejected' && (
                    <div className="px-4 py-3 rounded-xl bg-rose-50/90 border border-rose-300 text-xs text-rose-900 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-extrabold uppercase tracking-wider text-[11px] text-rose-700 mr-2">
                          📋 Employer Decision Feedback:
                        </span>
                        <span className="font-bold">
                          {app.match_data?.employer_archive_reason ||
                            'Archived after initial TrueFit Score™ review'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* STAGE 1 / STAGE 2 ENCRYPTED THREAD & VAULT RELEASE */}
                  {isUnlocked && normStatus !== 'rejected' && (
                    <SecureMessageThread
                      applicationId={app.id}
                      referenceId={app.reference_id}
                      viewerRole="candidate"
                      initialMessages={threadMessages}
                      initialVaultReleased={vaultReleased}
                      employerName={
                        app.unlocked_employer_name ||
                        job.organizations?.name ||
                        'Verified Employer'
                      }
                      employerDomain={
                        app.unlocked_employer_domain ||
                        job.organizations?.domain ||
                        null
                      }
                      employerEmail={app.unlocked_employer_email || null}
                      candidateEmail={app.unlocked_candidate_email || null}
                    />
                  )}

                  {/* TrueFit Score™ Summary & 5-Point Radar Toggle */}
                  <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-300 border-slate-300">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-indigo-600">
                        ⚡ Submitted 5-Point TrueFit Score™ Summary
                      </span>
                      {radarData && (
                        <button
                          type="button"
                          onClick={() => toggleRadar(app.id)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                        >
                          {showRadar
                            ? 'Hide TrueFit™ Breakdown'
                            : 'View TrueFit™ Breakdown'}
                        </button>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                      {app.match_data?.brief_analysis ||
                        app.employer_pitch ||
                        'Submitted with verified 40%+ TrueFit Score™ match.'}
                    </p>
                  </div>

                  {isMounted && showRadar && radarData && (
                    <div className="p-5 rounded-xl bg-slate-50 border-2 border-slate-300 flex flex-col lg:flex-row items-center gap-6 animate-in fade-in duration-200 border-slate-300">
                      <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {radarData.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-white px-3.5 py-2.5 rounded-lg border border-slate-300 flex justify-between items-center"
                          >
                            <span className="text-xs font-bold text-slate-600">
                              {item.subject}
                            </span>
                            <span
                              className={`text-sm font-black ${
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
                        ))}
                      </div>
                      <div className="w-full max-w-[280px] h-[210px] shrink-0 mx-auto">
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

                  {/* Privacy Status Footer */}
                  {!isUnlocked && normStatus === 'pending' && (
                    <div className="pt-3 border-t border-slate-300 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        🛡️ <strong className="text-slate-700">Stage 0 Identity Protection:</strong> Your name, email, and PDF resume are hidden while the hiring team reviews your skill matrix.
                      </span>
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
                  {totalApplications}
                </strong>{' '}
                {totalApplications === 1 ? 'application' : 'applications'}
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