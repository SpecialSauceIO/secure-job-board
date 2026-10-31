'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { TrueHorizonAnalysisResult } from '@/lib/true-horizon-engine'
import {
  addHorizonBridgeSkillToProfileAction,
  runTrueHorizonScanAction,
} from '@/app/dashboard/horizon/actions'

export default function TrueHorizonClient({
  initialAnalysis,
  initialProfileSummary,
}: {
  initialAnalysis: TrueHorizonAnalysisResult
  initialProfileSummary: {
    experienceYears: number
    skillCount: number
    primaryIndustry: string
    tierLabel: string
    isPaidSubscriber: boolean
  }
}) {
  const [analysis, setAnalysis] = useState<TrueHorizonAnalysisResult>(initialAnalysis)
  const [profileSummary, setProfileSummary] = useState(initialProfileSummary)
  const [selectedVerticalIdx, setSelectedVerticalIdx] = useState(0)
  const [simulatedSkills, setSimulatedSkills] = useState<Record<string, boolean>>({})
  const [addedSkills, setAddedSkills] = useState<Record<string, boolean>>({})
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const activeVertical =
    analysis.topHorizonVerticals[selectedVerticalIdx] || analysis.topHorizonVerticals[0]

  const toggleSimulatedSkill = (key: string) => {
    setSimulatedSkills((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleAddSkillToProfile = (
    skillName: string,
    level: 'Beginner' | 'Intermediate' | 'Expert' = 'Intermediate'
  ) => {
    startTransition(async () => {
      const res = await addHorizonBridgeSkillToProfileAction(skillName, level, 2)
      setToastMessage(res.message)
      if (res.ok) {
        setAddedSkills((prev) => ({ ...prev, [skillName]: true }))
        const refreshed = await runTrueHorizonScanAction()
        if (refreshed.data) setAnalysis(refreshed.data)
        if (refreshed.profileSummary) setProfileSummary(refreshed.profileSummary)
      }
      setTimeout(() => setToastMessage(null), 5000)
    })
  }

  const radarChartData = analysis.operationalRadar.map((item) => ({
    subject: item.shortLabel,
    fullAxis: item.axis,
    score: item.score,
    fullMark: 100,
  }))

  // Calculate simulated vertical score based on checked bridge skills
  const simulatedVerticalLift = activeVertical
    ? activeVertical.bridgeDeltaSkills.reduce((acc, b) => {
        const key = `vert_${activeVertical.vertical}_${b.skill}`
        return simulatedSkills[key] || addedSkills[b.skill] ? acc + b.fitLiftPoints : acc
      }, 0)
    : 0

  const currentSimulatedVerticalScore = activeVertical
    ? Math.min(97, activeVertical.currentDirectFitEstimate + simulatedVerticalLift)
    : 0

  return (
    <div className="space-y-8 pb-14">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md rounded-2xl bg-slate-900 text-white border-2 border-emerald-400/60 px-5 py-3.5 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3">
          <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 flex items-center justify-center text-xs font-black shrink-0">
            ✓
          </span>
          <p className="text-xs font-bold leading-snug">{toastMessage}</p>
        </div>
      )}

      {/* HERO HEADER: True Horizon™ Operational Transferability Engine */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0f172a] text-white border-2 border-slate-800 p-6 sm:p-8 md:p-10 shadow-lg">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-sky-500/20 via-indigo-500/15 to-emerald-500/20 blur-3xl"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/40 text-sky-300 text-[11px] font-extrabold uppercase tracking-wider">
                🧭 True Horizon™ • Cross-Industry Vector Engine
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                Patent-Pending 6D Operational Mapping
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
              Break Out of Legacy Job-Title Lock.
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Standard job boards trap you inside your past industry keywords.{' '}
              <strong className="text-white">TrueFit Score™</strong> measures your immediate keyword readiness today, while{' '}
              <strong className="text-sky-300">True Horizon™</strong> strips away industry jargon to map your{' '}
              <strong className="text-white">6-Dimensional Operational DNA</strong> across high-demand sectors—revealing the exact{' '}
              <strong className="text-emerald-300">Bridge Delta</strong> skills that unlock 75%+ matches in adjacent industries.
            </p>
          </div>

          {/* Transferability Index Pill Card */}
          <div className="shrink-0 rounded-2xl bg-slate-900/90 border-2 border-sky-500/40 p-5 text-center min-w-[230px] shadow-xl">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-sky-300">
              True Horizon™ Mobility Index
            </p>
            <div className="mt-1 flex items-baseline justify-center gap-1">
              <span className="text-4xl sm:text-5xl font-black text-white">
                {analysis.overallTransferabilityIndex}%
              </span>
            </div>
            <p className="mt-1 text-[11px] font-bold text-emerald-400">
              High Cross-Sector Transferability
            </p>
            <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between gap-2">
              <span>Current Baseline:</span>
              <span className="font-bold text-slate-200 truncate max-w-[130px]" title={profileSummary.primaryIndustry}>
                {profileSummary.primaryIndustry.split(',')[0]}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: 6D Operational DNA Radar + Axis Breakdown */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 5 cols: 6-Axis Radar Chart */}
        <div className="lg:col-span-5 rounded-3xl bg-white border-2 border-slate-300 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600">
                Stage 1 • Deconstruction
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                {profileSummary.skillCount} Verified Skills • {profileSummary.experienceYears} Yrs
              </span>
            </div>
            <h2 className="mt-1 text-lg sm:text-xl font-black text-slate-900">
              Your 6D Operational DNA Vector
            </h2>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Industry-agnostic execution primitives extracted from your skills matrix, tenure, and credentials.
            </p>
          </div>

          <div className="h-72 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarChartData}>
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 800 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                />
                <Radar
                  name="Operational DNA"
                  dataKey="score"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  fill="#0ea5e9"
                  fillOpacity={0.28}
                />
                <Tooltip
                  formatter={(value: any) => [`${value}%`, 'Operational Capability']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-600">Want to boost an operational axis?</span>
            <Link
              href="/dashboard/profile"
              className="font-extrabold text-indigo-600 hover:text-indigo-500"
            >
              Update Skills Matrix →
            </Link>
          </div>
        </div>

        {/* Right 7 cols: 6 Operational Primitives Breakdown */}
        <div className="lg:col-span-7 rounded-3xl bg-white border-2 border-slate-300 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-600">
              Universal Execution Primitives
            </span>
            <h2 className="mt-1 text-lg sm:text-xl font-black text-slate-900">
              How Employers Across Industries Read Your Capabilities
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              These 6 primitives remain constant even when you pivot between Technology, AI, FinTech, Supply Chain, or Defense.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {analysis.operationalRadar.map((item) => (
              <div
                key={item.axis}
                className="rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-900">{item.axis}</span>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                      item.score >= 80
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : item.score >= 65
                        ? 'bg-sky-100 text-sky-800 border border-sky-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {item.score}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-600 font-medium truncate" title={item.evidence}>
                  {item.evidence}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: Cross-Industry Horizon Explorer & Bridge-Delta Simulator */}
      <section className="rounded-3xl bg-white border-2 border-slate-300 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600">
              Stage 2 • Cross-Sector Vector Projection &amp; Terminology Translation
            </span>
            <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-900">
              Top 5 High-Transferability Industry Horizons
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Select any target sector below to inspect your Terminology Translation Matrix and simulate how adding Bridge Delta skills unlocks 75%+ TrueFit™ role readiness.
            </p>
          </div>
        </div>

        {/* Horizon Sector Selector Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {analysis.topHorizonVerticals.map((vert, idx) => {
            const active = idx === selectedVerticalIdx
            return (
              <button
                key={vert.vertical}
                type="button"
                onClick={() => setSelectedVerticalIdx(idx)}
                className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  active
                    ? 'bg-[#0f172a] text-white border-sky-400 shadow-md'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      active
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    Horizon #{idx + 1}
                  </span>
                  <span
                    className={`text-base font-black ${
                      active ? 'text-emerald-400' : 'text-indigo-700'
                    }`}
                  >
                    {vert.transferabilityScore}% DNA
                  </span>
                </div>
                <p className="text-xs font-extrabold leading-snug line-clamp-2">
                  {vert.vertical}
                </p>
                <p
                  className={`text-[11px] font-bold ${
                    active ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {vert.estimatedPayBand}
                </p>
              </button>
            )
          })}
        </div>

        {/* Active Horizon Deep-Dive Card */}
        {activeVertical && (
          <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-5 sm:p-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[11px] font-extrabold">
                    Target Vertical
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    Pay Band: <strong className="text-slate-900">{activeVertical.estimatedPayBand}</strong>
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  {activeVertical.vertical}
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {activeVertical.executiveSummary}
                </p>
              </div>

              {/* Before vs After Bridge Score Meter */}
              <div className="shrink-0 flex items-center gap-3 bg-white p-4 rounded-2xl border-2 border-slate-300 shadow-2xs">
                <div className="text-center px-2">
                  <span className="block text-[10px] font-extrabold uppercase text-slate-400">
                    Raw Keyword Fit
                  </span>
                  <span className="text-xl font-black text-amber-600">
                    {activeVertical.currentDirectFitEstimate}%
                  </span>
                </div>
                <span className="text-slate-400 font-black text-lg">→</span>
                <div className="text-center px-2">
                  <span className="block text-[10px] font-extrabold uppercase text-sky-600">
                    Operational DNA
                  </span>
                  <span className="text-xl font-black text-sky-700">
                    {activeVertical.transferabilityScore}%
                  </span>
                </div>
                <span className="text-slate-400 font-black text-lg">→</span>
                <div className="text-center px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-300">
                  <span className="block text-[10px] font-extrabold uppercase text-emerald-700">
                    Simulated Bridged Fit
                  </span>
                  <span className="text-2xl font-black text-emerald-700">
                    {currentSimulatedVerticalScore}%
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 6 cols: Terminology Translation Matrix & Target Archetypes */}
              <div className="lg:col-span-6 space-y-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    1. Target High-Demand Role Archetypes
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {activeVertical.targetRoleArchetypes.map((arch) => (
                      <Link
                        key={arch}
                        href={`/dashboard/jobs?q=${encodeURIComponent(arch.split(' ')[0])}`}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-indigo-500 text-xs font-extrabold text-slate-800 hover:text-indigo-600 transition-colors shadow-2xs"
                      >
                        🎯 {arch} →
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    2. Cross-Industry Terminology Translation Matrix
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    How your existing experience translates directly into {activeVertical.vertical.split(',')[0]} nomenclature:
                  </p>
                  <div className="mt-2.5 space-y-2">
                    {activeVertical.terminologyTranslations.map((tr, i) => (
                      <div
                        key={i}
                        className="rounded-xl bg-white border border-slate-300 p-3 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2 text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
                          <span>Shared Primitive: {tr.operationalPrimitive}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-11 items-center gap-2 pt-1">
                          <div className="sm:col-span-5 font-bold text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg">
                            {tr.legacyTerm}
                          </div>
                          <div className="sm:col-span-1 text-center font-black text-emerald-600">
                            ➔
                          </div>
                          <div className="sm:col-span-5 font-extrabold text-slate-900 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg">
                            {tr.targetVerticalTerm}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right 6 cols: Interactive Bridge-Delta Skill Simulator */}
              <div className="lg:col-span-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      3. Interactive Bridge-Delta Simulator
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Toggle skills below to preview your TrueFit Score™ jump, or click <strong>+ Add to Profile</strong> if you already possess the capability:
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {activeVertical.bridgeDeltaSkills.map((b) => {
                    const simKey = `vert_${activeVertical.vertical}_${b.skill}`
                    const isChecked = Boolean(simulatedSkills[simKey] || addedSkills[b.skill])
                    const isAdded = Boolean(addedSkills[b.skill])

                    return (
                      <div
                        key={b.skill}
                        className={`rounded-2xl border-2 p-3.5 transition-all ${
                          isChecked
                            ? 'bg-emerald-50/70 border-emerald-400'
                            : 'bg-white border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSimulatedSkill(simKey)}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-black text-slate-900">
                                  {b.skill}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                                  +{b.fitLiftPoints}% TrueFit Lift
                                </span>
                                <span className="text-[10px] font-bold text-slate-500">
                                  Target: {b.recommendedLevel}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                                {b.rationale}
                              </p>
                            </div>
                          </label>

                          <button
                            type="button"
                            disabled={isPending || isAdded}
                            onClick={() =>
                              handleAddSkillToProfile(b.skill, b.recommendedLevel)
                            }
                            className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-colors cursor-pointer ${
                              isAdded
                                ? 'bg-emerald-600 text-white cursor-default'
                                : 'bg-slate-900 hover:bg-indigo-600 text-white'
                            }`}
                          >
                            {isAdded ? '✓ Added' : '+ Add to Profile'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 3: Live Board "Horizon Bridge" Opportunities */}
      <section className="rounded-3xl bg-white border-2 border-slate-300 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">
              Stage 3 • Live Role Bridge Mapping
            </span>
            <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-900">
              Live Roles Where Your Operational DNA Outperforms Your Legacy Title
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              These active roles on the board match <strong>65%–95%</strong> of your underlying operational vector. Bridging 1–2 domain keywords unlocks high-priority outbound applications.
            </p>
          </div>
          <Link
            href="/dashboard/jobs"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition-colors"
          >
            Open Full Role Feed →
          </Link>
        </div>

        {analysis.liveJobBridges.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-8 text-center space-y-2">
            <p className="text-sm font-bold text-slate-800">
              Add at least 3 skills to your profile to unlock live role Horizon Bridge mapping.
            </p>
            <Link
              href="/dashboard/profile"
              className="inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-extrabold"
            >
              Complete My Profile →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.liveJobBridges.map((bridge) => (
              <div
                key={bridge.jobId}
                className="rounded-2xl border-2 border-slate-300 bg-slate-50/60 p-5 flex flex-col justify-between gap-4 hover:border-slate-400 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-extrabold">
                        {bridge.industry}
                      </span>
                      <h3 className="mt-1.5 text-base font-black text-slate-900 leading-snug">
                        {bridge.title}
                      </h3>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">
                        {bridge.workModel} • {bridge.location} •{' '}
                        <span className="text-slate-800">{bridge.formattedPay}</span>
                      </p>
                    </div>

                    <div className="shrink-0 text-right bg-white px-3 py-2 rounded-xl border border-slate-300">
                      <span className="block text-[10px] font-extrabold uppercase text-sky-600">
                        Horizon DNA
                      </span>
                      <span className="text-lg font-black text-slate-900">
                        {bridge.horizonTransferabilityScore}%
                      </span>
                      <span className="block text-[10px] font-bold text-emerald-600">
                        Bridged Fit: {bridge.projectedBridgedTrueFitScore}%
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                    {bridge.whyOperationalDnaFits}
                  </p>

                  {bridge.bridgeDeltaSkills.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                        Bridge Delta Skills to Unlock {bridge.projectedBridgedTrueFitScore}% TrueFit™:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {bridge.bridgeDeltaSkills.map((bs) => {
                          const isAdded = Boolean(addedSkills[bs.skill])
                          return (
                            <button
                              key={bs.skill}
                              type="button"
                              disabled={isPending || isAdded}
                              onClick={() =>
                                handleAddSkillToProfile(
                                  bs.skill,
                                  (bs.requiredLevel as any) || 'Intermediate'
                                )
                              }
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition-colors cursor-pointer ${
                                isAdded
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-amber-50 hover:bg-emerald-50 text-amber-900 hover:text-emerald-900 border-amber-300 hover:border-emerald-400'
                              }`}
                              title="Click to add this skill to your verified profile if you have experience in it"
                            >
                              <span>{isAdded ? '✓' : '+'}</span>
                              <span>{bs.skill}</span>
                              <span className="text-[10px] opacity-80">
                                (+{bs.fitLiftPoints}%)
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-500">
                    Raw Keyword Fit: <strong>{bridge.currentTrueFitScore}%</strong> → Bridged:{' '}
                    <strong className="text-emerald-700">
                      {bridge.projectedBridgedTrueFitScore}%
                    </strong>
                  </span>
                  <Link
                    href={`/dashboard/jobs?q=${encodeURIComponent(bridge.title)}`}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition-colors"
                  >
                    Inspect Role in Feed →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
