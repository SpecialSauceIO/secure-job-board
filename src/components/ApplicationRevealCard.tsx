'use client'

import { useState } from 'react'
import {
  revealProfile,
  updateInboundApplicationDecision,
} from '@/app/dashboard/actions'
import SecureMessageThread from '@/components/SecureMessageThread'
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
  application,
  onStatusChange,
}: {
  application: any
  onStatusChange?: (
    appId: string,
    newNormalizedStatus: 'unrevealed' | 'unlocked' | 'shortlisted' | 'rejected'
  ) => void
}) {
  const [isRevealed, setIsRevealed] = useState<boolean>(
    Boolean(application.is_revealed)
  )
  const [isRevealing, setIsRevealing] = useState(false)
  const [revealError, setRevealError] = useState<string | null>(null)
  const [decisionStatus, setDecisionStatus] = useState<
    'unrevealed' | 'unlocked' | 'shortlisted' | 'rejected'
  >(
    application.normalized_status ||
      (application.status === 'rejected'
        ? 'rejected'
        : application.status === 'accepted' ||
          application.match_data?.employer_decision === 'shortlisted'
        ? 'shortlisted'
        : application.is_revealed
        ? 'unlocked'
        : 'unrevealed')
  )
  const [isUpdatingDecision, setIsUpdatingDecision] = useState(false)

  const profile = application.profiles
  const vaultReleased = Boolean(
    application.match_data?.candidate_vault_released === true
  )
  const threadMessages = Array.isArray(application.match_data?.messages)
    ? application.match_data.messages
    : []

  const rawFullName =
    application.unlocked_candidate_name ||
    profile?.full_name ||
    profile?.name ||
    application.match_data?.candidate_full_name ||
    'Verified Candidate'

  const [candidateName, setCandidateName] = useState<string>(rawFullName)
  const [candidateEmail, setCandidateEmail] = useState<string | null>(
    application.unlocked_candidate_email ||
      application.match_data?.candidate_contact_email ||
      profile?.contact_email ||
      profile?.email ||
      null
  )

  const stageAwareDisplayName = vaultReleased
    ? candidateName
    : maskFirstInitial(candidateName)

  const referenceId =
    application.reference_id ||
    application.match_data?.reference_id ||
    `SS-${(application.id || '')
      .replace(/-/g, '')
      .substring(0, 8)
      .toUpperCase()}`

  const isCandidateVerified = Boolean(
    profile?.identity_verified === true ||
      profile?.is_verified === true ||
      profile?.verification_status === 'verified'
  )

  const executivePitch = application.employer_pitch
    ? application.employer_pitch.replace(
        /\[CANDIDATE_NAME\]/gi,
        stageAwareDisplayName
      )
    : null

  const handleReveal = async () => {
    setIsRevealing(true)
    setRevealError(null)
    const formData = new FormData()
    formData.append('application_id', application.id)
    const result: any = await revealProfile(formData)

    if (result?.error) {
      setRevealError(result.error)
      setIsRevealing(false)
      return
    }

    if (result?.candidate_contact_email) {
      setCandidateEmail(result.candidate_contact_email)
    }
    if (result?.candidate_full_name) {
      setCandidateName(result.candidate_full_name)
    }
    setIsRevealed(true)
    if (decisionStatus === 'unrevealed') {
      setDecisionStatus('unlocked')
      onStatusChange?.(application.id, 'unlocked')
    }
    setIsRevealing(false)
  }

  const handleDecision = async (
    decision: 'shortlisted' | 'rejected' | 'unlocked'
  ) => {
    setIsUpdatingDecision(true)
    setRevealError(null)
    const result = await updateInboundApplicationDecision(
      application.id,
      decision
    )
    if (result?.error) {
      setRevealError(result.error)
    } else {
      setDecisionStatus(decision)
      setIsRevealed(true)
      onStatusChange?.(application.id, decision)
    }
    setIsUpdatingDecision(false)
  }

  return (
    <div
      className={`p-6 md:p-8 rounded-2xl border transition-all shadow-sm bg-white ${
        decisionStatus === 'shortlisted'
          ? 'border-emerald-400 ring-4 ring-emerald-50'
          : decisionStatus === 'rejected'
          ? 'border-slate-200 opacity-85'
          : isRevealed
          ? 'border-indigo-300 ring-4 ring-indigo-50/50'
          : 'border-slate-200 hover:shadow-md'
      }`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              {isRevealed ? (
                <>
                  <svg
                    className="w-5 h-5 text-emerald-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  {stageAwareDisplayName}
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 text-slate-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  Anonymous Profile
                </>
              )}
            </h3>

            {isCandidateVerified && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold shadow-sm">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <svg
                    className="w-2.5 h-2.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
                Identity Verified
              </span>
            )}

            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-200">
              Ref: {referenceId}
            </span>

            {isRevealed && !vaultReleased && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                🛡️ Stage 1 Thread Open (Vault Locked)
              </span>
            )}

            {isRevealed && vaultReleased && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold border border-emerald-300">
                🔓 Stage 2 Vault Released
              </span>
            )}

            {decisionStatus === 'shortlisted' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold border border-emerald-300">
                ★ Shortlisted
              </span>
            )}

            {decisionStatus === 'rejected' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                Passed / Archived
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Applied {new Date(application.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {application.match_score ? (
            <div className="flex-1 sm:flex-none px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200 flex items-center justify-center gap-2 shadow-inner text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {application.match_score}% Match
            </div>
          ) : (
            <div className="flex-1 sm:flex-none px-4 py-2 bg-slate-50 text-slate-500 font-bold rounded-lg border border-slate-200 flex items-center justify-center text-sm">
              Match Pending
            </div>
          )}

          {!isRevealed ? (
            <button
              onClick={handleReveal}
              disabled={isRevealing}
              className="flex-1 sm:flex-none px-5 py-2 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-sm bg-slate-900 text-white hover:bg-indigo-600 disabled:opacity-50 cursor-pointer"
            >
              {isRevealing ? 'Opening Thread...' : 'Unlock & Message Candidate'}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={
                  isUpdatingDecision || decisionStatus === 'shortlisted'
                }
                onClick={() => handleDecision('shortlisted')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors border cursor-pointer ${
                  decisionStatus === 'shortlisted'
                    ? 'bg-emerald-600 text-white border-emerald-600 cursor-default'
                    : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                }`}
              >
                {decisionStatus === 'shortlisted'
                  ? '★ Shortlisted'
                  : 'Shortlist Candidate'}
              </button>

              <button
                type="button"
                disabled={isUpdatingDecision || decisionStatus === 'rejected'}
                onClick={() => handleDecision('rejected')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors border cursor-pointer ${
                  decisionStatus === 'rejected'
                    ? 'bg-rose-100 text-rose-700 border-rose-200 cursor-default'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                }`}
              >
                {decisionStatus === 'rejected' ? 'Archived' : 'Pass / Archive'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Anti-Harvesting Quota Error Banner (When >5 unmessaged unlocks exist) */}
      {revealError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">
          {revealError}
        </div>
      )}

      {/* STAGE 1 / STAGE 2 ENCRYPTED MESSAGING & VAULT THREAD */}
      {isRevealed && (
        <div className="mb-6">
          <SecureMessageThread
            applicationId={application.id}
            referenceId={referenceId}
            viewerRole="employer"
            initialMessages={threadMessages}
            initialVaultReleased={vaultReleased}
            candidateDisplayName={stageAwareDisplayName}
            candidateFullName={vaultReleased ? candidateName : null}
            candidateEmail={vaultReleased ? candidateEmail : null}
            employerEmail={application.unlocked_employer_email || null}
            initialResumeUrl={vaultReleased ? profile?.resume_url : null}
          />
        </div>
      )}

      {/* Secret Executive Pitch - Only shown when revealed */}
      {isRevealed && (
        <div className="mb-8 p-5 bg-emerald-50/50 border border-emerald-100 rounded-xl animate-in fade-in slide-in-from-top-4 duration-500">
          <h4 className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
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
              ></path>
            </svg>
            AI Executive Briefing
          </h4>
          <p className="text-emerald-900 text-sm leading-relaxed font-medium">
            {executivePitch ||
              'This candidate is an exceptional match based on their verified skills and experience.'}
          </p>
        </div>
      )}

      {/* The Resume & Match Data Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Extracted Experience
            </h4>
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {profile?.experience_years || '0'} Years Professional Experience
            </span>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Verified Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {profile?.structured_skills &&
              profile.structured_skills.length > 0 ? (
                profile.structured_skills.map((s: any, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm flex items-center gap-2"
                  >
                    {s.skill}{' '}
                    <span className="text-slate-400 text-xs font-bold">
                      | {s.years} YRS
                    </span>
                  </span>
                ))
              ) : (
                profile?.skills
                  ?.split(',')
                  .map((skill: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm"
                    >
                      {skill.trim()}
                    </span>
                  ))
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              AI Generated Bio
            </h4>
            <p className="text-slate-600 leading-relaxed text-sm bg-slate-50 p-5 rounded-xl border border-slate-100">
              {profile?.bio || 'No bio extracted.'}
            </p>
          </div>
        </div>

        {application.match_data?.radar_data && (
          <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-slate-100 pt-8 lg:pt-0 lg:pl-8 flex flex-col justify-center">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 text-center lg:text-left">
              Fit Analysis
            </h4>
            <div className="h-[240px] w-full max-w-[300px] mx-auto lg:mx-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="65%"
                  data={application.match_data.radar_data}
                >
                  <PolarGrid stroke="#cbd5e1" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    itemStyle={{ color: '#475569', fontWeight: 400 }}
                    labelStyle={{
                      color: '#1e293b',
                      fontWeight: 800,
                      paddingBottom: '4px',
                    }}
                  />
                  <Radar
                    name="Match Score"
                    dataKey="score"
                    stroke="#06b6d4"
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
    </div>
  )
}