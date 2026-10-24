'use client'

import { EMPLOYER_ARCHIVE_REASONS } from '@/constants/feedback-reasons'
import { useState, useEffect, useRef } from 'react'
import {
  revealProfile,
  updateInboundApplicationDecision,
} from '@/app/dashboard/actions'
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

const PILLAR_SUBTITLES: Record<string, string> = {
  'Core Competencies': 'Role skills, tools & functional capabilities',
  'Skill Tenure': 'Years in core required skills + maturity',
  'Logistics & Pay': 'Work model, location, pay & start window',
  'Industry & Creds': 'Vertical familiarity, education & certs',
  'Execution & Comm.': 'Ownership, collaboration & language fluency',
}

function normalizePillarLabel(raw?: string): string {
  const s = String(raw || '').trim().toLowerCase()
  if (s.includes('technical') || s.includes('competenc')) return 'Core Competencies'
  if (s.includes('experience') || s.includes('tenure')) return 'Skill Tenure'
  if (s.includes('role') || s.includes('logistic') || s.includes('alignment')) return 'Logistics & Pay'
  if (s.includes('domain') || s.includes('industry') || s.includes('cred')) return 'Industry & Creds'
  if (s.includes('culture') || s.includes('soft') || s.includes('execution') || s.includes('comm')) return 'Execution & Comm.'
  return raw || 'Core Competencies'
}


function maskFirstInitial(fullName?: string | null): string {
  if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
    return 'Verified Candidate'
  }
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  const lastPart = parts[parts.length - 1] || ''
  const lastInitial = lastPart.charAt(0).toUpperCase()
  return lastInitial ? `${parts[0]} ${lastInitial}.` : parts[0]
}

function safeFormatDate(rawDate?: any): string {
  if (!rawDate) return 'Recently'
  try {
    const d = new Date(rawDate)
    if (isNaN(d.getTime())) return 'Recently'
    return d.toLocaleDateString()
  } catch {
    return 'Recently'
  }
}

function normalizeCandidateAvailability(raw?: any): string {
  const val = String(raw || '').trim()
  if (!val) return '2 Weeks Notice (Standard)'
  const lower = val.toLowerCase()
  if (lower.includes('pause') || lower.includes('not accepting')) {
    return 'Paused (Not Accepting Pitches)'
  }
  if (lower.includes('immediate') || lower.includes('actively')) {
    return 'Actively Looking (Immediate)'
  }
  if (lower.includes('2 week') || lower.includes('two week') || lower.includes('standard')) {
    return '2 Weeks Notice (Standard)'
  }
  if (lower.includes('30') || lower.includes('open to offers') || lower.includes('passive')) {
    return 'Open to Offers (30+ Days)'
  }
  return val
}

function getAvailabilityBadgeClasses(raw?: any): string {
  const norm = normalizeCandidateAvailability(raw).toLowerCase()
  if (norm.includes('paused')) {
    return 'bg-rose-50 text-rose-700 border-rose-300'
  }
  if (norm.includes('immediate') || norm.includes('actively')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-300'
  }
  if (norm.includes('30+') || norm.includes('open to offers')) {
    return 'bg-amber-50 text-amber-800 border-amber-300'
  }
  return 'bg-indigo-50 text-indigo-700 border-indigo-300'
}

