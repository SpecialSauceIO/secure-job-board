'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getCandidateConnectionRequests,
  respondToConnectionRequest,
  recalculatePitchMatch
} from '@/app/dashboard/actions'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'

export default function CandidateConnectionRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [recalculatingId, setRecalculatingId] = useState<string | null>(null)
  const [expandedRadarId, setExpandedRadarId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ id: string; type: 'success' | 'error'; text: string } | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true)
      const result = await getCandidateConnectionRequests()
      if (result.data) {
        setRequests(result.data)
      }
      setIsLoading(false)
    }
    fetchRequests()
  }, [])

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const getNormalizedStatus = (req: any): 'pending' | 'accepted' | 'declined' => {
    if (req.status === 'rejected' || req.status === 'declined') return 'declined'
    if (req.status === 'accepted' || req.is_revealed === true) return 'accepted'
    return 'pending'
  }

  const handleDecision = async (applicationId: string, decision: 'accepted' | 'declined') => {
    setProcessingId(applicationId)
    setFeedback(null)

    const result = await respondToConnectionRequest(applicationId, decision)

    if (result?.error) {
      setFeedback({ id: applicationId, type: 'error', text: result.error })
    } else {
      setRequests(prev =>
        prev.map(req =>
          req.id === applicationId
            ? {
                ...req,
                status: result.storedStatus || (decision === 'declined' ? 'rejected' : 'accepted'),
                is_revealed: decision === 'accepted',
                reference_id: result.referenceId || req.reference_id,
                unlocked_employer_email: result.unlocked_employer_email || req.unlocked_employer_email
              }
            : req
        )
      )
      setFeedback({
        id: applicationId,
        type: 'success',
        text:
          decision === 'accepted'
            ? `Connection accepted! Reference ID ${result.referenceId || ''} and direct contact details are now unlocked.`
            : 'Connection request declined. This employer can now send a fresh pitch if needed.'
      })
    }

    setProcessingId(null)
  }

  const handleRecalculate = async (applicationId: string) => {
    setRecalculatingId(applicationId)
    setFeedback(null)

    const result = await recalculatePitchMatch(applicationId)
    if (result?.error) {
      setFeedback({ id: applicationId, type: 'error', text: result.error })
    } else if (result?.data) {
      setRequests(prev =>
        prev.map(req =>
          req.id === applicationId
            ? {
                ...req,
                match_score: result.data.match_score,
                employer_pitch: result.data.employer_pitch,
                match_data: result.data.match_data
              }
            : req
        )
      )
      setFeedback({
        id: applicationId,
        type: 'success',
        text: `AI Match recalculated (${result.data.match_score}%) using your current profile skills!`
      })
    }

    setRecalculatingId(null)
  }

  const filteredRequests = requests.filter(req => {
    if (statusFilter === 'all') return true
    return getNormalizedStatus(req) === statusFilter
  })

  const pendingCount = requests.filter(r => getNormalizedStatus(r) === 'pending').length
  const acceptedCount = requests.filter(r => getNormalizedStatus(r) === 'accepted').length
  const declinedCount = requests.filter(r => getNormalizedStatus(r) === 'declined').length

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <Link
            href="/dashboard"
            className="text-indigo-600 font-bold text-sm inline-flex items-center gap-1 mb-3 hover:text-indigo-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Candidate Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Employer Connection Requests
              </h1>
              <p className="text-slate-500 mt-1">
                Employers below matched with your anonymous profile and spent a connection credit to pitch you their open role.
              </p>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-fit">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              statusFilter === 'pending'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Pending Review
            <span className={`px-2 py-0.5 rounded-full text-[11px] ${
              statusFilter === 'pending' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('accepted')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              statusFilter === 'accepted'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Accepted & Revealed
            <span className={`px-2 py-0.5 rounded-full text-[11px] ${
              statusFilter === 'accepted' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {acceptedCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('declined')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              statusFilter === 'declined'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Declined
            <span className={`px-2 py-0.5 rounded-full text-[11px] ${
              statusFilter === 'declined' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {declinedCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({requests.length})
          </button>
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">Loading incoming employer pitches...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              No {statusFilter !== 'all' ? statusFilter : ''} connection requests
            </h3>
            <p className="text-slate-500 max-w-md mx-auto text-sm">
              {statusFilter === 'pending'
                ? "You're all caught up! When employers pitch you their active roles, they will appear right here."
                : 'No connection requests match this filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredRequests.map((req) => {
              const job = req.jobs || {}
              const org = job.organizations || {}
              const companyName = org.name || 'Verified Employer'
              const referenceId =
                req.reference_id || `SS-${(req.id || '').replace(/-/g, '').substring(0, 8).toUpperCase()}`
              const matchScore = req.match_score ?? req.match_data?.overall_score ?? null
              const normalizedStatus = getNormalizedStatus(req)
              const employerEmail =
                req.unlocked_employer_email ||
                req.match_data?.employer_contact_email ||
                (org.domain ? `hiring@${org.domain}` : 'e@test.com')

              const pitchText =
                req.employer_pitch ||
                req.match_data?.employer_pitch ||
                req.match_data?.brief_analysis ||
                'Your background and skill matrix aligned strongly with our core requirements for this role.'
              const radarData = req.match_data?.radar_data || null
              const isExpanded = expandedRadarId === req.id

              const requiredSkills: { skill: string; level?: string }[] = Array.isArray(job.structured_requirements)
                ? job.structured_requirements
                    .map((item: any) =>
                      typeof item === 'string'
                        ? { skill: item }
                        : { skill: item?.skill || item?.name || '', level: item?.level }
                    )
                    .filter((r: any) => r.skill)
                : []

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-indigo-200 transition-colors"
                >
                  <div className="p-6 md:p-8">
                    {/* Top Row: Company Badge, Reference ID, Match Score, and Status */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-extrabold text-sm">
                          {companyName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                              {companyName}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-bold border border-slate-200">
                              Ref: {referenceId}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">
                            Pitched on {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
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

                        {normalizedStatus === 'pending' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Identity Hidden
                          </span>
                        )}
                        {normalizedStatus === 'accepted' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Connected & Revealed
                          </span>
                        )}
                        {normalizedStatus === 'declined' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            Declined
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Role Title & Compensation Badges */}
                    <h2 className="text-2xl font-extrabold text-slate-900 mb-3">
                      {job.title || 'Open Role'}
                    </h2>

                    <div className="flex flex-wrap items-center gap-3 mb-6">
                      {(job.salary_min || job.salary_max) && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          ${job.salary_min ? (job.salary_min / 1000).toFixed(0) + 'k' : ''}
                          {job.salary_min && job.salary_max ? ' – ' : ''}
                          {job.salary_max ? '$' + (job.salary_max / 1000).toFixed(0) + 'k' : ''} USD
                        </span>
                      )}

                      {job.work_model && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold capitalize border border-slate-200">
                          {job.work_model} Work Model
                        </span>
                      )}

                      {normalizedStatus === 'accepted' && org.domain && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                          🌐 {org.domain}
                        </span>
                      )}
                    </div>

                    {/* UNLOCKED EMPLOYER CONTACT & TRANSACTION REFERENCE ID BAR */}
                    {normalizedStatus === 'accepted' && (
                      <div className="mb-6 p-5 bg-slate-900 text-white rounded-xl shadow-sm space-y-4">
                        <div>
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 block mb-1">
                            Unlocked Employer Contact & Reference ID
                          </span>
                          <p className="text-xs text-slate-300">
                            Reference the ID below when corresponding with {companyName} regarding the {job.title} role.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                          <div className="bg-slate-800/90 px-4 py-3 rounded-lg border border-slate-700 flex items-center justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Connection Reference ID
                              </span>
                              <span className="font-mono text-sm font-extrabold text-amber-300">
                                {referenceId}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(referenceId, `ref-${req.id}`)}
                              className="px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition-colors"
                            >
                              {copiedKey === `ref-${req.id}` ? '✓ Copied' : 'Copy ID'}
                            </button>
                          </div>

                          <div className="bg-slate-800/90 px-4 py-3 rounded-lg border border-slate-700 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Employer Contact Email
                              </span>
                              <span className="font-mono text-sm font-bold text-white truncate block">
                                {employerEmail}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(employerEmail, `email-${req.id}`)}
                              className="shrink-0 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors"
                            >
                              {copiedKey === `email-${req.id}` ? '✓ Copied' : 'Copy Email'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Why You Matched Box (AI Pitch to Candidate) */}
                    <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 mb-6">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Why You Were Pitched This Role
                        </span>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={recalculatingId === req.id}
                            onClick={() => handleRecalculate(req.id)}
                            className="text-xs font-bold text-slate-600 hover:text-indigo-700 flex items-center gap-1 disabled:opacity-50"
                          >
                            <svg className={`w-3.5 h-3.5 ${recalculatingId === req.id ? 'animate-spin text-indigo-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {recalculatingId === req.id ? 'Recalculating...' : 'Recalculate AI Match'}
                          </button>

                          {radarData && (
                            <button
                              type="button"
                              onClick={() => setExpandedRadarId(isExpanded ? null : req.id)}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
                            >
                              {isExpanded ? 'Hide Radar Breakdown' : 'View Radar Breakdown'}
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">
                        {pitchText}
                      </p>
                    </div>

                    {/* Expandable AI Radar Chart Breakdown */}
                    {isExpanded && radarData && (
                      <div className="mb-6 p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col lg:flex-row items-center gap-6 animate-in fade-in duration-200">
                        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {radarData.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className="bg-white px-3.5 py-2.5 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center"
                            >
                              <span className="text-xs font-bold text-slate-600">{item.subject}</span>
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
                            <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                              <PolarGrid stroke="#cbd5e1" />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                              <Tooltip />
                              <Radar
                                name="Match Score"
                                dataKey="score"
                                stroke="#4f46e5"
                                strokeWidth={2}
                                fill="#6366f1"
                                fillOpacity={0.35}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Job Description & Core Requirements */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Role Overview
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                          {job.description || 'No description provided.'}
                        </p>
                      </div>

                      {requiredSkills.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Core Requirements
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {requiredSkills.map((item, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md border border-slate-200"
                              >
                                {item.skill}
                                {item.level ? (
                                  <span className="text-slate-400 font-medium ml-1">({item.level})</span>
                                ) : null}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Feedback Banner */}
                    {feedback?.id === req.id && (
                      <div
                        className={`mt-6 p-3 rounded-xl text-xs font-bold ${
                          feedback.type === 'error'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {feedback.text}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {normalizedStatus === 'pending' ? (
                        <>
                          <p className="text-xs text-slate-500">
                            <strong className="text-slate-700">Your identity is currently hidden.</strong> Accepting this request reveals your contact details and resume to {companyName}.
                          </p>
                          <div className="flex items-center gap-3 shrink-0">
                            <button
                              type="button"
                              disabled={processingId === req.id}
                              onClick={() => handleDecision(req.id, 'declined')}
                              className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors disabled:opacity-50"
                            >
                              Decline
                            </button>
                            <button
                              type="button"
                              disabled={processingId === req.id}
                              onClick={() => handleDecision(req.id, 'accepted')}
                              className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                            >
                              {processingId === req.id ? (
                                'Updating...'
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                  </svg>
                                  Accept & Reveal Identity
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      ) : normalizedStatus === 'accepted' ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold text-emerald-700">
                            You accepted this connection request. Both you and {companyName} can reference ID {referenceId} when communicating.
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-medium text-slate-400">
                            You declined this connection request. Your identity remains hidden from {companyName}.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}