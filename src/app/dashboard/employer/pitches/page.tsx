'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getEmployerPitches } from '@/app/dashboard/actions'
import SecureMessageThread from '@/components/SecureMessageThread'
import { normalizeIndustryVertical } from '@/constants/industries'
import {
  normalizeCandidateEducation,
  normalizeJobEducationReq,
} from '@/constants/education'
import { normalizeLanguageList } from '@/constants/languages'
import { getQuickCandidateCardRank } from '@/constants/gamification'
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

export default function EmployerSentPitchesPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [pitches, setPitches] = useState<any[]>([])
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
      const saved = Number(localStorage.getItem('ss_emp_pitches_per_page_v1'))
      if ([5, 10, 25, 50].includes(saved)) setItemsPerPage(saved)
    } catch {}
  }, [])

  const fetchPitches = async () => {
    setIsLoading(true)
    const res = await getEmployerPitches(statusFilter, daysFilter, searchQuery)
    if (res?.data) {
      setPitches(res.data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchPitches()
  }, [statusFilter, daysFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPitches()
  }

  const toggleRadar = (id: string) => {
    setExpandedRadarIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, daysFilter, pitches.length])

  const totalSentPitches = pitches.length
  const totalPages = Math.max(1, Math.ceil(totalSentPitches / itemsPerPage))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (safeCurrentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalSentPitches)
  const paginatedPitches = pitches.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-300">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Sent Connection Pitches
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track outbound role pitches sent to passive candidates, message accepted matches in private chat, and access unlocked resumes and contact info.
          </p>
        </div>

        <Link
          href="/dashboard/employer/search"
          className="shrink-0 inline-flex items-center px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors shadow-sm"
        >
          + Search &amp; Pitch Talent →
        </Link>
      </header>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-300 shadow-xs space-y-4 border-slate-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Sent Pitches' },
              { id: 'accepted', label: '🔓 Accepted / Thread Open' },
              { id: 'pending', label: '⏳ Pending Candidate Reply' },
              { id: 'declined', label: 'Declined' },
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
            placeholder="Filter by role title, skill, certification, language, Reference ID (SS-...), or unlocked candidate name..."
            className="w-full min-w-0 sm:flex-1 rounded-xl border-2 border-slate-300 bg-slate-50 px-3.5 sm:px-4 py-2.5 sm:py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors cursor-pointer shrink-0"
          >
            Filter
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                getEmployerPitches(statusFilter, daysFilter, '').then((res) => {
                  if (res?.data) setPitches(res.data)
                })
              }}
              className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 cursor-pointer"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Pitches List */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border-2 border-slate-300 text-center shadow-xs border-slate-300">
          <div className="inline-block w-8 h-8 border-4 border-slate-300 border-t-indigo-600 rounded-full animate-spin mb-3" />
          <p className="text-sm font-bold text-slate-500">
            Loading outbound pitch pipeline...
          </p>
        </div>
      ) : pitches.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border-2 border-slate-300 text-center shadow-xs space-y-3 border-slate-300">
          <h3 className="text-lg font-extrabold text-slate-900">
            No outbound pitches match your current filter
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Browse the anonymous passive talent directory to run 5-Point AI Fit checks and send direct role pitches.
          </p>
          <Link
            href="/dashboard/employer/search"
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors"
          >
            Search Passive Talent Pool →
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {paginatedPitches.map((pitch) => {
            const candidate = pitch.profiles || {}
            const job = pitch.jobs || {}
            const isAccepted = pitch.normalized_status === 'accepted'
            const isDeclined = pitch.normalized_status === 'declined'
            const vaultReleased = Boolean(
              pitch.match_data?.candidate_vault_released === true
            )
            const displayId = String(pitch.candidate_id || 'ANON')
              .split('-')[0]
              .toUpperCase()

            const rankInfo = getQuickCandidateCardRank(candidate)

            const rawIndustry =
              candidate.industry_vertical ||
              job.industry ||
              job.job_meta?.industry ||
              ''
            const industryLabel = rawIndustry
              ? normalizeIndustryVertical(rawIndustry)
              : ''

            const candidateEdu = candidate.education_level
              ? normalizeCandidateEducation(candidate.education_level)
              : ''
            const candidateCerts = candidate.certifications
              ? String(candidate.certifications).trim()
              : ''
            const candidateLanguages = normalizeLanguageList(
              candidate.languages,
              true
            )
            const jobEduReq =
              job.education_req || job.job_meta?.education_req
                ? normalizeJobEducationReq(
                    job.education_req || job.job_meta?.education_req
                  )
                : ''

            const candidateSkills: string[] =
              Array.isArray(candidate.structured_skills) &&
              candidate.structured_skills.length > 0
                ? candidate.structured_skills
                    .filter((s: any) => !(s && (s._ss_meta || s._ss_pref_meta)))
                    .map((s: any) =>
                      typeof s === 'string' ? s : s.skill || s.name || ''
                    )
                    .filter(Boolean)
                : typeof candidate.skills === 'string'
                ? candidate.skills
                    .split(',')
                    .map((s: string) => s.trim())
                    .filter(Boolean)
                : []

            const matchScore =
              pitch.match_score ?? pitch.match_data?.overall_score ?? null
            const radarData = pitch.match_data?.radar_data || null
            const showRadar = Boolean(expandedRadarIds[pitch.id])
            const threadMessages = Array.isArray(pitch.match_data?.messages)
              ? pitch.match_data.messages
              : []

            const candidateDisplayName = isAccepted
              ? pitch.unlocked_candidate_name ||
                `Verified Candidate #${displayId}`
              : `Anonymous Candidate #${displayId}`

            return (
              <div
                key={pitch.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  isAccepted
                    ? 'border-emerald-300 ring-2 ring-emerald-50'
                    : isDeclined
                    ? 'border-slate-300 opacity-75'
                    : rankInfo.isFounder
                    ? 'border-2 border-slate-300 shadow-sm '
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="p-4 sm:p-6 md:p-8 space-y-4">
                  {/* Top Bar: Clean Inline Role, Ref, Date + Match & Status */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-300 text-xs font-semibold text-slate-500">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-slate-900 font-extrabold">
                        Pitched Role: {job.title || 'Open Role'}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-slate-600">
                        Ref: {pitch.reference_id}
                      </span>
                      <span>•</span>
                      <span>
                        Sent {new Date(pitch.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {matchScore !== null && (
                        <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-300">
                          {matchScore}% AI Match
                        </span>
                      )}

                      {isAccepted && !vaultReleased && (
                        <span className="text-emerald-700 font-extrabold">
                          ✓ Pitch Accepted • Private Chat Open
                        </span>
                      )}

                      {isAccepted && vaultReleased && (
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-600 text-white font-extrabold">
                          🔓 Full Resume & Contact Shared
                        </span>
                      )}

                      {!isAccepted && !isDeclined && (
                        <span className="text-amber-700 font-bold">
                          ⏳ Awaiting Candidate Reply
                        </span>
                      )}

                      {isDeclined && (
                        <span className="text-rose-600 font-bold">
                          Declined
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Candidate Header + Rank & Verified */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-xl font-black text-slate-900">
                          {candidateDisplayName}
                        </h2>

                        <RankAndFounderPill
                          level={rankInfo.level}
                          tier={rankInfo.tier}
                          isFounder={rankInfo.isFounder}
                          founderText="Founding Member"
                          size="xs"
                        />

                        <span className="text-emerald-700 text-xs font-bold">
                          ✓ Verified
                        </span>
                      </div>

                      {/* Clean Inline Metadata Row */}
                      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
                        {industryLabel && (
                          <>
                            <span>{industryLabel}</span>
                            <span>•</span>
                          </>
                        )}
                        {candidate.experience_years && (
                          <>
                            <span>{candidate.experience_years} Yrs Exp</span>
                            <span>•</span>
                          </>
                        )}
                        <span className="text-emerald-700 font-semibold">
                          Min: $
                          {candidate.min_salary_expectation
                            ? (candidate.min_salary_expectation / 1000).toFixed(
                                0
                              ) + 'k'
                            : 'Open'}
                        </span>
                        <span>•</span>
                        <span className="capitalize">
                          Prefers {candidate.preferred_work_model || 'Flexible'}
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

                  {/* Clean Inline Credentials Row (Education, Certs, Languages) */}
                  {(candidateEdu ||
                    candidateCerts ||
                    candidateLanguages.length > 0 ||
                    jobEduReq) && (
                    <div className="text-xs text-slate-600 pt-1 font-medium flex flex-wrap items-center gap-x-3 gap-y-1">
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
                    </div>
                  )}

                  {/* Candidate Decline Feedback Banner */}
                  {isDeclined && (
                    <div className="px-4 py-3 rounded-xl bg-rose-50/90 border border-rose-300 text-xs text-rose-900 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-extrabold uppercase tracking-wider text-[11px] text-rose-700 mr-2">
                          📋 Candidate Decline Reason:
                        </span>
                        <span className="font-bold">
                          {pitch.match_data?.candidate_decline_reason ||
                            'Candidate passed on this role pitch'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Encrypted Stage 1 / Stage 2 Thread (When Accepted) */}
                  {isAccepted && (
                    <SecureMessageThread
                      applicationId={pitch.id}
                      referenceId={pitch.reference_id}
                      viewerRole="employer"
                      initialMessages={threadMessages}
                      initialVaultReleased={vaultReleased}
                      candidateDisplayName={candidateDisplayName}
                      candidateFullName={
                        vaultReleased ? pitch.unlocked_candidate_name : null
                      }
                      candidateEmail={
                        vaultReleased ? pitch.unlocked_candidate_email : null
                      }
                      employerEmail={pitch.unlocked_employer_email || null}
                      initialResumeUrl={
                        vaultReleased ? candidate.resume_url || null : null
                      }
                    />
                  )}

                  {/* AI Fit Summary & 5-Point Radar Toggle */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border-2 border-slate-300/80 text-xs text-slate-700 space-y-1 border-slate-300">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-indigo-700">
                      <span>5-Point AI Fit Assessment</span>
                      {radarData && (
                        <button
                          type="button"
                          onClick={() => toggleRadar(pitch.id)}
                          className="underline cursor-pointer"
                        >
                          {showRadar ? 'Hide Radar' : 'View 5-Point Radar'}
                        </button>
                      )}
                    </div>
                    <p className="leading-relaxed">
                      {pitch.match_data?.brief_analysis ||
                        'Candidate matched role requirements and dealbreakers.'}
                    </p>
                  </div>

                  {isMounted && showRadar && radarData && (
                    <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-300 flex flex-col lg:flex-row items-center gap-4 border-slate-300">
                      <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {radarData.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-white px-3 py-2 rounded-md border border-slate-300 flex justify-between items-center text-xs"
                          >
                            <span className="font-semibold text-slate-600">
                              {item.subject}
                            </span>
                            <span className="font-black text-indigo-600">
                              {item.score}%
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="w-full max-w-[240px] h-[180px] shrink-0 mx-auto">
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
                                fontSize: 9,
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
                              name="Match"
                              dataKey="score"
                              stroke="#4f46e5"
                              strokeWidth={2}
                              fill="#10b981"
                              fillOpacity={0.3}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Candidate Bio & Clean Skill List */}
                  {candidate.bio && (
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {candidate.bio}
                    </p>
                  )}

                  {candidateSkills.length > 0 && (
                    <div className="text-xs text-slate-500 pt-1 border-t border-slate-300">
                      <strong className="text-slate-700">Core Skills:</strong>{' '}
                      {candidateSkills.join(' • ')}
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
                  {totalSentPitches}
                </strong>{' '}
                {totalSentPitches === 1 ? 'pitch' : 'pitches'}
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
                      localStorage.setItem('ss_emp_pitches_per_page_v1', String(nextSize))
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