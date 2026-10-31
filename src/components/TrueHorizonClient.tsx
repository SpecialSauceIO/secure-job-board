'use client'

import { useState, useTransition, useMemo } from 'react'
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
import {
  resolveLearningResourceLinks,
  type TrueHorizonAnalysisResult,
  type BridgeAcquisitionModality,
  type HorizonFeasibilityTier,
} from '@/lib/true-horizon-engine'
import {
  addHorizonBridgeSkillToProfileAction,
  runTrueHorizonScanAction,
} from '@/app/dashboard/horizon/actions'

function getModalityBadgeStyles(modality: BridgeAcquisitionModality): string {
  switch (modality) {
    case 'credential_fast_track':
      return 'bg-sky-500/15 text-sky-700 border-sky-400/40'
    case 'sandbox_and_terminology':
      return 'bg-emerald-500/15 text-emerald-700 border-emerald-400/40'
    case 'industry_exposure_required':
      return 'bg-rose-500/15 text-rose-800 border-rose-400/50'
  }
}

function getFeasibilityPillStyles(tier: HorizonFeasibilityTier): string {
  switch (tier) {
    case 'high_fast_track':
      return 'bg-emerald-100 text-emerald-900 border-emerald-300'
    case 'moderate_stepping_stone':
      return 'bg-amber-100 text-amber-900 border-amber-300'
    case 'low_structural_barrier':
      return 'bg-rose-100 text-rose-900 border-rose-300'
  }
}

