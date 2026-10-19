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
      className={`inline-flex items-center gap-1.5 rounded-lg font-extrabold border ${paddingClass} ${
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
  const [isExpanded, setIsExpanded] = useState(false)
  const [showChallenges, setShowChallenges] = useState(false)

  const unlockedCount = summary.badges.filter((b) => b.unlocked).length
  const completedChallenges = summary.seasonalChallenges.filter(
    (c) => c.completed
  ).length

  return (
    <div className="bg-white rounded-2xl border border-amber-400/80 shadow-xs overflow-hidden">
      {/* Compact Single-Row Summary Bar (Always Visible) */}
      <div className="bg-slate-900 text-white px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-2.5 py-1 rounded-lg bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-black">
            {summary.tier.icon} Level {summary.level} • {summary.tier.name}
          </span>
          <span className="text-xs font-extrabold text-amber-300 font-mono">
            {summary.totalXp.toLocaleString()} XP
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="text-xs font-bold text-slate-300">
            🏆 {unlockedCount} of {summary.badges.length} Merit Badges Earned
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Slim Progress Pill */}
          <div className="flex items-center gap-2.5">
            <div className="w-28 sm:w-36 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${summary.tier.barGradient}`}
                style={{ width: `${summary.levelProgressPct}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-slate-300">
              {summary.levelProgressPct}% to LVL {summary.level + 1}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-extrabold transition-colors cursor-pointer"
          >
            {isExpanded
              ? 'Hide Badges & Challenges ▴'
              : `View Badges (${unlockedCount}/${summary.badges.length}) ▾`}
          </button>
        </div>
      </div>

      {/* Collapsible Drawer: Badges + Challenges */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-5 bg-white border-t border-slate-200 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                🏆 Professional Integrity &amp; Merit Badges ({unlockedCount} of{' '}
                {summary.badges.length} Unlocked)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified credentials and responsiveness milestones reflected on your profile.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowChallenges((prev) => !prev)}
              className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 underline cursor-pointer self-start sm:self-auto"
            >
              {showChallenges
                ? 'Hide Launch Challenges'
                : `Launch Challenges (${completedChallenges}/${summary.seasonalChallenges.length}) →`}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {summary.badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                  badge.unlocked
                    ? 'bg-amber-50/30 border-amber-200/80 shadow-2xs'
                    : 'bg-slate-50/60 border-slate-200/70 text-slate-400 opacity-70'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold shrink-0 border ${
                    badge.unlocked
                      ? 'bg-white border-amber-200 text-slate-900'
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
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] leading-snug mt-1 text-slate-600">
                    {badge.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {showChallenges && (
            <div className="pt-4 border-t border-slate-200/80 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">
                ⚡ Founding Member Launch Challenges
              </h4>
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
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full ${
                            ch.completed ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
