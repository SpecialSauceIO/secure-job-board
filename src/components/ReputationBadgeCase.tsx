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

  const shortTierName = tier.name.replace(' Tier', '')

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-semibold border ${paddingClass} bg-slate-100 text-slate-700 border-slate-200`}
      title={
        isFounder
          ? `${tier.name} (Level ${level}) · ${founderText}`
          : `${tier.name} (Level ${level})`
      }
    >
      <span className="font-bold text-slate-900">
        LVL {level} {shortTierName}
      </span>
      {isFounder && (
        <>
          <span className="text-slate-300">·</span>
          <span className="text-slate-600">{founderText}</span>
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
  const [showMilestones, setShowMilestones] = useState(false)

  const unlockedCount = summary.badges.filter((b) => b.unlocked).length
  const completedChallenges = summary.seasonalChallenges.filter(
    (c) => c.completed
  ).length
  const shortTierName = summary.tier.name.replace(' Tier', '')

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Understated Single-Row Standing Bar */}
      <div className="px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Standing
          </span>
          <span className="font-extrabold text-slate-900">
            Level {summary.level} {shortTierName}
          </span>
          <span className="text-slate-300">·</span>
          <span className="font-mono text-slate-600">
            {summary.totalXp.toLocaleString()} pts
          </span>
          {summary.isFounder && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-slate-600 font-medium">
                {summary.founderLabel}
              </span>
            </>
          )}
          <span className="text-slate-300">·</span>
          <span className="text-slate-600 font-medium">
            {unlockedCount} of {summary.badges.length} Credentials Active
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Minimalist Progress Line */}
          <div className="flex items-center gap-2.5">
            <div className="w-28 sm:w-36 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-slate-800 transition-all duration-500"
                style={{ width: `${summary.levelProgressPct}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {summary.levelProgressPct}% to LVL {summary.level + 1}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>
              {isExpanded
                ? 'Hide Credentials'
                : `Credentials (${unlockedCount}/${summary.badges.length})`}
            </span>
            <svg
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Collapsible Credentials & Milestones Drawer */}
      {isExpanded && (
        <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-200 space-y-5 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Verified Platform Credentials
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowMilestones((prev) => !prev)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer self-start sm:self-auto"
            >
              {showMilestones
                ? 'Hide Activity Milestones'
                : `Activity Milestones (${completedChallenges}/${summary.seasonalChallenges.length})`}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {summary.badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 rounded-xl border transition-all ${
                  badge.unlocked
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-50 border-slate-200/60 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4
                    className={`text-xs font-bold truncate ${
                      badge.unlocked ? 'text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    {badge.title}
                  </h4>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      badge.unlocked
                        ? 'bg-slate-100 text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {badge.unlocked ? 'Verified' : 'Locked'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed mt-1.5 text-slate-500">
                  {badge.description}
                </p>
              </div>
            ))}
          </div>

          {showMilestones && (
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Platform Activity Milestones
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
                      className="p-4 rounded-xl border border-slate-200 bg-white space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {ch.title}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 shrink-0">
                          {ch.current}/{ch.target}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {ch.description}
                      </p>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-slate-800"
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
