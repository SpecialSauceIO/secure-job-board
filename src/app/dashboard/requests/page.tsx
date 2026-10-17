'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getCandidateConnectionRequests,
  respondToConnectionRequest,
  recalculatePitchMatch,
} from '@/app/dashboard/actions'
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

export default function CandidateRequestsInboxPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [requests, setRequests] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [recalculatingId, setRecalculatingId] = useState<string | null>(null)
  const [expandedRadarIds, setExpandedRadarIds] = useState<
    Record<string, boolean>
  >({})
  const [feedback, setFeedback] = useState<
    Record<string, { type: 'success' | 'error'; text: string }>
  >({})

  useEffect(() => {
    setIsMounted(true)
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setIsLoading(true)
    const res = await getCandidateConnectionRequests()
    if (res?.data) {
      setRequests(res.data)
    }
    setIsLoading(false)
  }

  const handleDecision = async (
    applicationId: string,
    decision: 'accepted' | 'declined'
  ) => {
    setProcessingId(applicationId)
    setFeedback((prev) => {
      const copy = { ...prev }
      delete copy[applicationId]
      return copy
    })

    const res: any = await respondToConnectionRequest(applicationId, decision)

    if (res?.error) {
      setFeedback((prev) => ({
        ...prev,
        [applicationId]: { type: 'error', text: res.error },
      }))
      setProcessingId(null)
      return
    }

    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== applicationId) return req
        if (decision === 'declined') {
          return { ...req, status: 'rejected', is_revealed: false }
        }
        return {
          ...req,
          status: 'accepted',
          is_revealed: true,
          unlocked_employer_name:
            res.unlocked_employer_name || req.unlocked_employer_name,
          unlocked_employer_domain:
            res.unlocked_employer_domain || req.unlocked_employer_domain,
          unlocked_employer_email:
            res.unlocked_employer_email || req.unlocked_employer_email,
          unlocked_candidate_email:
            res.unlocked_candidate_email || req.unlocked_candidate_email,
        }
      })
    )

    setFeedback((prev) => ({
      ...prev,
      [applicationId]: {
        type: 'success',
        text:
          decision === 'accepted'
            ? `Pitch Accepted (+150 Profile XP • Ref: ${res.referenceId})! Stage 1 Encrypted Thread is now open below while your PDF resume and email remain vaulted.`
            : `Pitch politely declined (+150 Responsiveness XP • Ref: ${res.referenceId}).`,
      },
    }))

    setProcessingId(null)
  }

  const handleRecalculate = async (applicationId: string) => {
    setRecalculatingId(applicationId)
    const res: any = await recalculatePitchMatch(applicationId)
    if (res?.data) {
      setRequests((prev) =>
        prev.map((req) =>
          req.id === applicationId
            ? {
                ...req,
                match_score: res.data.match_score,
                match_data: res.data.match_data,
              }
            : req
        )
      )
      setExpandedRadarIds((prev) => ({ ...prev, [applicationId]: true }))
    } else if (res?.error) {
      setFeedback((prev) => ({
        ...prev,
        [applicationId]: { type: 'error', text: res.error },
      }))
    }
    setRecalculatingId(null)
  }

  const filteredRequests = requests.filter((req) => {
    const isAccepted = req.status === 'accepted' || req.is_revealed === true
    const isDeclined = req.status === 'rejected' || req.status === 'declined'
    if (statusFilter === 'accepted') return isAccepted
    if (statusFilter === 'pending') return !isAccepted && !isDeclined
    if (statusFilter === 'declined') return isDeclined
    return true
  })

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Employer Connection Pitches
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Domain-verified employers spent a connection credit to pitch you these roles based on your anonymous skill matrix. Responding awards +150 Profile XP.
          </p>
        </div>

        <Link
          href="/dashboard/jobs"
          className="shrink-0 inline-flex items-center px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors shadow-sm"
        >
          Browse All Open Roles →
        </Link>
      </header>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: `All Pitches (${requests.length})` },
            { id: 'pending', label: '⚡ Pending Your Reply' },
            { id: 'accepted', label: '🔓 Accepted & Connected' },
            { id: 'declined', label: 'Declined' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs font-bold text-emerald-700">
          🛡️ Receiving &amp; accepting employer pitches is 100% free forever
        </span>
      </div>

      {/* Pitches List */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-xs">
          <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
          <p className="text-sm font-bold text-slate-500">
            Loading your employer pitch inbox...
          </p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-xs space-y-3">
          <h3 className="text-lg font-extrabold text-slate-900">
            No employer pitches in this tab yet
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Keep your anonymous Skill Matrix, Education, Certifications, and Languages updated on your Profile so verified hiring teams can discover and pitch you.
          </p>
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors"
          >
            Review My Anonymous Profile →
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredRequests.map((req) => {
            const job = req.jobs || {}
            const isAccepted =
              req.status === 'accepted' || req.is_revealed === true
            const isDeclined =
              req.status === 'rejected' || req.status === 'declined'
            const vaultReleased = Boolean(
              req.match_data?.candidate_vault_released === true
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
              req.match_score ?? req.match_data?.overall_score ?? null
            const radarData = req.match_data?.radar_data || null
            const showRadar = Boolean(expandedRadarIds[req.id])
            const threadMessages = Array.isArray(req.match_data?.messages)
              ? req.match_data.messages
              : []
            const cardMsg = feedback[req.id]

            const companyHeading = isAccepted
              ? req.unlocked_employer_name ||
                job.organizations?.name ||
                'Verified Employer'
              : `Blind Employer Pitch • ${industryLabel}`

            return (
              <div
                key={req.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  isAccepted
                    ? 'border-emerald-300 ring-2 ring-emerald-50'
                    : isDeclined
                    ? 'border-slate-200 opacity-75'
                    : rankInfo.isFounder
                    ? 'border-amber-300/90 hover:border-indigo-300'
                    : 'border-slate-200 hover:border-indigo-200'
                }`}
              >
                <div className="p-6 md:p-8 space-y-5">
                  {/* Top Bar: Employer Identity / Blind Status, Metal Rank & Founder Badge, Pay Band */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider ${
                            isAccepted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900 text-white'
                          }`}
                        >
                          {isAccepted ? '🔓' : '🔒'} {companyHeading}
                        </span>

                        <RankAndFounderPill
                          level={rankInfo.level}
                          tier={rankInfo.tier}
                          isFounder={rankInfo.isFounder}
                          founderText="Founding Partner"
                          size="xs"
                        />

                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-200">
                          Ref: {req.reference_id}
                        </span>

                        <span className="text-xs text-slate-400 font-medium">
                          Pitched{' '}
                          {new Date(req.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {job.title || 'Open Role'}
                      </h2>
                    </div>

                    <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                      <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-base shadow-2xs">
                        <span>{payBand}</span>
                      </div>
                      {matchScore !== null && (
                        <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {matchScore}% AI Match
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Role Metadata Pills (Including Required Languages) */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-100 text-xs font-extrabold capitalize">
                      {job.work_model || 'Flexible'} Work Model
                    </span>
                    {job.location && (
                      <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold">
                        📍 {job.location}
                      </span>
                    )}
                    {job.employment_type && (
                      <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
                        {job.employment_type}
                      </span>
                    )}
                    {eduReqLabel && (
                      <span className="px-3 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold">
                        🎓 {eduReqLabel}
                      </span>
                    )}
                    {reqCerts && (
                      <span className="px-3 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
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

                  {/* Role Description */}
                  {job.description && (
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {job.description}
                    </p>
                  )}

                  {/* AI Pitch Summary & Radar */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-indigo-600">
                        ⚡ Why You Matched This Role (5-Point AI Radar)
                      </span>
                      <div className="flex items-center gap-3">
                        {radarData && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRadarIds((prev) => ({
                                ...prev,
                                [req.id]: !prev[req.id],
                              }))
                            }
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                          >
                            {showRadar ? 'Hide 5-Point Radar' : 'View 5-Point Radar'}
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={recalculatingId === req.id}
                          onClick={() => handleRecalculate(req.id)}
                          className="text-xs font-extrabold text-slate-600 hover:text-indigo-600 cursor-pointer disabled:opacity-50"
                        >
                          {recalculatingId === req.id
                            ? 'Scoring...'
                            : '↻ Recalculate Fit'}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                      {req.match_data?.employer_pitch ||
                        req.match_data?.brief_analysis ||
                        'Your anonymous skill matrix and experience matched this employer’s requirements.'}
                    </p>
                  </div>

                  {isMounted && showRadar && radarData && (
                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col lg:flex-row items-center gap-6 animate-in fade-in duration-200">
                      <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {radarData.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-white px-3.5 py-2.5 rounded-lg border border-slate-200 flex justify-between items-center"
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
                            outerRadius="65%"
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

                  {/* Feedback Banner */}
                  {cardMsg && (
                    <div
                      className={`p-3.5 rounded-xl text-xs font-bold border ${
                        cardMsg.type === 'error'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {cardMsg.text}
                    </div>
                  )}

                  {/* STAGE 1 / STAGE 2 ENCRYPTED MESSAGE THREAD (WHEN ACCEPTED) */}
                  {isAccepted && (
                    <SecureMessageThread
                      applicationId={req.id}
                      referenceId={req.reference_id}
                      viewerRole="candidate"
                      initialMessages={threadMessages}
                      initialVaultReleased={vaultReleased}
                      employerName={
                        req.unlocked_employer_name ||
                        job.organizations?.name ||
                        'Verified Employer'
                      }
                      employerDomain={
                        req.unlocked_employer_domain ||
                        job.organizations?.domain ||
                        null
                      }
                      employerEmail={req.unlocked_employer_email || null}
                      candidateEmail={req.unlocked_candidate_email || null}
                    />
                  )}

                  {/* Action Footer (Accept / Decline) */}
                  {!isAccepted && !isDeclined && (
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <p className="text-xs text-slate-500">
                        <strong className="text-slate-700">
                          Stage 1 Safe Connection (+150 XP):
                        </strong>{' '}
                        Accepting reveals the employer&apos;s verified company name and opens a chat thread, while keeping your PDF resume and email locked until Stage 2.
                      </p>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          type="button"
                          disabled={processingId === req.id}
                          onClick={() => handleDecision(req.id, 'declined')}
                          className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Politely Decline (+150 XP)
                        </button>
                        <button
                          type="button"
                          disabled={processingId === req.id}
                          onClick={() => handleDecision(req.id, 'accepted')}
                          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-emerald-600 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          {processingId === req.id
                            ? 'Connecting...'
                            : '🔓 Accept & Open Encrypted Thread (+150 XP)'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}