const VERTICALS_PER_PAGE = 5
const JOBS_PER_PAGE = 6

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

  // Pagination & Filter State for All 28 Industries
  const [verticalTierFilter, setVerticalTierFilter] = useState<'all' | HorizonFeasibilityTier>('all')
  const [verticalPage, setVerticalPage] = useState(1)
  const [selectedVerticalName, setSelectedVerticalName] = useState<string>(
    initialAnalysis.topHorizonVerticals[0]?.vertical || ''
  )

  // Pagination & Filter State for All Live Jobs
  const [jobFeasibilityFilter, setJobFeasibilityFilter] = useState<'all' | HorizonFeasibilityTier>('all')
  const [jobIndustryFilter, setJobIndustryFilter] = useState<string>('all')
  const [jobPage, setJobPage] = useState(1)

  const [simulatedSkills, setSimulatedSkills] = useState<Record<string, boolean>>({})
  const [expandedPlaybookKey, setExpandedPlaybookKey] = useState<string | null>(null)
  const [attestSkillModal, setAttestSkillModal] = useState<{
    skill: string
    recommendedLevel: 'Beginner' | 'Intermediate' | 'Expert'
    modality: BridgeAcquisitionModality
    honestFraming: string
  } | null>(null)
  const [selectedAttestLevel, setSelectedAttestLevel] = useState<
    'Beginner' | 'Intermediate' | 'Expert'
  >('Intermediate')
  const [selectedAttestYears, setSelectedAttestYears] = useState<number>(2)
  const [selectedAttestBasis, setSelectedAttestBasis] = useState<string>(
    'prior_adjacent_work'
  )

  const [addedSkills, setAddedSkills] = useState<Record<string, boolean>>({})
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Filtered & Paginated Industry Verticals
  const filteredVerticals = useMemo(() => {
    if (verticalTierFilter === 'all') return analysis.topHorizonVerticals
    return analysis.topHorizonVerticals.filter((v) => v.feasibilityTier === verticalTierFilter)
  }, [analysis.topHorizonVerticals, verticalTierFilter])

  const totalVerticalPages = Math.max(1, Math.ceil(filteredVerticals.length / VERTICALS_PER_PAGE))
  const safeVerticalPage = Math.min(Math.max(1, verticalPage), totalVerticalPages)
  const pagedVerticals = useMemo(() => {
    const start = (safeVerticalPage - 1) * VERTICALS_PER_PAGE
    return filteredVerticals.slice(start, start + VERTICALS_PER_PAGE)
  }, [filteredVerticals, safeVerticalPage])

  const activeVertical = useMemo(() => {
    return (
      filteredVerticals.find((v) => v.vertical === selectedVerticalName) ||
      pagedVerticals[0] ||
      filteredVerticals[0] ||
      analysis.topHorizonVerticals[0]
    )
  }, [filteredVerticals, pagedVerticals, selectedVerticalName, analysis.topHorizonVerticals])

  // Filtered & Paginated Live Job Bridges
  const availableJobIndustries = useMemo(() => {
    const set = new Set<string>()
    for (const jb of analysis.liveJobBridges) {
      if (jb.industry) set.add(jb.industry)
    }
    return Array.from(set).sort()
  }, [analysis.liveJobBridges])

  const filteredJobBridges = useMemo(() => {
    return analysis.liveJobBridges.filter((jb) => {
      if (jobFeasibilityFilter !== 'all' && jb.feasibilityTier !== jobFeasibilityFilter) {
        return false
      }
      if (jobIndustryFilter !== 'all' && jb.industry !== jobIndustryFilter) {
        return false
      }
      return true
    })
  }, [analysis.liveJobBridges, jobFeasibilityFilter, jobIndustryFilter])

  const totalJobPages = Math.max(1, Math.ceil(filteredJobBridges.length / JOBS_PER_PAGE))
  const safeJobPage = Math.min(Math.max(1, jobPage), totalJobPages)
  const pagedJobBridges = useMemo(() => {
    const start = (safeJobPage - 1) * JOBS_PER_PAGE
    return filteredJobBridges.slice(start, start + JOBS_PER_PAGE)
  }, [filteredJobBridges, safeJobPage])

  const toggleSimulatedSkill = (key: string) => {
    setSimulatedSkills((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleJumpToVertical = (verticalName: string) => {
    setSelectedVerticalName(verticalName)
    const idx = filteredVerticals.findIndex((v) => v.vertical === verticalName)
    if (idx >= 0) {
      setVerticalPage(Math.floor(idx / VERTICALS_PER_PAGE) + 1)
    }
  }

  const openAttestationModal = (
    skill: string,
    recommendedLevel: 'Beginner' | 'Intermediate' | 'Expert',
    modality: BridgeAcquisitionModality,
    honestFraming: string
  ) => {
    setSelectedAttestLevel(recommendedLevel)
    setSelectedAttestYears(recommendedLevel === 'Beginner' ? 1 : recommendedLevel === 'Expert' ? 4 : 2)
    setSelectedAttestBasis('prior_adjacent_work')
    setAttestSkillModal({
      skill,
      recommendedLevel,
      modality,
      honestFraming,
    })
  }

  const confirmVerifiedSkillAddition = () => {
    if (!attestSkillModal) return
    const { skill } = attestSkillModal
    startTransition(async () => {
      const res = await addHorizonBridgeSkillToProfileAction(
        skill,
        selectedAttestLevel,
        selectedAttestYears
      )
      setToastMessage(res.message)
      setAttestSkillModal(null)
      if (res.ok) {
        setAddedSkills((prev) => ({ ...prev, [skill]: true }))
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

  const simulatedVerticalLift = activeVertical
    ? activeVertical.bridgeDeltaSkills.reduce((acc, b) => {
        const key = `vert_${activeVertical.vertical}_${b.skill}`
        if (addedSkills[b.skill]) return acc + b.fitLiftPoints
        if (b.isSelfStudyBridgeable && simulatedSkills[key]) return acc + b.fitLiftPoints
        return acc
      }, 0)
    : 0

  const currentSimulatedVerticalScore = activeVertical
    ? Math.min(96, activeVertical.currentDirectFitEstimate + simulatedVerticalLift)
    : 0

  const highCount = analysis.topHorizonVerticals.filter((v) => v.feasibilityTier === 'high_fast_track').length
  const modCount = analysis.topHorizonVerticals.filter((v) => v.feasibilityTier === 'moderate_stepping_stone').length
  const lowCount = analysis.topHorizonVerticals.filter((v) => v.feasibilityTier === 'low_structural_barrier').length

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

      {/* Integrity Attestation Modal */}
      {attestSkillModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white border-2 border-slate-300 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-extrabold uppercase tracking-wider">
                  🛡️ Special Sauce Profile Integrity Check
                </span>
                <h3 className="mt-1 text-base sm:text-lg font-black text-slate-900">
                  Verify Capability: {attestSkillModal.skill}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAttestSkillModal(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-300 p-3 text-xs text-amber-950 space-y-1">
              <p className="font-extrabold">Why we ask before adding to your profile:</p>
              <p className="leading-relaxed">
                True Horizon™ is built on verified capability. Only add a skill to your live profile if you have genuinely executed it in prior work, completed the accredited certification or lab, or hold the required credential.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700">
              <span className="font-extrabold text-slate-900 block mb-0.5">
                Recommended Profile Framing:
              </span>
              {attestSkillModal.honestFraming}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  How did you acquire this capability?
                </label>
                <select
                  value={selectedAttestBasis}
                  onChange={(e) => setSelectedAttestBasis(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                >
                  <option value="prior_adjacent_work">
                    Executed in prior work under different industry terminology
                  </option>
                  <option value="completed_cert">
                    Completed accredited certification / official training module
                  </option>
                  <option value="hands_on_lab">
                    Built hands-on sandbox project / production workflow
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                    Defensible Proficiency
                  </label>
                  <select
                    value={selectedAttestLevel}
                    onChange={(e) => setSelectedAttestLevel(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                  >
                    <option value="Beginner">Beginner (Foundational / Certified)</option>
                    <option value="Intermediate">Intermediate (Applied Execution)</option>
                    <option value="Expert">Expert (Deep Production Mastery)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                    Hands-On Tenure (Years)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={selectedAttestYears}
                    onChange={(e) =>
                      setSelectedAttestYears(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAttestSkillModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-xs font-extrabold text-slate-700 cursor-pointer"
              >
                Cancel (Keep as Learning Goal)
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={confirmVerifiedSkillAddition}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer shadow-xs"
              >
                {isPending ? 'Updating Profile...' : '✓ Attest & Add to My Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HERO HEADER */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0f172a] text-white border-2 border-slate-800 p-6 sm:p-8 md:p-10 shadow-lg">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-sky-500/20 via-indigo-500/15 to-emerald-500/20 blur-3xl"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/40 text-sky-300 text-[11px] font-extrabold uppercase tracking-wider">
                🧭 True Horizon™ • 28-Industry Transferability Engine
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                True Capability Mapping • Verified Licensing &amp; Tenure Firewalls
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
              True Career Mobility Across All 28 Industries.
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              TrueFit™ and True Horizon™ give you clear, dependable compatibility data before you invest your time or tuition.{' '}
              <strong className="text-sky-300">True Horizon™</strong> evaluates your{' '}
              <strong className="text-white">6D Operational DNA</strong> across every sector on the platform—showing you where you can legitimately bridge in 2–4 weeks via self-paced certifications, where you need a stepping-stone role, and where hard licensing or physical trade barriers require a full career rebuild.
            </p>
          </div>

          <div className="shrink-0 rounded-2xl bg-slate-900/90 border-2 border-sky-500/40 p-5 text-center min-w-[240px] shadow-xl">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-sky-300">
              Top-5 Sector Mobility Index
            </p>
            <div className="mt-1 flex items-baseline justify-center gap-1">
              <span className="text-4xl sm:text-5xl font-black text-white">
                {analysis.overallTransferabilityIndex}%
              </span>
            </div>
            <p className="mt-1 text-[11px] font-bold text-emerald-400">
              {highCount} Fast-Track • {modCount} Stepping-Stone • {lowCount} Gated
            </p>
            <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between gap-2">
              <span>Current Primary:</span>
              <span
                className="font-bold text-slate-200 truncate max-w-[130px]"
                title={profileSummary.primaryIndustry}
              >
                {profileSummary.primaryIndustry.split(',')[0]}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: 6D Operational DNA Radar + Axis Breakdown */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
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
            <span className="font-bold text-slate-600">Want to refine your baseline skills?</span>
            <Link
              href="/dashboard/profile"
              className="font-extrabold text-indigo-600 hover:text-indigo-500"
            >
              Update Skills Matrix →
            </Link>
          </div>
        </div>

        <div className="lg:col-span-7 rounded-3xl bg-white border-2 border-slate-300 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-600">
              Universal Execution Primitives
            </span>
            <h2 className="mt-1 text-lg sm:text-xl font-black text-slate-900">
              How Employers Across Industries Read Your Capabilities
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              These 6 primitives measure your core operational maturity before vertical-specific licensing or domain keyword adjustments are applied.
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

      {/* SECTION 2: ALL 28 INDUSTRIES PAGINATED HORIZON EXPLORER */}
      <section className="rounded-3xl bg-white border-2 border-slate-300 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600">
              Stage 2 &amp; Stage 3 • Full 28-Industry Feasibility Explorer (Page {safeVerticalPage} of {totalVerticalPages})
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Explore All {analysis.topHorizonVerticals.length} Cross-Sector Industry Horizons
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Page through every industry from highest transferability (Page 1) to heavily licensed/physical trade sectors (Page {totalVerticalPages}), or jump directly to any sector you&apos;ve ever been curious about.
            </p>
          </div>

          {/* Jump-to-Industry Dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={activeVertical?.vertical || ''}
              onChange={(e) => handleJumpToVertical(e.target.value)}
              className="rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-800 cursor-pointer"
            >
              {analysis.topHorizonVerticals.map((v, idx) => (
                <option key={v.vertical} value={v.vertical}>
                  #{idx + 1}: {v.vertical} ({v.transferabilityScore}% DNA | {v.currentDirectFitEstimate}% Raw)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Feasibility Tier Filter Row + Pagination Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setVerticalTierFilter('all')
                setVerticalPage(1)
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-colors ${
                verticalTierFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              All Sectors ({analysis.topHorizonVerticals.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setVerticalTierFilter('high_fast_track')
                setVerticalPage(1)
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-colors ${
                verticalTierFilter === 'high_fast_track'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              🟢 Fast-Track Bridgeable ({highCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setVerticalTierFilter('moderate_stepping_stone')
                setVerticalPage(1)
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-colors ${
                verticalTierFilter === 'moderate_stepping_stone'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-50'
              }`}
            >
              🟡 Stepping-Stone Required ({modCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setVerticalTierFilter('low_structural_barrier')
                setVerticalPage(1)
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-colors ${
                verticalTierFilter === 'low_structural_barrier'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-rose-900 border border-rose-300 hover:bg-rose-50'
              }`}
            >
              🔴 Hard Licensure / Trade Barrier ({lowCount})
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              disabled={safeVerticalPage <= 1}
              onClick={() => {
                const nextP = Math.max(1, safeVerticalPage - 1)
                setVerticalPage(nextP)
                const firstOnPage = filteredVerticals[(nextP - 1) * VERTICALS_PER_PAGE]
                if (firstOnPage) setSelectedVerticalName(firstOnPage.vertical)
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 text-xs font-extrabold text-slate-800 cursor-pointer"
            >
              ← Prev 5
            </button>
            <span className="text-xs font-extrabold text-slate-700 px-1">
              Page {safeVerticalPage} of {totalVerticalPages}
            </span>
            <button
              type="button"
              disabled={safeVerticalPage >= totalVerticalPages}
              onClick={() => {
                const nextP = Math.min(totalVerticalPages, safeVerticalPage + 1)
                setVerticalPage(nextP)
                const firstOnPage = filteredVerticals[(nextP - 1) * VERTICALS_PER_PAGE]
                if (firstOnPage) setSelectedVerticalName(firstOnPage.vertical)
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 text-xs font-extrabold text-slate-800 cursor-pointer"
            >
              Next 5 →
            </button>
          </div>
        </div>

        {/* Paginated 5-Card Sector Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {pagedVerticals.map((vert) => {
            const globalRank =
              analysis.topHorizonVerticals.findIndex((v) => v.vertical === vert.vertical) + 1
            const active = activeVertical?.vertical === vert.vertical
            return (
              <button
                key={vert.vertical}
                type="button"
                onClick={() => setSelectedVerticalName(vert.vertical)}
                className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  active
                    ? 'bg-[#0f172a] text-white border-sky-400 shadow-md'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      active
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    Rank #{globalRank}
                  </span>
                  <span
                    className={`text-sm font-black ${
                      vert.feasibilityTier === 'high_fast_track'
                        ? active
                          ? 'text-emerald-400'
                          : 'text-emerald-700'
                        : vert.feasibilityTier === 'moderate_stepping_stone'
                        ? active
                          ? 'text-amber-300'
                          : 'text-amber-700'
                        : active
                        ? 'text-rose-400'
                        : 'text-rose-700'
                    }`}
                  >
                    {vert.transferabilityScore}% DNA
                  </span>
                </div>

                <p className="text-xs font-extrabold leading-snug line-clamp-2">
                  {vert.vertical}
                </p>

                <div className="space-y-1 pt-1 border-t border-slate-200/40">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className={active ? 'text-slate-400' : 'text-slate-500'}>
                      Raw Fit: {vert.currentDirectFitEstimate}%
                    </span>
                    <span className={active ? 'text-sky-300' : 'text-indigo-700'}>
                      Self-Study Max: {vert.shortTermSelfStudyCeiling}%
                    </span>
                  </div>
                  <p
                    className={`text-[10px] font-extrabold truncate ${
                      vert.feasibilityTier === 'high_fast_track'
                        ? active
                          ? 'text-emerald-300'
                          : 'text-emerald-700'
                        : vert.feasibilityTier === 'moderate_stepping_stone'
                        ? active
                          ? 'text-amber-300'
                          : 'text-amber-700'
                        : active
                        ? 'text-rose-300'
                        : 'text-rose-700'
                    }`}
                  >
                    {vert.feasibilityTier === 'high_fast_track'
                      ? '🟢 Fast-Track Bridgeable'
                      : vert.feasibilityTier === 'moderate_stepping_stone'
                      ? '🟡 Stepping-Stone Sector'
                      : '🔴 Hard License / Trade Wall'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Active Horizon Deep-Dive Card */}
        {activeVertical && (
          <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-5 sm:p-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-md border text-[11px] font-extrabold ${getFeasibilityPillStyles(
                      activeVertical.feasibilityTier
                    )}`}
                  >
                    {activeVertical.feasibilityLabel}
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

              {/* Honest 4-Stage Score Meter */}
              <div className="shrink-0 flex flex-wrap items-center gap-2.5 bg-white p-4 rounded-2xl border-2 border-slate-300 shadow-2xs">
                <div className="text-center px-2">
                  <span className="block text-[10px] font-extrabold uppercase text-slate-400">
                    Raw Keyword Fit
                  </span>
                  <span
                    className={`text-xl font-black ${
                      activeVertical.currentDirectFitEstimate < 25
                        ? 'text-rose-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {activeVertical.currentDirectFitEstimate}%
                  </span>
                </div>
                <span className="text-slate-400 font-black text-sm">→</span>
                <div className="text-center px-2">
                  <span className="block text-[10px] font-extrabold uppercase text-sky-600">
                    Operational DNA
                  </span>
                  <span className="text-xl font-black text-sky-700">
                    {activeVertical.transferabilityScore}%
                  </span>
                </div>
                <span className="text-slate-400 font-black text-sm">→</span>
                <div
                  className={`text-center px-3 py-1 rounded-xl border ${
                    currentSimulatedVerticalScore >= 60
                      ? 'bg-emerald-50 border-emerald-300'
                      : currentSimulatedVerticalScore >= 40
                      ? 'bg-amber-50 border-amber-300'
                      : 'bg-rose-50 border-rose-300'
                  }`}
                >
                  <span className="block text-[10px] font-extrabold uppercase text-slate-700">
                    Simulated Self-Study Fit
                  </span>
                  <span
                    className={`text-2xl font-black ${
                      currentSimulatedVerticalScore >= 60
                        ? 'text-emerald-700'
                        : currentSimulatedVerticalScore >= 40
                        ? 'text-amber-800'
                        : 'text-rose-700'
                    }`}
                  >
                    {currentSimulatedVerticalScore}%
                  </span>
                  <span className="block text-[9px] font-bold text-slate-500">
                    Self-Study Ceiling: {activeVertical.shortTermSelfStudyCeiling}%
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 5 cols: Terminology Translation Matrix & Target Archetypes */}
              <div className="lg:col-span-5 space-y-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    1. Accessible / Target Role Archetypes in This Sector
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
                    How your existing experience translates into {activeVertical.vertical.split(',')[0]} nomenclature:
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

              {/* Right 7 cols: Stage 3 — Interactive Bridge-Delta Simulator & How-To-Bridge Roadmaps */}
              <div className="lg:col-span-7 space-y-3">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    3. True Bridge-Delta Simulator &amp; &ldquo;How to Bridge&rdquo; Playbooks
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Only <strong>Self-Paced Certs &amp; Sandbox Labs</strong> can be checked to simulate short-term score lift. Skills marked <strong>🏥/🛑 Industry Exposure or License Required</strong> are locked from short-term self-study simulation so your projected score reflects true readiness:
                  </p>
                </div>

                <div className="space-y-3">
                  {activeVertical.bridgeDeltaSkills.map((b) => {
                    const simKey = `vert_${activeVertical.vertical}_${b.skill}`
                    const isAdded = Boolean(addedSkills[b.skill])
                    const isChecked = Boolean(
                      isAdded || (b.isSelfStudyBridgeable && simulatedSkills[simKey])
                    )
                    const isPlaybookOpen = expandedPlaybookKey === simKey

                    return (
                      <div
                        key={b.skill}
                        className={`rounded-2xl border-2 p-4 transition-all space-y-3 ${
                          isChecked
                            ? 'bg-emerald-50/60 border-emerald-400'
                            : !b.isSelfStudyBridgeable
                            ? 'bg-rose-50/30 border-rose-200'
                            : 'bg-white border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <label
                            className={`flex items-start gap-2.5 flex-1 ${
                              b.isSelfStudyBridgeable ? 'cursor-pointer' : 'cursor-not-allowed'
                            }`}
                          >
                            <input
                              type="checkbox"
                              disabled={!b.isSelfStudyBridgeable && !isAdded}
                              checked={isChecked}
                              onChange={() => {
                                if (b.isSelfStudyBridgeable) toggleSimulatedSkill(simKey)
                              }}
                              title={
                                b.isSelfStudyBridgeable
                                  ? 'Simulate completing this self-paced bridge'
                                  : 'Locked from short-term simulation: requires direct industry tenure or formal licensing'
                              }
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-40"
                            />
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs sm:text-sm font-black text-slate-900">
                                  {b.skill}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                    b.isSelfStudyBridgeable
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {b.isSelfStudyBridgeable
                                    ? `+${b.fitLiftPoints}% Self-Study Lift`
                                    : `+${b.fitLiftPoints}% (Requires Tenure/License)`}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold ${getModalityBadgeStyles(
                                    b.modality
                                  )}`}
                                >
                                  {b.modalityLabel}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 leading-snug">
                                {b.rationale}
                              </p>
                            </div>
                          </label>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedPlaybookKey(isPlaybookOpen ? null : simKey)
                              }
                              className={`px-3 py-1.5 rounded-xl border text-[11px] font-extrabold transition-colors cursor-pointer ${
                                isPlaybookOpen
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                              }`}
                            >
                              {isPlaybookOpen ? 'Hide Bridge Plan ▲' : '🗺️ How to Bridge ▼'}
                            </button>

                            <button
                              type="button"
                              disabled={isPending || isAdded}
                              onClick={() =>
                                openAttestationModal(
                                  b.skill,
                                  b.recommendedLevel,
                                  b.modality,
                                  b.honestProfileFraming
                                )
                              }
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-colors cursor-pointer ${
                                isAdded
                                  ? 'bg-emerald-600 text-white cursor-default'
                                  : 'bg-slate-900 hover:bg-indigo-600 text-white'
                              }`}
                            >
                              {isAdded ? '✓ In Profile' : 'Verify & Add'}
                            </button>
                          </div>
                        </div>

                        {/* Expandable "HOW TO BRIDGE" Action Plan Drawer */}
                        {isPlaybookOpen && (
                          <div className="rounded-xl bg-slate-900 text-slate-100 p-4 space-y-3 border border-slate-700 text-xs animate-in fade-in duration-150">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                              <span className="font-black text-sky-300 uppercase tracking-wider text-[10px]">
                                Bridge Acquisition Roadmap • Target Level: {b.recommendedLevel}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-emerald-300 font-bold text-[11px]">
                                ⏱ Est. Bridge Time: {b.estimatedTimeToBridge}
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              <p className="text-[11px] font-extrabold text-white uppercase tracking-wider">
                                True Readiness Path &amp; Action Steps:
                              </p>
                              <ul className="space-y-1.5 pl-4 list-disc text-slate-300 leading-relaxed">
                                {b.actionableSteps.map((step, sIdx) => (
                                  <li key={sIdx}>{step}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-1">
                              <p className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider">
                                Official Certifications, Standards or Learning Catalogs:
                              </p>
                              <div className="flex flex-wrap gap-2 pt-1">
                                {b.recommendedCredentialsOrResources.map((cred, cIdx) => {
                                  const links = resolveLearningResourceLinks(cred, b.skill)
                                  const primaryLink = links[0]
                                  return (
                                    <a
                                      key={cIdx}
                                      href={primaryLink.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 border border-slate-600 hover:border-indigo-400 text-slate-100 hover:text-white text-[11px] font-extrabold transition-all shadow-2xs group"
                                      title={`Open official learning resource (${primaryLink.provider}) in a new tab`}
                                    >
                                      <span>📘 {cred}</span>
                                      <span className="text-sky-300 group-hover:text-white text-xs font-black">
                                        ↗
                                      </span>
                                    </a>
                                  )
                                })}
                              </div>
                            </div>

                            <div className="rounded-lg bg-emerald-950/60 border border-emerald-500/30 p-2.5 text-[11px] text-emerald-200">
                              <strong className="text-emerald-300">Recommended Profile Framing: </strong>
                              {b.honestProfileFraming}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 3: PAGINATED LIVE BOARD "HORIZON BRIDGE" OPPORTUNITIES (ALL ROLES) */}
      <section className="rounded-3xl bg-white border-2 border-slate-300 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">
              True Horizon™ Live Role Mapping • Showing {filteredJobBridges.length} Active Roles (Page {safeJobPage} of {totalJobPages})
            </span>
            <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-900">
              All Live Roles Ranked by True Operational &amp; Self-Study Feasibility
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Page through every live role on the board. Roles where short-term self-study still leaves you below the <strong>40% TrueFit™ Firewall</strong> are clearly flagged so you never waste time or money.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={jobIndustryFilter}
              onChange={(e) => {
                setJobIndustryFilter(e.target.value)
                setJobPage(1)
              }}
              className="rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-800 cursor-pointer"
            >
              <option value="all">All Role Industries ({analysis.liveJobBridges.length})</option>
              {availableJobIndustries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>

            <Link
              href="/dashboard/jobs"
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-extrabold transition-colors"
            >
              Open Full Role Feed →
            </Link>
          </div>
        </div>

        {/* Live Role Filter & Pagination Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setJobFeasibilityFilter('all')
                setJobPage(1)
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                jobFeasibilityFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              All Roles ({analysis.liveJobBridges.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setJobFeasibilityFilter('high_fast_track')
                setJobPage(1)
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                jobFeasibilityFilter === 'high_fast_track'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              🟢 Self-Study Bridgeable
            </button>
            <button
              type="button"
              onClick={() => {
                setJobFeasibilityFilter('moderate_stepping_stone')
                setJobPage(1)
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                jobFeasibilityFilter === 'moderate_stepping_stone'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-50'
              }`}
            >
              🟡 Partial Bridge / Has Tenure Gate
            </button>
            <button
              type="button"
              onClick={() => {
                setJobFeasibilityFilter('low_structural_barrier')
                setJobPage(1)
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                jobFeasibilityFilter === 'low_structural_barrier'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-rose-900 border border-rose-300 hover:bg-rose-50'
              }`}
            >
              🛑 Below 40% Firewall (Tenure/License Required)
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              disabled={safeJobPage <= 1}
              onClick={() => setJobPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 text-xs font-extrabold text-slate-800 cursor-pointer"
            >
              ← Prev Page
            </button>
            <span className="text-xs font-extrabold text-slate-700 px-1">
              Page {safeJobPage} of {totalJobPages}
            </span>
            <button
              type="button"
              disabled={safeJobPage >= totalJobPages}
              onClick={() => setJobPage((p) => Math.min(totalJobPages, p + 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 text-xs font-extrabold text-slate-800 cursor-pointer"
            >
              Next Page →
            </button>
          </div>
        </div>

        {pagedJobBridges.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-8 text-center space-y-2">
            <p className="text-sm font-bold text-slate-800">
              No live roles match your current feasibility filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setJobFeasibilityFilter('all')
                setJobIndustryFilter('all')
                setJobPage(1)
              }}
              className="inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-extrabold cursor-pointer"
            >
              Reset Role Filters →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pagedJobBridges.map((bridge) => (
              <div
                key={bridge.jobId}
                className="rounded-2xl border-2 border-slate-300 bg-slate-50/60 p-5 flex flex-col justify-between gap-4 hover:border-slate-400 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-extrabold">
                          {bridge.industry}
                        </span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-extrabold ${getFeasibilityPillStyles(
                            bridge.feasibilityTier
                          )}`}
                        >
                          {bridge.feasibilityBadge}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 leading-snug pt-0.5">
                        {bridge.title}
                      </h3>
                      <p className="text-xs font-bold text-slate-500">
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
                      <span
                        className={`block text-[10px] font-extrabold ${
                          bridge.shortTermSelfStudyCeiling >= 40
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}
                      >
                        Self-Study Max: {bridge.shortTermSelfStudyCeiling}%
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                    {bridge.whyOperationalDnaFits}
                  </p>

                  {bridge.bridgeDeltaSkills.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                        Missing Role Requirements ({bridge.matchedCoreSkills.length}/{bridge.totalRequiredSkills} Core Skills Currently Matched):
                      </span>
                      <div className="space-y-2">
                        {bridge.bridgeDeltaSkills.map((bs) => {
                          const isAdded = Boolean(addedSkills[bs.skill])
                          return (
                            <div
                              key={bs.skill}
                              className={`rounded-xl border p-3 text-xs space-y-1.5 ${
                                bs.isSelfStudyBridgeable
                                  ? 'bg-white border-slate-200'
                                  : 'bg-rose-50/40 border-rose-200'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-black text-slate-900">{bs.skill}</span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                                      bs.isSelfStudyBridgeable
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {bs.isSelfStudyBridgeable
                                      ? `+${bs.fitLiftPoints}% Self-Study`
                                      : `+${bs.fitLiftPoints}% (Tenure Gate)`}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded border text-[10px] font-extrabold ${getModalityBadgeStyles(
                                      bs.modality
                                    )}`}
                                  >
                                    {bs.modalityLabel}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  disabled={isPending || isAdded}
                                  onClick={() =>
                                    openAttestationModal(
                                      bs.skill,
                                      (bs.requiredLevel as any) || 'Intermediate',
                                      bs.modality,
                                      bs.howToBridgeSummary
                                    )
                                  }
                                  className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer ${
                                    isAdded
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-900 hover:bg-indigo-600 text-white'
                                  }`}
                                >
                                  {isAdded ? '✓ Verified' : 'Verify & Add'}
                                </button>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-snug">
                                <strong>True Bridge Path:</strong> {bs.howToBridgeSummary}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                {resolveLearningResourceLinks(bs.recommendedResource, bs.skill).map((lnk, lIdx) => (
                                  <a
                                    key={lIdx}
                                    href={lnk.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-800 hover:text-white border border-indigo-200 hover:border-indigo-500 text-[10px] font-extrabold transition-colors"
                                  >
                                    <span>📘 {lnk.isOfficialAuthority ? lnk.label : `${lnk.provider}: ${bs.skill}`}</span>
                                    <span>↗</span>
                                  </a>
                                ))}
                                <span className="text-[10px] font-bold text-slate-500">
                                  • ⏱ {bs.estimatedTimeToBridge}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-500">
                    Raw Fit: <strong>{bridge.currentTrueFitScore}%</strong> → Self-Study Max:{' '}
                    <strong
                      className={
                        bridge.shortTermSelfStudyCeiling >= 40
                          ? 'text-emerald-700'
                          : 'text-rose-600'
                      }
                    >
                      {bridge.shortTermSelfStudyCeiling}%
                    </strong>{' '}
                    (With Tenure: {bridge.projectedBridgedTrueFitScore}%)
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

        {/* Bottom Pagination Controls for Live Roles */}
        {totalJobPages > 1 && (
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              Showing page {safeJobPage} of {totalJobPages} ({filteredJobBridges.length} roles evaluated)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safeJobPage <= 1}
                onClick={() => setJobPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 text-xs font-extrabold text-slate-800 cursor-pointer"
              >
                ← Previous Page
              </button>
              <button
                type="button"
                disabled={safeJobPage >= totalJobPages}
                onClick={() => setJobPage((p) => Math.min(totalJobPages, p + 1))}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 text-xs font-extrabold text-slate-800 cursor-pointer"
              >
                Next Page →
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
