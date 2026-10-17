'use client'

import { useState, useEffect } from 'react'
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

function maskFirstInitial(fullName?: string | null): string {
  if (!fullName || !fullName.trim()) return 'Verified Candidate'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]?.toUpperCase() || ''}.`
}

export function ApplicationRevealCard({
  app,
  onStatusUpdated,
}: {
  app: any
  onStatusUpdated?: (
    applicationId: string,
    newStatus: 'unrevealed' | 'unlocked' | 'shortlisted' | 'rejected'
  ) => void
}) {
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
      (app?.status === 'rejected'
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

  const candidate = app?.profiles || {}
  const job = app?.jobs || {}

  const displayId = String(app?.candidate_id || candidate?.id || 'ANON')
    .split('-')[0]
    .toUpperCase()

  const referenceId =
    app?.reference_id ||
    `SS-${String(app?.id || '')
      .replace(/-/g, '')
      .substring(0, 8)
      .toUpperCase()}`

  const matchScore =
    app?.match_score ?? app?.match_data?.overall_score ?? null
  const radarData = app?.match_data?.radar_data || null
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
            typeof s === 'string' ? s : s.skill || s.name || ''
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
      String(candidate?.is_verified) === 'true' ||
      candidate?.verification_status === 'verified' ||
      candidate?.verification_status === 'approved'
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
    setIsProcessing(true)
    setErrorMsg(null)

    const formData = new FormData()
    formData.append('application_id', app.id)

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

    onStatusUpdated?.(app.id, 'unlocked')
    setIsProcessing(false)
  }

  const handleDecision = async (
    decision: 'shortlisted' | 'rejected' | 'unlocked'
  ) => {
    setIsProcessing(true)
    setErrorMsg(null)

    const res: any = await updateInboundApplicationDecision(app.id, decision)
    if (res?.error) {
      setErrorMsg(res.error)
      setIsProcessing(false)
      return
    }

    setStatus(decision)
    if (decision === 'shortlisted' || decision === 'unlocked') {
      setIsRevealed(true)
    }
    onStatusUpdated?.(app.id, decision)
    setIsProcessing(false)
  }

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
        status === 'shortlisted'
          ? 'border-emerald-300 ring-2 ring-emerald-50'
          : status === 'unlocked'
          ? 'border-indigo-300 ring-1 ring-indigo-50'
          : status === 'rejected'
          ? 'border-slate-200 opacity-80'
          : rankInfo.isFounder
          ? 'border-amber-300/90 hover:border-indigo-300'
          : 'border-slate-200 hover:border-indigo-200'
      }`}
    >
      <div className="p-6 md:p-8 space-y-5">
        {/* Top Row: Role Badge, Industry, Reference ID, Date, Match %, and Stage Status */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold">
              Applied Role: {job?.title || 'Open Role'}
            </span>
            {candidateIndustry && (
              <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-bold">
                {candidateIndustry}
              </span>
            )}
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-200">
              Ref: {referenceId}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Applied {new Date(app.created_at).toLocaleDateString()}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {matchScore !== null && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  matchScore >= 80
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}
              >
                {matchScore}% AI Match
              </span>
            )}

            {status === 'unrevealed' && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Blind Application (Free to Unlock)
              </span>
            )}

            {status === 'unlocked' && !vaultReleased && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                🛡️ Stage 1 Thread Open (Vault Locked)
              </span>
            )}

            {status === 'unlocked' && vaultReleased && (
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                🔓 Stage 2 Vault Released
              </span>
            )}

            {status === 'shortlisted' && (
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                ★ Shortlisted {vaultReleased ? '• Vault Released' : ''}
              </span>
            )}

            {status === 'rejected' && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                Archived / Not Selected
              </span>
            )}
          </div>
        </div>

        {/* Candidate Identity Header + Metal Rank & Season 0 Founding Member Pills */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                status === 'shortlisted'
                  ? 'bg-emerald-600 text-white'
                  : isRevealed
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-white'
              }`}
            >
              {isRevealed ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900">
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
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold">
                    ✓ Identity Verified
                  </span>
                )}

                {rankInfo.isVaultReady && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-900 border border-emerald-300 text-[10px] font-extrabold">
                    🛡️ 100% Vault Ready
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 mt-1">
                {candidate?.experience_years && (
                  <>
                    <span>{candidate.experience_years} Yrs Experience</span>
                    <span>•</span>
                  </>
                )}
                <span className="text-emerald-600">
                  Min Salary: $
                  {candidate?.min_salary_expectation
                    ? (candidate.min_salary_expectation / 1000).toFixed(0) + 'k'
                    : 'Open'}
                </span>
                <span>•</span>
                <span className="capitalize">
                  Prefers {candidate?.preferred_work_model || 'Any'}
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
        </div>

        {/* Education & Active Certifications Row */}
        {(candidateEducation ||
          candidateCertifications ||
          jobEducationReq) && (
          <div className="flex flex-wrap items-center gap-2">
            {candidateEducation && (
              <span className="px-3 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold">
                🎓 {candidateEducation}
              </span>
            )}
            {candidateCertifications && (
              <span className="px-3 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                🏅 Certs: {candidateCertifications}
              </span>
            )}
            {jobEducationReq && (
              <span className="text-[11px] font-semibold text-slate-400 ml-1">
                (Role Target: {jobEducationReq})
              </span>
            )}
          </div>
        )}

        {/* STAGE 1 / STAGE 2 SECURE MESSAGE THREAD & VAULT */}
        {isRevealed && status !== 'rejected' && (
          <SecureMessageThread
            applicationId={app.id}
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

        {/* AI Fit Summary & 5-Point Radar Toggle */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <span className="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
              <svg
                className="w-4 h-4"
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
              AI Fit Summary
            </span>

            {radarData && (
              <button
                type="button"
                onClick={() => setShowRadar((prev) => !prev)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              >
                {showRadar
                  ? 'Hide Radar Breakdown'
                  : 'View 5-Point Radar Breakdown'}
              </button>
            )}
          </div>
          <p className="text-sm text-slate-700 font-medium leading-relaxed">
            {briefAnalysis}
          </p>
        </div>

        {/* Expandable 5-Point Radar Chart */}
        {showRadar && radarData && (
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col lg:flex-row items-center gap-6 animate-in fade-in duration-200">
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
              {radarData.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-white px-3.5 py-2.5 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center"
                >
                  <span className="text-xs font-bold text-slate-600">
                    {item.subject}
                  </span>
                  <span
                    className={`text-sm font-black ${
                      item.score >= 80
                        ? 'text-emerald-500'
                        : item.score >= 60
                        ? 'text-amber-500'
                        : 'text-rose-500'
                    }`}
                  >
                    {item.score}%
                  </span>
                </div>
              ))}
            </div>
            <div className="w-full max-w-[300px] h-[220px] shrink-0 mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="60%"
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

        {/* Candidate Bio & Skills */}
        <p className="text-sm text-slate-600 leading-relaxed">
          {candidate?.bio || 'No summary bio provided.'}
        </p>

        <div className="flex flex-wrap gap-2">
          {candidateSkills.map((skill, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md border border-slate-200"
            >
              {skill}
            </span>
          ))}
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {/* Action Bar */}
        <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {!isRevealed && status !== 'rejected' ? (
            <>
              <p className="text-xs text-slate-500">
                <strong className="text-slate-700">
                  100% Free Inbound Unlock (+150 XP):
                </strong>{' '}
                Opening a Stage 1 thread with an inbound applicant costs 0 Connection Credits.
              </p>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleDecision('rejected')}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Not a Fit
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleDecision('shortlisted')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  ★ Shortlist &amp; Open Thread
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleUnlock}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing
                    ? 'Unlocking...'
                    : '🔓 Unlock & Open Stage 1 Thread (Free)'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
              <span className="text-xs font-bold text-slate-600">
                {status === 'shortlisted'
                  ? '★ Candidate is Shortlisted in your active interview pipeline.'
                  : status === 'rejected'
                  ? 'Candidate archived as Not a Fit.'
                  : '✓ Stage 1 Thread Open. Send an introductory message above (+225 XP).'}
              </span>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {status !== 'shortlisted' && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleDecision('shortlisted')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    ★ Move to Shortlisted
                  </button>
                )}
                {status !== 'rejected' ? (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleDecision('rejected')}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Archive / Not a Fit
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleDecision('unlocked')}
                    className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-extrabold hover:bg-indigo-100 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Restore &amp; Open Thread
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}