export function ApplicationRevealCard({
  app: appProp,
  application: applicationProp,
  onStatusUpdated,
}: {
  app?: any
  application?: any
  onStatusChange?: (
    applicationId: string,
    newStatus: 'unrevealed' | 'unlocked' | 'shortlisted' | 'rejected'
  ) => void
  onStatusUpdated?: (
    applicationId: string,
    newStatus: 'unrevealed' | 'unlocked' | 'shortlisted' | 'rejected'
  ) => void
}) {
  const app = appProp || applicationProp || {}

  const [isMounted, setIsMounted] = useState(false)
  const [isRevealed, setIsRevealed] = useState<boolean>(
    Boolean(
      app?.is_revealed ||
        app?.normalized_status === 'unlocked' ||
        app?.normalized_status === 'shortlisted'
    )
  )
  const [status, setStatus] = useState<
    'unrevealed' | 'unlocked' | 'shortlisted' | 'rejected'
  >(
    app?.normalized_status ||
      (app?.status === 'rejected' || app?.status === 'declined'
        ? 'rejected'
        : app?.status === 'accepted' || app?.status === 'shortlisted'
        ? 'shortlisted'
        : app?.is_revealed
        ? 'unlocked'
        : 'unrevealed')
  )
  const [isProcessing, setIsProcessing] = useState(false)
  const [showRadar, setShowRadar] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showArchivePrompt, setShowArchivePrompt] = useState(false)
  const [archiveReason, setArchiveReason] = useState<string>(
    app?.match_data?.employer_archive_reason || EMPLOYER_ARCHIVE_REASONS[0]
  )

  const [unlockedName, setUnlockedName] = useState<string | null>(
    app?.unlocked_candidate_name || app?.profiles?.full_name || null
  )
  const [unlockedEmail, setUnlockedEmail] = useState<string | null>(
    app?.unlocked_candidate_email || null
  )
  const [unlockedResumeUrl, setUnlockedResumeUrl] = useState<string | null>(
    app?.profiles?.resume_url || null
  )

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    setIsRevealed(
      Boolean(
        app?.is_revealed ||
          app?.normalized_status === 'unlocked' ||
          app?.normalized_status === 'shortlisted'
      )
    )
    if (app?.normalized_status) {
      setStatus(app.normalized_status)
    }
    if (app?.unlocked_candidate_name) {
      setUnlockedName(app.unlocked_candidate_name)
    }
    if (app?.unlocked_candidate_email) {
      setUnlockedEmail(app.unlocked_candidate_email)
    }
    if (app?.profiles?.resume_url) {
      setUnlockedResumeUrl(app.profiles.resume_url)
    }
  }, [app])

  const candidate =
    (Array.isArray(app?.profiles) ? app.profiles[0] : app?.profiles) || {}
  const job = (Array.isArray(app?.jobs) ? app.jobs[0] : app?.jobs) || {}

  const displayId = String(app?.candidate_id || candidate?.id || 'ANON')
    .split('-')[0]
    .toUpperCase()

  const referenceId =
    app?.reference_id ||
    `SS-${String(app?.id || '00000000')
      .replace(/-/g, '')
      .substring(0, 8)
      .toUpperCase()}`

  const matchScore =
    app?.match_score ?? app?.match_data?.overall_score ?? null
  const radarData = Array.isArray(app?.match_data?.radar_data)
    ? app.match_data.radar_data.map((d: any) => ({
        ...d,
        subject: normalizePillarLabel(d?.subject),
      }))
    : null
  const briefAnalysis =
    app?.match_data?.brief_analysis ||
    app?.employer_pitch ||
    'Candidate profile evaluated against role requirements.'

  const vaultReleased = Boolean(
    app?.match_data?.candidate_vault_released === true
  )
  const threadMessages = Array.isArray(app?.match_data?.messages)
    ? app.match_data.messages
    : []

  const rawCandidateIndustry =
    candidate?.industry_vertical ||
    job?.industry ||
    job?.job_meta?.industry ||
    ''
  const candidateIndustry = rawCandidateIndustry
    ? normalizeIndustryVertical(rawCandidateIndustry)
    : ''

  const candidateEducation = candidate?.education_level
    ? normalizeCandidateEducation(candidate.education_level)
    : ''
  const candidateCertifications = candidate?.certifications
    ? String(candidate.certifications).trim()
    : ''
  const candidateLanguages = normalizeLanguageList(candidate?.languages, true)
  const jobEducationReq =
    job?.education_req || job?.job_meta?.education_req
      ? normalizeJobEducationReq(
          job.education_req || job.job_meta?.education_req
        )
      : ''

  const rankInfo = getQuickCandidateCardRank(candidate)

  const candidateSkills: string[] =
    Array.isArray(candidate?.structured_skills) &&
    candidate.structured_skills.length > 0
      ? candidate.structured_skills
          .filter((s: any) => !(s && (s._ss_meta || s._ss_pref_meta)))
          .map((s: any) =>
            typeof s === 'string' ? s : s?.skill || s?.name || ''
          )
          .filter((str: string) => str && !String(str).startsWith('__SS_'))
      : typeof candidate?.skills === 'string'
      ? candidate.skills
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
      : []

  const isCandidateVerified = Boolean(
    candidate?.identity_verified === true ||
      String(candidate?.identity_verified) === 'true' ||
      candidate?.is_verified === true ||
      String(candidate?.is_verified) === 'true'
  )

  const stageAwareDisplayName = isRevealed
    ? vaultReleased
      ? unlockedName ||
        app?.match_data?.candidate_full_name ||
        `Verified Candidate #${displayId}`
      : maskFirstInitial(
          unlockedName ||
            app?.match_data?.candidate_full_name ||
            `Verified Candidate #${displayId}`
        )
    : `Anonymous Applicant #${displayId}`

  const handleUnlock = async () => {
    if (!app?.id) return
    setIsProcessing(true)
    setErrorMsg(null)

    const formData = new FormData()
    formData.append('application_id', String(app.id))

    const res: any = await revealProfile(formData)
    if (res?.error) {
      setErrorMsg(res.error)
      setIsProcessing(false)
      return
    }

    setIsRevealed(true)
    setStatus('unlocked')
    if (res?.candidate_full_name) setUnlockedName(res.candidate_full_name)
    if (res?.candidate_contact_email)
      setUnlockedEmail(res.candidate_contact_email)
    if (res?.resume_url) setUnlockedResumeUrl(res.resume_url)

    onStatusUpdated?.(String(app.id), 'unlocked')
    setIsProcessing(false)
  }

  const [archiveUndoSeconds, setArchiveUndoSeconds] = useState<number | null>(null)
  const archiveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pendingArchiveReasonRef = useRef<string>(archiveReason)

  const clearArchiveTimer = () => {
    if (archiveTimerRef.current) {
      clearInterval(archiveTimerRef.current)
      archiveTimerRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      clearArchiveTimer()
    }
  }, [])

  const startArchiveWithUndo = (selectedReason?: string) => {
    const chosen = selectedReason || archiveReason
    pendingArchiveReasonRef.current = chosen
    setArchiveReason(chosen)
    setShowArchivePrompt(false)
    setErrorMsg(null)
    clearArchiveTimer()
    setArchiveUndoSeconds(10)

    let remaining = 10
    archiveTimerRef.current = setInterval(() => {
      remaining -= 1
      if (remaining <= 0) {
        clearArchiveTimer()
        setArchiveUndoSeconds(null)
        void commitDecision('rejected', pendingArchiveReasonRef.current)
      } else {
        setArchiveUndoSeconds(remaining)
      }
    }, 1000)
  }

  const handleUndoArchive = () => {
    clearArchiveTimer()
    setArchiveUndoSeconds(null)
  }

  const commitDecision = async (
    decision: 'shortlisted' | 'rejected' | 'unlocked',
    selectedReason?: string
  ) => {
    if (!app?.id) return
    setIsProcessing(true)
    setErrorMsg(null)
    try {
      const res: any = await updateInboundApplicationDecision(
        String(app.id),
        decision,
        selectedReason || archiveReason
      )
      if (res?.error) {
        setErrorMsg(res.error)
        return
      }

      setStatus(decision)
      if (decision === 'shortlisted' || decision === 'unlocked') {
        setIsRevealed(true)
      }
      setShowArchivePrompt(false)
      onStatusUpdated?.(String(app.id), decision)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update application status.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDecision = async (
    decision: 'shortlisted' | 'rejected' | 'unlocked',
    selectedReason?: string
  ) => {
    if (decision === 'rejected') {
      startArchiveWithUndo(selectedReason)
      return
    }
    await commitDecision(decision, selectedReason)
  }

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
        status === 'shortlisted'
          ? 'border-emerald-300 ring-2 ring-emerald-50'
          : status === 'unlocked'
          ? 'border-indigo-300 ring-1 ring-indigo-50'
          : status === 'rejected'
          ? 'border-slate-300 opacity-80'
          : rankInfo.isFounder
          ? 'border-2 border-slate-300 shadow-sm '
          : 'border-slate-300 hover:border-slate-400'
      }`}
    >
      <div className="p-6 md:p-8 space-y-4">
        {/* Top Row: Role, Ref, Date, and Match Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-300 text-xs font-semibold text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-900 font-extrabold">
              Role: {job?.title || 'Open Role'}
            </span>
            <span>•</span>
            <span className="font-mono text-slate-600">Ref: {referenceId}</span>
            <span>•</span>
            <span>Applied {safeFormatDate(app?.created_at)}</span>
          </div>

          <div className="flex items-center gap-2">
            {matchScore !== null && (
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-300">
                {matchScore}% AI Match
              </span>
            )}
            {status === 'unrevealed' && (
              <span className="text-amber-700 font-bold">
                Protected Application
              </span>
            )}
            {status === 'unlocked' && (
              <span className="text-indigo-700 font-bold">
                💬 Private Chat Open
              </span>
            )}
            {status === 'shortlisted' && (
              <span className="text-emerald-700 font-extrabold">
                ★ Shortlisted
              </span>
            )}
            {status === 'rejected' && (
              <span className="text-rose-600 font-bold">Archived</span>
            )}
          </div>
        </div>

        {/* Candidate Identity Header + Rank & Verified */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-black text-slate-900">
                {stageAwareDisplayName}
              </h2>

              <RankAndFounderPill
                level={rankInfo.level}
                tier={rankInfo.tier}
                isFounder={rankInfo.isFounder}
                founderText="Founding Member"
                size="xs"
              />

              {isCandidateVerified && (
                <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                  ✓ Verified
                </span>
              )}
            </div>

            {/* Clean Inline Metadata (No Pills) */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
              {candidateIndustry && <span>{candidateIndustry}</span>}
              {candidateIndustry && <span>•</span>}
              {candidate?.experience_years && (
                <>
                  <span>{candidate.experience_years} Yrs Exp</span>
                  <span>•</span>
                </>
              )}
              <span className="text-emerald-700 font-semibold">
                Min: $
                {(candidate?.min_salary_expectation || candidate?.min_salary || candidate?.desired_salary)
                  ? (Number(candidate?.min_salary_expectation || candidate?.min_salary || candidate?.desired_salary) / 1000).toFixed(
                      0
                    ) + 'k'
                  : 'Open'}
              </span>
              <span>•</span>
              <span className="capitalize">
                Prefers {candidate?.preferred_work_model || 'Any'}
              </span>
              <span>•</span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-xs border ${getAvailabilityBadgeClasses(
                  candidate?.availability_window
                )}`}
              >
                ⚡ {normalizeCandidateAvailability(candidate?.availability_window)}
              </span>
              {candidate?.location && (
                <>
                  <span>•</span>
                  <span>{candidate.location}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Clean Inline Credentials Line (Education, Certs, Languages) */}
        {(candidateEducation ||
          candidateCertifications ||
          candidateLanguages.length > 0) && (
          <div className="text-xs text-slate-600 pt-1 font-medium flex flex-wrap items-center gap-x-3 gap-y-1">
            {candidateEducation && (
              <span>
                <strong className="text-slate-800">Education:</strong>{' '}
                {candidateEducation}
              </span>
            )}
            {candidateCertifications && (
              <span>
                <strong className="text-slate-800">Certs:</strong>{' '}
                {candidateCertifications}
              </span>
            )}
            {candidateLanguages.length > 0 && (
              <span>
                <strong className="text-slate-800">Languages:</strong>{' '}
                {candidateLanguages
                  .map(
                    (l) =>
                      `${l.language} (${String(l?.modality || 'Spoken & Written').split(' ')[0]} • ${
                        l.proficiency
                      })`
                  )
                  .join(', ')}
              </span>
            )}
          </div>
        )}

        {/* STAGE 1 / STAGE 2 SECURE MESSAGE THREAD & VAULT */}
        {isRevealed && status !== 'rejected' && app?.id && (
          <SecureMessageThread
            applicationId={String(app.id)}
            referenceId={referenceId}
            viewerRole="employer"
            initialMessages={threadMessages}
            initialVaultReleased={vaultReleased}
            candidateDisplayName={stageAwareDisplayName}
            candidateFullName={
              vaultReleased
                ? unlockedName || app?.match_data?.candidate_full_name || null
                : null
            }
            candidateEmail={vaultReleased ? unlockedEmail : null}
            employerEmail={app?.unlocked_employer_email || null}
            initialResumeUrl={vaultReleased ? unlockedResumeUrl : null}
          />
        )}

        {/* AI Fit Summary */}
        <div className="p-3.5 rounded-xl bg-slate-50 border-2 border-slate-300/80 text-xs text-slate-700 space-y-1 border-slate-300">
          <div className="flex items-center justify-between font-bold text-indigo-700">
            <span>AI Fit Summary</span>
            {radarData && (
              <button
                type="button"
                onClick={() => setShowRadar((prev) => !prev)}
                className="underline cursor-pointer"
              >
                {showRadar ? 'Hide Radar' : 'View 5-Point Radar'}
              </button>
            )}
          </div>
          <p className="leading-relaxed">{briefAnalysis}</p>
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
                  <div>
                    <span className="font-bold text-slate-800 block">
                      {item.subject}
                    </span>
                    {PILLAR_SUBTITLES[item.subject] && (
                      <span className="text-[10px] font-medium text-slate-400 block">
                        {PILLAR_SUBTITLES[item.subject]}
                      </span>
                    )}
                  </div>
                  <span className="font-black text-indigo-600">
                    {item.score}%
                  </span>
                </div>
              ))}
            </div>
            <div className="w-full max-w-[300px] h-[205px] shrink-0 mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="52%"
                  margin={{ top: 10, right: 28, bottom: 10, left: 28 }}
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

        {/* Candidate Bio Preview */}
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
          {candidate?.bio || 'No summary bio provided.'}
        </p>

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {/* Action Bar */}
        {status === 'rejected' && archiveReason && (
          <div className="px-3.5 py-2.5 rounded-xl bg-rose-50/80 border border-rose-200 text-xs text-rose-900 flex items-center justify-between gap-2">
            <span>
              <strong className="font-extrabold">Archived Reason Shared with Candidate:</strong> {archiveReason}
            </span>
          </div>
        )}
        {showArchivePrompt && status !== 'rejected' && (
          <div className="p-3.5 rounded-xl bg-rose-50/70 border-2 border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex-1 space-y-1">
              <label className="font-extrabold text-rose-950 block">
                Select Reason for Archiving (Shared with Candidate):
              </label>
              <select
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                className="w-full rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500"
              >
                {EMPLOYER_ARCHIVE_REASONS.map((r: string) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setShowArchivePrompt(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleDecision('rejected', archiveReason)}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white font-extrabold hover:bg-rose-700 cursor-pointer shadow-2xs"
              >
                {isProcessing ? 'Archiving...' : 'Confirm Archive'}
              </button>
            </div>
          </div>
        )}
        <div className="pt-3 border-t border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {archiveUndoSeconds !== null ? (
            <div className="w-full p-3 rounded-xl bg-amber-50 border-2 border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-amber-950 font-bold">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black text-[11px] tabular-nums">
                  {archiveUndoSeconds}s
                </span>
                <span>
                  Archiving application (&ldquo;{archiveReason}&rdquo;) in {archiveUndoSeconds}s...
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleUndoArchive}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-600 text-white font-extrabold transition-colors cursor-pointer shadow-2xs"
                >
                  ↺ Undo Archive ({archiveUndoSeconds}s)
                </button>
              </div>
            </div>
          ) : !isRevealed && status !== 'rejected' ? (
            <>
              <span className="text-slate-500">
                <strong>Free Unlock:</strong> Opening a private chat costs 0 credits.
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setShowArchivePrompt(true)}
                  className="px-3 py-2 rounded-xl border-2 border-slate-300 bg-white text-slate-700 font-bold hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  Not a Fit
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleDecision('shortlisted')}
                  className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-extrabold hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
                >
                  ★ Shortlist
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleUnlock}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-extrabold hover:bg-indigo-600 transition-colors shadow-2xs cursor-pointer"
                >
                  {isProcessing ? 'Unlocking...' : '🔓 Unlock Thread'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-slate-600 font-medium">
                {status === 'shortlisted'
                  ? '★ Candidate is Shortlisted.'
                  : status === 'rejected'
                  ? `Archived (${archiveReason})`
                  : '✓ Private Chat Open.'}
              </span>
              <div className="flex items-center gap-2">
                {status !== 'shortlisted' && status !== 'rejected' && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleDecision('shortlisted')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer"
                  >
                    ★ Shortlist
                  </button>
                )}
                {status !== 'rejected' ? (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setShowArchivePrompt(true)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Archive
                  </button>
                ) : (
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-300 text-slate-500 font-bold text-[11px]">
                    Decision Finalized
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ApplicationRevealCard
