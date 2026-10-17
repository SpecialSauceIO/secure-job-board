'use client'

import { useState } from 'react'
import {
  GamificationSummary,
  MetalTierConfig,
} from '@/constants/gamification'

export function RankAndFounderPill({
  level,
  tier,
  isFounder = true,
  founderText = 'Founding Member',
  size = 'sm',
}: {
  level: number
  tier: MetalTierConfig
  isFounder?: boolean
  founderText?: string
  size?: 'xs' | 'sm'
}) {
  const paddingClass =
    size === 'xs' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-[11px]'

  const shortTierName = tier.name.replace(' Tier', '')

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-extrabold border ${paddingClass} ${
        isFounder
          ? 'bg-amber-50/90 text-slate-900 border-amber-400 shadow-2xs'
          : 'bg-slate-100 text-slate-800 border-slate-300'
      }`}
      title={
        isFounder
          ? `${tier.name} (Level ${level}) • ${founderText} (1.25x XP Boost Active)`
          : `${tier.name} (Profile Level ${level})`
      }
    >
      <span>{tier.icon}</span>
      <span>
        LVL {level} {shortTierName}
      </span>
      {isFounder && (
        <>
          <span className="text-amber-400 font-normal">•</span>
          <span className="text-amber-800 inline-flex items-center gap-0.5">
            <span className="text-amber-600">★</span>
            {founderText}
          </span>
        </>
      )}
    </span>
  )
}

export default function ReputationBadgeCase({
  summary,
}: {
  summary: GamificationSummary
}) {
  const [showChallenges, setShowChallenges] = useState(false)

  const unlockedCount = summary.badges.filter((b) => b.unlocked).length
  const completedChallenges = summary.seasonalChallenges.filter(
    (c) => c.completed
  ).length

  return (
    <div className="bg-white rounded-2xl border-2 border-amber-500 shadow-sm ring-1 ring-amber-400/50 overflow-hidden">
      {/* Top Dark Prestige Bar: Level, Metal Rank, XP Bar, and Founder Multiplier */}
      <div className="bg-slate-900 text-white p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-amber-300 uppercase tracking-wider">
              <span>★ {summary.founderLabel} (1.25x XP Boost Active)</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-200">
                {summary.tier.icon} {summary.tier.name}
              </span>
            </div>

            <div className="flex items-baseline gap-3 pt-1">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Profile Level {summary.level}
              </h2>
              <span className="text-xs sm:text-sm font-extrabold text-amber-300 font-mono">
                {summary.totalXp.toLocaleString()} Total XP
              </span>
            </div>
          </div>

          {/* Right Side: XP Progress Bar to Next Level + Toggle Launch Challenges */}
          <div className="w-full lg:w-96 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">
                Progress to{' '}
                <strong className="text-white">
                  Level {summary.level + 1}
                </strong>
              </span>
              <span className="text-amber-300 font-mono">
                {summary.currentLevelXp} / {summary.nextLevelXp} XP (
                {summary.levelProgressPct}%)
              </span>
            </div>

            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700 p-0.5">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${summary.tier.barGradient} transition-all duration-500`}
                style={{ width: `${summary.levelProgressPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400 font-medium">
                {summary.nextTier
                  ? `Next Rank: ${summary.nextTier.icon} ${summary.nextTier.name} (${summary.nextTier.minXp.toLocaleString()} XP)`
                  : '👑 Maximum Metal Rank Achieved (Apex)'}
              </span>

              <button
                type="button"
                onClick={() => setShowChallenges((prev) => !prev)}
                className="text-xs font-extrabold text-indigo-300 hover:text-white underline cursor-pointer"
              >
                {showChallenges
                  ? 'Hide Launch Challenges'
                  : `Launch Challenges (${completedChallenges}/${summary.seasonalChallenges.length}) →`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Earned Integrity & Merit Badges Grid */}
      <div className="p-5 sm:p-6 space-y-5 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                🏆 Professional Integrity &amp; Merit Badges
              </h3>
              <span className="text-xs font-bold text-slate-500">
                ({unlockedCount} of {summary.badges.length} Unlocked)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified credentials and responsiveness milestones reflected on your profile.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {summary.badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                badge.unlocked
                  ? 'bg-white border-slate-200 shadow-2xs'
                  : 'bg-slate-50/60 border-slate-200/70 text-slate-400 opacity-70'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold shrink-0 border ${
                  badge.unlocked
                    ? 'bg-slate-50 border-slate-200 text-slate-900'
                    : 'bg-slate-100 border-slate-200 grayscale'
                }`}
              >
                {badge.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4
                    className={`text-xs font-extrabold truncate ${
                      badge.unlocked ? 'text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    {badge.title}
                  </h4>
                  {badge.unlocked && (
                    <span className="text-[10px] font-extrabold text-emerald-700 shrink-0">
                      ✓ Earned
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-snug mt-1 text-slate-600">
                  {badge.description}
                </p>
                {badge.progressText && (
                  <span
                    className={`inline-block mt-1.5 text-[10px] font-bold ${
                      badge.unlocked ? 'text-indigo-700' : 'text-slate-500'
                    }`}
                  >
                    {badge.progressText}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Expandable Founding Launch Challenge Board */}
        {showChallenges && (
          <div className="pt-4 border-t border-slate-200/80 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">
                ⚡ Founding Member Launch Challenges
              </h4>
              <span className="text-[11px] font-bold text-slate-500">
                Complete challenges through real platform activity to level up
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {summary.seasonalChallenges.map((ch) => {
                const pct = Math.min(
                  100,
                  Math.round((ch.current / ch.target) * 100)
                )
                return (
                  <div
                    key={ch.id}
                    className={`p-4 rounded-xl border ${
                      ch.completed
                        ? 'bg-emerald-50/40 border-emerald-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-extrabold text-slate-900">
                        {ch.title}
                      </span>
                      <span className="text-[11px] font-black text-indigo-700 shrink-0">
                        +{ch.xpReward} XP
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                      {ch.description}
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-extrabold">
                        <span
                          className={
                            ch.completed ? 'text-emerald-700' : 'text-slate-500'
                          }
                        >
                          {ch.completed
                            ? '✓ Challenge Completed!'
                            : `Progress: ${ch.current} / ${ch.target}`}
                        </span>
                        <span className="text-slate-700">{pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full ${
                            ch.completed ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}