'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCandidateApplications, recalculatePitchMatch } from '@/app/dashboard/actions'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'

export function CandidateApplications() {
  const [applications, setApplications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'unlocked' | 'shortlisted' | 'rejected'>('all')
  const [daysFilter, setDaysFilter] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRadarId, setExpandedRadarId] = useState<string | null>(null)
  const [recalculatingId, setRecalculatingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ id: string; type: 'success' | 'error'; text: string } | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const fetchApplications = async () => {
    setIsLoading(true)
    const result = await getCandidateApplications('all', daysFilter || undefined, searchQuery || undefined)
    if (result.data) {
      setApplications(result.data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchApplications()
  }, [daysFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchApplications()
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleRecalculate = async (applicationId: string) => {
    setRecalculatingId(applicationId)
    setFeedback(null)

    const result = await recalculatePitchMatch(applicationId)
    if (result?.error) {
      setFeedback({ id: applicationId, type: 'error', text: result.error })
    } else if (result?.data) {
      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId
            ? {
                ...app,
                match_score: result.data.match_score,
                employer_pitch: result.data.employer_pitch,
                match_data: result.data.match_data
              }
            : app
        )
      )
      setFeedback({
        id: applicationId,
        type: 'success',
        text: `AI Match recalculated (${result.data.match_score}%) using your latest profile skills!`
      })
    }

    setRecalculatingId(null)
  }

  const filteredApplications = applications.filter(app => {
    if (statusFilter === 'all') return true
    return app.normalized_status === statusFilter
  })

  const pendingCount = applications.filter(a => a.normalized_status === 'pending').length
  const unlockedCount = applications.filter(a => a.normalized_status === 'unlocked').length
  const shortlistedCount = applications.filter(a => a.normalized_status === 'shortlisted').length
  const rejectedCount = applications.filter(a => a.normalized_status === 'rejected').length

  return (
    <div className="space-y-6">
      
      {/* Filter Bar: Status Tabs + Date Range + Keyword Search */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Submitted ({applications.length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                statusFilter === 'pending'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Pending (Identity Hidden)
              <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                statusFilter === 'pending' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {pendingCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('unlocked')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                statusFilter === 'unlocked'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Unlocked & Reviewing
              <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                statusFilter === 'unlocked' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {unlockedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('shortlisted')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                statusFilter === 'shortlisted'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Shortlisted
              <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                statusFilter === 'shortlisted' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {shortlistedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('rejected')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                statusFilter === 'rejected'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Archived / Not Selected
              <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                statusFilter === 'rejected' ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {rejectedCount}
              </span>
            </button>
          </div>

          {/* Date Filter (Includes 180 and 365 Days) */}
          <select
            value={daysFilter}
            onChange={(e) => setDaysFilter(Number(e.target.value))}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
          >
            <option value={0}>All Time</option>
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
            <option value={180}>Last 180 Days</option>
            <option value={365}>Last 365 Days (1 Year)</option>
          </select>
        </div>

        {/* Keyword Search */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter applications by Reference ID (e.g. SS-...), role title, skill, or unlocked company..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Loading your application history...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No applications found</h3>
          <p className="text-slate-500 max-w-md mx-auto text-sm mb-6">
            {statusFilter === 'all'
              ? "You haven't submitted any blind applications yet. Browse open roles to run AI fit predictions and apply."
              : `You don't have any applications in the "${statusFilter}" stage right now.`}
          </p>
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Browse Open Roles →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredApplications.map((app) => {
            const job = app.jobs || {}
            const org = job.organizations || {}
            const status = app.normalized_status as 'pending' | 'unlocked' | 'shortlisted' | 'rejected'
            const isEmployerRevealed = Boolean(app.is_revealed || status === 'unlocked' || status === 'shortlisted')
            const referenceId =
              app.reference_id || `SS-${(app.id || '').replace(/-/g, '').substring(0, 8).toUpperCase()}`
            const employerEmail =
              app.unlocked_employer_email ||
              app.match_data?.employer_contact_email ||
              (org.domain ? `hiring@${org.domain}` : 'e@test.com')

            const matchScore = app.match_score ?? app.match_data?.overall_score ?? null
            const radarData = app.match_data?.radar_data || null
            const aiSummary =
              app.match_data?.brief_analysis ||
              app.employer_pitch ||
              app.match_data?.employer_pitch ||
              'Your anonymous profile and skill matrix were matched against this role.'
            const isExpanded = expandedRadarId === app.id

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
                key={app.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-colors ${
                  status === 'shortlisted'
                    ? 'border-emerald-300 ring-2 ring-emerald-50'
                    : status === 'unlocked'
                    ? 'border-indigo-300 ring-1 ring-indigo-50'
                    : 'border-slate-200 hover:border-indigo-200'
                }`}
              >
                <div className="p-6 md:p-8">
                  {/* Top Row: Company Identity Status, Reference ID, Date, Match %, and Stage Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 ${
                          isEmployerRevealed
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-900 text-white'
                        }`}
                      >
                        {isEmployerRevealed && org.name ? (
                          org.name.charAt(0).toUpperCase()
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">
                            {isEmployerRevealed
                              ? org.name || 'Unlocked Employer'
                              : 'Anonymous Employer (Blind Listing)'}
                          </span>
                          {org.verification_status === 'verified' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200">
                              ✓ Verified Company
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-bold border border-slate-200">
                            Ref: {referenceId}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          Applied on {new Date(app.created_at).toLocaleDateString()}
                        </span>
                      </div>
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

                      {status === 'pending' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          Pending Review (Identity Hidden)
                        </span>
                      )}

                      {status === 'unlocked' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          </svg>
                          Profile Unlocked by Employer
                        </span>
                      )}

                      {status === 'shortlisted' && (
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          ★ Shortlisted for Interview
                        </span>
                      )}

                      {status === 'rejected' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Not Selected / Archived
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Role Title & Compensation Badges */}
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-3">
                    {job.title || 'Open Role'}
                  </h2>

                  <div className="flex flex-wrap items-center gap-3 mb-5">
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

                    {isEmployerRevealed && org.domain && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                        🌐 {org.domain}
                      </span>
                    )}
                  </div>

                  {/* UNLOCKED EMPLOYER CONTACT & TRANSACTION REFERENCE ID BAR */}
                  {isEmployerRevealed && (
                    <div className="mb-5 p-5 bg-slate-900 text-white rounded-xl shadow-sm space-y-4">
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 block mb-1">
                          Employer Identity & Direct Contact Unlocked: {org.name || 'Verified Employer'}
                        </span>
                        {org.description && (
                          <p className="text-xs text-slate-300 leading-relaxed mb-2">
                            {org.description}
                          </p>
                        )}
                        <p className="text-xs text-slate-400">
                          Reference the ID below in your email subject line when communicating with {org.name || 'the hiring team'}.
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
                            onClick={() => copyToClipboard(referenceId, `ref-${app.id}`)}
                            className="px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition-colors"
                          >
                            {copiedKey === `ref-${app.id}` ? '✓ Copied' : 'Copy ID'}
                          </button>
                        </div>

                        <div className="bg-slate-800/90 px-4 py-3 rounded-lg border border-slate-700 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Hiring Team Contact Email
                            </span>
                            <span className="font-mono text-sm font-bold text-white truncate block">
                              {employerEmail}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(employerEmail, `email-${app.id}`)}
                            className="shrink-0 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors"
                          >
                            {copiedKey === `email-${app.id}` ? '✓ Copied' : 'Copy Email'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Fit Analysis & Radar Toggle */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI Match Analysis
                      </span>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={recalculatingId === app.id}
                          onClick={() => handleRecalculate(app.id)}
                          className="text-xs font-bold text-slate-600 hover:text-indigo-700 flex items-center gap-1 disabled:opacity-50"
                        >
                          <svg className={`w-3.5 h-3.5 ${recalculatingId === app.id ? 'animate-spin text-indigo-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {recalculatingId === app.id ? 'Recalculating...' : 'Refresh Score'}
                        </button>

                        {radarData && (
                          <button
                            type="button"
                            onClick={() => setExpandedRadarId(isExpanded ? null : app.id)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
                          >
                            {isExpanded ? 'Hide 5-Point Radar' : 'View 5-Point Radar Breakdown'}
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 font-medium leading-relaxed">
                      {aiSummary}
                    </p>
                  </div>

                  {/* Expandable 5-Point Radar Chart */}
                  {isExpanded && radarData && (
                    <div className="mb-5 p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col lg:flex-row items-center gap-6 animate-in fade-in duration-200">
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
                              fill="#10b981"
                              fillOpacity={0.35}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Role Description & Requirements */}
                  <div className="space-y-4">
                    {job.description && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Role Overview
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {job.description}
                        </p>
                      </div>
                    )}

                    {requiredSkills.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Core Role Requirements
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {requiredSkills.map((item, idx) => (
                            <span
                              key={idx}
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
                  {feedback?.id === app.id && (
                    <div
                      className={`mt-5 p-3 rounded-xl text-xs font-bold ${
                        feedback.type === 'error'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {feedback.text}
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