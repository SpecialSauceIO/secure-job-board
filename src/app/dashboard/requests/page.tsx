'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  getCandidateConnectionRequests,
  respondToConnectionRequest,
  recalculatePitchMatch,
} from '@/app/dashboard/actions'
import SecureMessageThread from '@/components/SecureMessageThread'
import SafetyReportButton from '@/components/SafetyReportButton'
import { CANDIDATE_DECLINE_REASONS } from '@/constants/feedback-reasons'
import { normalizeIndustryVertical } from '@/constants/industries'
import { normalizeJobEducationReq } from '@/constants/education'
import { normalizeLanguageList } from '@/constants/languages'
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
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(5)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [recalculatingId, setRecalculatingId] = useState<string | null>(null)
  const [decliningId, setDecliningId] = useState<string | null>(null)
  const [declineReasons, setDeclineReasons] = useState<Record<string, string>>({})
  const [expandedRadarIds, setExpandedRadarIds] = useState<
    Record<string, boolean>
  >({})
  const [feedback, setFeedback] = useState<
    Record<string, { type: 'success' | 'error'; text: string }>
  >({})

  useEffect(() => {
    setIsMounted(true)
    try {
      const saved = Number(localStorage.getItem('ss_cand_pitches_per_page_v1'))
      if ([5, 10, 25, 50].includes(saved)) setItemsPerPage(saved)
    } catch {}
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

  const [declineUndoMap, setDeclineUndoMap] = useState<Record<string, { seconds: number; reason: string }>>({})
  const declineTimersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({})

  useEffect(() => {
    return () => {
      Object.values(declineTimersRef.current).forEach((t) => clearInterval(t))
    }
  }, [])

  const startDeclineWithUndo = (applicationId: string, selectedReason?: string) => {
    const chosenReason = selectedReason || declineReasons[applicationId] || CANDIDATE_DECLINE_REASONS[0]
    setDecliningId(null)
    if (declineTimersRef.current[applicationId]) {
      clearInterval(declineTimersRef.current[applicationId])
    }
    setDeclineUndoMap((prev) => ({
      ...prev,
      [applicationId]: { seconds: 10, reason: chosenReason },
    }))

    let remaining = 10
    declineTimersRef.current[applicationId] = setInterval(() => {
      remaining -= 1
      if (remaining <= 0) {
        clearInterval(declineTimersRef.current[applicationId])
        delete declineTimersRef.current[applicationId]
        setDeclineUndoMap((prev) => {
          const copy = { ...prev }
          delete copy[applicationId]
          return copy
        })
        void commitCandidateDecision(applicationId, 'declined', chosenReason)
      } else {
        setDeclineUndoMap((prev) => {
          if (!prev[applicationId]) return prev
          return {
            ...prev,
            [applicationId]: { ...prev[applicationId], seconds: remaining },
          }
        })
      }
    }, 1000)
  }

  const handleUndoDecline = (applicationId: string) => {
    if (declineTimersRef.current[applicationId]) {
      clearInterval(declineTimersRef.current[applicationId])
      delete declineTimersRef.current[applicationId]
    }
    setDeclineUndoMap((prev) => {
      const copy = { ...prev }
      delete copy[applicationId]
      return copy
    })
  }

  const handleDecision = async (applicationId: string, decision: 'accepted' | 'declined', selectedReason?: string) => {
    if (decision === 'declined') {
      startDeclineWithUndo(applicationId, selectedReason)
      return
    }
    await commitCandidateDecision(applicationId, decision, selectedReason)
  }

  const commitCandidateDecision = async (applicationId: string, decision: 'accepted' | 'declined', selectedReason?: string) => {
    setProcessingId(applicationId)
    setFeedback((prev) => {
      const copy = { ...prev }
      delete copy[applicationId]
      return copy
    })

    const chosenReason = selectedReason || declineReasons[applicationId] || CANDIDATE_DECLINE_REASONS[0]
    const res: any = await respondToConnectionRequest(applicationId, decision, chosenReason)

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
          return {
            ...req,
            status: 'rejected',
            is_revealed: false,
            match_data: {
              ...(req.match_data || {}),
              candidate_decline_reason: chosenReason,
            },
          }
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
            ? `Pitch Accepted (Ref: ${res.referenceId})! Stage 1 Thread is now open below.`
            : `Pitch declined (Ref: ${res.referenceId}).`,
      },
    }))

    setDecliningId(null)
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

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter])

  const totalFilteredRequests = filteredRequests.length
  const totalPages = Math.max(1, Math.ceil(totalFilteredRequests / itemsPerPage))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (safeCurrentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalFilteredRequests)
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-300">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Employer Connection Pitches
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Domain-verified employers spent a credit to pitch you these roles. Accepting opens a secure Stage 1 thread.
          </p>
        </div>

        <Link
          href="/dashboard/jobs"
          className="shrink-0 inline-flex items-center px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors shadow-xs"
        >
          Browse All Open Roles →
        </Link>
      </header>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border-2 border-slate-300 shadow-xs flex flex-wrap items-center justify-between gap-3 border-slate-300">
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
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs font-bold text-emerald-700">
          🛡️ Receiving &amp; accepting employer pitches is 100% free
        </span>
      </div>

      {/* Pitches List */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border-2 border-slate-300 text-center shadow-xs border-slate-300">
          <div className="inline-block w-8 h-8 border-4 border-slate-300 border-t-indigo-600 rounded-full animate-spin mb-3" />
          <p className="text-sm font-bold text-slate-500">
            Loading your employer pitch inbox...
          </p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border-2 border-slate-300 text-center shadow-xs space-y-3 border-slate-300">
          <h3 className="text-lg font-extrabold text-slate-900">
            No employer pitches in this tab yet
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Keep your profile and skill matrix updated so verified employers can discover and pitch you.
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
          {paginatedRequests.map((req) => {
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
                    ? 'border-slate-300 opacity-75'
                    : rankInfo.isFounder
                    ? 'border-2 border-slate-300 shadow-sm '
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="p-6 md:p-8 space-y-4">
                  {/* Top Bar: Company Heading & Pay Band */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-3 border-b border-slate-300">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider ${
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

                        <span className="font-mono text-xs text-slate-500">
                          Ref: {req.reference_id}
                        </span>
                      </div>

                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {job.title || 'Open Role'}
                      </h2>
                    </div>

                    <div className="flex flex-col sm:items-end gap-1 shrink-0">
                      <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-black text-sm">
                        {payBand}
                      </div>
                      {matchScore !== null && (
                        <span className="text-xs font-bold text-indigo-700">
                          {matchScore}% AI Match
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Clean Inline Role Metadata (No Pills) */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-medium">
                    <span className="font-bold text-slate-800 uppercase">
                      {job.work_model || 'Flexible'}
                    </span>
                    <span>•</span>
                    {job.location && (
                      <>
                        <span>{job.location}</span>
                        <span>•</span>
                      </>
                    )}
                    <span>{job.employment_type || 'Full-Time (W-2)'}</span>
                    {eduReqLabel && (
                      <>
                        <span>•</span>
                        <span>{eduReqLabel}</span>
                      </>
                    )}
                    {reqCerts && (
                      <>
                        <span>•</span>
                        <span>Certs: {reqCerts}</span>
                      </>
                    )}
                    {reqLanguages.length > 0 && (
                      <>
                        <span>•</span>
                        <span>
                          Languages:{' '}
                          {reqLanguages
                            .map(
                              (l) =>
                                `${l.language} (${l.modality.split(' ')[0]} • ${
                                  l.proficiency
                                })`
                            )
                            .join(', ')}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Role Description */}
                  {job.description && (
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                      {job.description}
                    </p>
                  )}

                  {/* AI Pitch Summary */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border-2 border-slate-300/80 text-xs text-slate-700 space-y-1 border-slate-300">
                    <div className="flex items-center justify-between font-bold text-indigo-700">
                      <span>Why You Matched (5-Point AI Radar)</span>
                      {radarData && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedRadarIds((prev) => ({
                              ...prev,
                              [req.id]: !prev[req.id],
                            }))
                          }
                          className="underline cursor-pointer"
                        >
                          {showRadar ? 'Hide Radar' : 'View Radar'}
                        </button>
                      )}
                    </div>
                    <p className="leading-relaxed">
                      {req.match_data?.employer_pitch ||
                        req.match_data?.brief_analysis ||
                        'Your anonymous skill matrix and experience matched this employer’s requirements.'}
                    </p>
                  </div>

                  {/* Expandable Radar */}
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
                            outerRadius="52%" margin={{ top: 10, right: 28, bottom: 10, left: 28 }}
                            data={radarData}
                          >
                            <PolarGrid stroke="#cbd5e1" />
                            <PolarAngleAxis
                              dataKey="subject"
                              tick={{ fill: '#475569', fontSize: 9, fontWeight: 600 }}
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

                  {/* Feedback Banner */}
                  {cardMsg && (
                    <div
                      className={`p-3 rounded-xl text-xs font-bold border ${
                        cardMsg.type === 'error'
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {cardMsg.text}
                    </div>
                  )}

                  {/* STAGE 1 THREAD */}
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

                  {/* Action Footer */}
                  {isDeclined && req.match_data?.candidate_decline_reason && (
                    <div className="px-3.5 py-2.5 rounded-xl bg-rose-50/80 border border-rose-200 text-xs text-rose-900">
                      <strong className="font-extrabold">Declined Reason Sent to Employer:</strong>{' '}
                      {req.match_data.candidate_decline_reason}
                    </div>
                  )}
                  {!isAccepted && !isDeclined && (
                    <div className="pt-3 border-t border-slate-300 space-y-3 text-xs">
                      {declineUndoMap[req.id] ? (
                        <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 text-amber-950 font-bold">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black text-[11px] tabular-nums">
                              {declineUndoMap[req.id].seconds}s
                            </span>
                            <span>
                              Declining pitch (&ldquo;{declineUndoMap[req.id].reason}&rdquo;) in {declineUndoMap[req.id].seconds}s...
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUndoDecline(req.id)}
                              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-600 text-white font-extrabold transition-colors cursor-pointer shadow-2xs"
                            >
                              ↺ Undo Decline ({declineUndoMap[req.id].seconds}s)
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                      {decliningId === req.id && (
                        <div className="p-3.5 rounded-xl bg-rose-50/70 border-2 border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1 space-y-1">
                            <label className="font-extrabold text-rose-950 block">
                              Let the employer know why you are passing on this pitch:
                            </label>
                            <select
                              value={declineReasons[req.id] || CANDIDATE_DECLINE_REASONS[0]}
                              onChange={(e) =>
                                setDeclineReasons((prev) => ({
                                  ...prev,
                                  [req.id]: e.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500"
                            >
                              {CANDIDATE_DECLINE_REASONS.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              disabled={processingId === req.id}
                              onClick={() => setDecliningId(null)}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={processingId === req.id}
                              onClick={() =>
                                handleDecision(
                                  req.id,
                                  'declined',
                                  declineReasons[req.id] || CANDIDATE_DECLINE_REASONS[0]
                                )
                              }
                              className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white font-extrabold hover:bg-rose-700 cursor-pointer shadow-2xs"
                            >
                              {processingId === req.id ? 'Declining...' : 'Confirm Decline'}
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-slate-500">
                          <strong>Stage 1 Safe Connection:</strong> Accepting opens a secure chat thread while keeping your resume vaulted.
                        </span>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={processingId === req.id}
                            onClick={() => setDecliningId(req.id)}
                            className="px-3.5 py-2 rounded-xl border-2 border-slate-300 bg-white text-slate-700 font-bold hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            Decline Pitch
                          </button>
                          <button
                            type="button"
                            disabled={processingId === req.id}
                            onClick={() => handleDecision(req.id, 'accepted')}
                            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-extrabold hover:bg-emerald-600 transition-colors shadow-2xs cursor-pointer"
                          >
                            {processingId === req.id && decliningId !== req.id ? 'Connecting...' : '🔓 Accept & Connect'}
                          </button>
                        </div>
                      </div>
                        </>
                      )}
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
                  {totalFilteredRequests}
                </strong>{' '}
                {totalFilteredRequests === 1 ? 'pitch' : 'pitches'}
              </span>
              <span className="text-slate-300">|</span>
              <label className="inline-flex items-center gap-2 font-bold text-slate-700">
                <span>Per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    const nextSize = Number(e.target.value)
                    setItemsPerPage(nextSize)
                    setCurrentPage(1)
                    try {
                      localStorage.setItem('ss_cand_pitches_per_page_v1', String(nextSize))
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
                className="px-3 py-1.5 rounded-xl border-2 border-slate-300 bg-white text-slate-700 font-extrabold hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
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
                className="px-3 py-1.5 rounded-xl border-2 border-slate-300 bg-white text-slate-700 font-extrabold hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
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
