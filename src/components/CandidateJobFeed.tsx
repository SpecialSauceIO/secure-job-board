'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { analyzeJobFit, applyBlind } from '@/app/dashboard/actions'
import {
  getUserBookmarks,
  toggleBookmarkItem,
} from '@/app/dashboard/bookmark-actions'
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

  return {
    formattedPay,
    payType,
    compPerks: job.comp_perks || metaItem.comp_perks || '',
    location: job.location || metaItem.location || '',
    employmentType:
      job.employment_type || metaItem.employment_type || 'Full-Time (W-2)',
    experienceLevel: job.experience_level || metaItem.experience_level || '',
    industry: job.industry || metaItem.industry || '',
    companySize: job.company_size || metaItem.company_size || '',
    workAuth: job.work_auth || metaItem.work_auth || '',
    visibleReqs,
  }
}

export function CandidateJobFeed({
  jobs,
  isVerified = false,
  savedJobIds: externalSavedIds,
  onToggleSaveJob,
}: {
  jobs: any[]
  isVerified?: boolean
  savedJobIds?: string[]
  onToggleSaveJob?: (jobId: string) => void
}) {
  const [jobList, setJobList] = useState<any[]>(jobs || [])
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

  // Load saved bookmarks automatically if not passed by parent page
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
    // Optimistic update
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
        setMatchResults((prev) => ({
          ...prev,
          [jobId]: result.data,
        }))
      } else {
        setFeedback((prev) => ({
          ...prev,
          [jobId]: {
            type: 'error',
            text: 'Unable to generate AI Match score at this moment. Please try again.',
          },
        }))
      }
    } catch (err: any) {
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

  if (!jobList || jobList.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
      {jobList.map((job) => {
        const jobId = String(job.uuid || job.id)
        const meta = extractJobCardMeta(job)
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
                ? 'border-amber-300 shadow-sm'
                : 'border-slate-200 shadow-sm hover:border-indigo-300'
            }`}
          >
            <div className="p-6 md:p-8 space-y-5">
              {/* Top Row: Anonymous Company Teaser, Bookmark Button, & Compensation Band */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-extrabold uppercase tracking-wider">
                      <svg
                        className="w-3.5 h-3.5 text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      Blind Role • {anonymousTeaserParts.join(' • ')}
                    </span>

                    {orgVerified && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-extrabold">
                        ✓ Domain-Verified Employer
                      </span>
                    )}

                    {isApplied && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold shadow-sm">
                        ✓ Application Submitted ({appliedRef})
                      </span>
                    )}

                    <span className="text-xs text-slate-400 font-medium">
                      Posted {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {job.title}
                  </h3>
                </div>

                {/* Prominent Pay Band Box + Save / Bookmark Button */}
                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={togglingSaveId === jobId}
                      onClick={() => handleToggleBookmark(jobId)}
                      title={
                        isBookmarked
                          ? 'Remove from saved roles'
                          : 'Save role for later comparison'
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        isBookmarked
                          ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <svg
                        className={`w-4 h-4 ${
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
                      {isBookmarked ? 'Saved' : 'Save Role'}
                    </button>

                    <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-base shadow-sm">
                      <svg
                        className="w-4 h-4 text-emerald-600 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>{meta.formattedPay}</span>
                    </div>
                  </div>
                  {meta.compPerks && meta.compPerks !== 'Base Salary Only' && (
                    <span className="text-[11px] font-extrabold text-indigo-600">
                      {meta.compPerks}
                    </span>
                  )}
                </div>
              </div>

              {/* Metadata Pills Row: Work Model, Location, Employment Type, Seniority, Work Auth */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-100 text-xs font-extrabold capitalize">
                  {job.work_model || 'Flexible'} Work Model
                </span>

                {meta.location && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold">
                    <svg
                      className="w-3.5 h-3.5 text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {meta.location}
                  </span>
                )}

                {meta.employmentType && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
                    {meta.employmentType}
                  </span>
                )}

                {meta.experienceLevel && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-violet-50 text-violet-800 border border-violet-100 text-xs font-bold">
                    {meta.experienceLevel}
                  </span>
                )}

                {meta.workAuth && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold">
                    🛡️ {meta.workAuth}
                  </span>
                )}
              </div>

              {/* Role Description */}
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {job.description}
              </p>

              {/* Core Skill Requirements */}
              {meta.visibleReqs.length > 0 && (
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                    Core Skill Requirements
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {meta.visibleReqs.map((req: any, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-slate-50 text-slate-800 text-xs font-bold rounded-lg border border-slate-200"
                      >
                        {req.skill || req.name}
                        {req.level && (
                          <span className="text-slate-400 font-semibold ml-1">
                            ({req.level})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Live 30-Second Progress Notifier Banner */}
              {isAnalyzing && (
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center gap-3.5 animate-pulse">
                  <div className="w-5 h-5 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin shrink-0" />
                  <div className="text-xs text-indigo-950">
                    <span className="font-extrabold block">
                      Analyzing 5-Point AI Fit (This may take up to 30 seconds)...
                    </span>
                    <span className="text-indigo-700 font-medium">
                      Routing your anonymous skill matrix across our 3-tier AI matching cascade. If all tiers are busy, you will be prompted to try again.
                    </span>
                  </div>
                </div>
              )}

              {/* AI Match Radar & Fit Analysis Results Box */}
              {matchData && !isAnalyzing && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-5 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
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
                        {matchData.radar_data.map((item: any, i: number) => (
                          <div
                            key={i}
                            className="bg-white px-3.5 py-2.5 rounded-lg border border-slate-200 flex items-center justify-between"
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
                            data={matchData.radar_data}
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
                </div>
              )}

              {/* Persistent Application Confirmation & Tracker CTA Banner */}
              {isApplied && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 font-black text-sm">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-emerald-950">
                        Blind Application Successfully Submitted! (Ref:{' '}
                        {appliedRef})
                      </h4>
                      <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                        Your anonymous skill matrix and {score}% AI Match Radar are now in the employer&apos;s pipeline. Your name and contact info remain hidden until they unlock your application.
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
                <div className="p-3.5 rounded-xl text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-rose-50 text-rose-700 border border-rose-200">
                  <span>{cardFeedback.text}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {!cardFeedback.text.includes('Candidate Pro') && (
                      <button
                        type="button"
                        onClick={() => handleAnalyzeFit(jobId)}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-extrabold hover:bg-rose-800 transition-colors"
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
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs text-slate-500">
                  {isApplied
                    ? `✓ Application logged under Reference ID ${appliedRef}. Track employer unlock status in your Application Tracker.`
                    : !matchData
                    ? `Step 1: Run a free AI Fit Analysis (${MIN_MATCH_THRESHOLD}%+ match required to submit a blind application • May take up to 30s).`
                    : score >= MIN_MATCH_THRESHOLD
                    ? '✓ You meet the 40%+ relevance firewall! Your name & contact info stay hidden until unlocked.'
                    : `Requires ${MIN_MATCH_THRESHOLD}%+ AI Match Score to apply (Current: ${score}%).`}
                </p>

                <div className="flex items-center gap-3 shrink-0">
                  {!isApplied && (
                    <button
                      type="button"
                      disabled={isAnalyzing || isApplying}
                      onClick={() => handleAnalyzeFit(jobId)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-extrabold hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isAnalyzing
                        ? 'Analyzing Fit (Up to 30s)...'
                        : matchData
                        ? '↻ Re-Run AI Match'
                        : '⚡ Check AI Fit Score'}
                    </button>
                  )}

                  {matchData &&
                    (isApplied ? (
                      <span className="px-5 py-2.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold inline-flex items-center gap-1.5">
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
                        title={
                          !isVerified
                            ? 'Complete Stripe Identity verification on your dashboard first'
                            : score < MIN_MATCH_THRESHOLD
                            ? `Minimum ${MIN_MATCH_THRESHOLD}% match required`
                            : 'Submit anonymous application'
                        }
                        className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
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
      })}
    </div>
  )
}