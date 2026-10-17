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
    size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5">
      {/* Olympic / Competitive Metal Rank & Level Pill */}
      <span
        className={`inline-flex items-center gap-1 rounded-full font-extrabold border shadow-2xs ${paddingClass} ${tier.badgeBg} ${tier.badgeText} ${tier.badgeBorder}`}
        title={`${tier.name} • Profile Level ${level}`}
      >
        <span>{tier.icon}</span>
        <span>
          LVL {level} • {tier.name.replace(' Tier', '')}
        </span>
      </span>

      {/* Season 0 Founding Charter Emblem */}
      {isFounder && (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-extrabold bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 text-amber-900 border border-amber-300 shadow-2xs ${paddingClass}`}
          title="Season 0 Founding Cohort — Permanent Charter Status & 1.25x XP Multiplier"
        >
          <span className="text-amber-600">★</span>
          <span>{founderText}</span>
        </span>
      )}
    </div>
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
    <div className="bg-white rounded-2xl border-2 border-amber-300/80 shadow-sm overflow-hidden">
      {/* Top Dark Prestige Bar: Level, Metal Rank, XP Bar, and Season 0 Multiplier */}
      <div className="bg-slate-900 text-white p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
                ★ {summary.founderLabel} (1.25x XP Boost Active)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-white text-xs font-extrabold">
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

          {/* Right Side: XP Progress Bar to Next Level + Toggle Season 0 Challenges */}
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
                  ? 'Hide Season 0 Challenges'
                  : `Season 0 Challenges (${completedChallenges}/${summary.seasonalChallenges.length}) →`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Earned Integrity & Tenacity Trophy Case */}
      <div className="p-5 sm:p-6 space-y-5 bg-gradient-to-b from-amber-50/30 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span>🏆 Professional Integrity &amp; Merit Badges</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-extrabold">
                {unlockedCount} / {summary.badges.length} Unlocked
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Displayed on your anonymous cards to prove responsiveness, verified credentials, and platform tenure.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {summary.badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                badge.unlocked
                  ? `${badge.accentClass} shadow-2xs`
                  : 'bg-slate-50/70 border-slate-200 text-slate-400 opacity-75'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold shrink-0 border ${
                  badge.unlocked
                    ? 'bg-white border-current/20 shadow-2xs'
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
                    <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/80 text-emerald-700 border border-emerald-200 shrink-0">
                      ✓ Earned
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-snug mt-1 text-slate-600">
                  {badge.description}
                </p>
                {badge.progressText && (
                  <span
                    className={`inline-block mt-1.5 text-[10px] font-extrabold ${
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

        {/* Expandable Season 0 Challenge Board */}
        {showChallenges && (
          <div className="pt-4 border-t border-slate-200/80 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">
                ⚡ Active Season 0: Founding Era Challenges (90-Day Launch Window)
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
                        ? 'bg-emerald-50/60 border-emerald-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-extrabold text-slate-900">
                        {ch.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-black shrink-0">
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