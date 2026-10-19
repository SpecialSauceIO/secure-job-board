'use client'

import { useState } from 'react'
import {
  GamificationSummary,
  MetalTierConfig,
} from '@/constants/gamification'

export function RankAndFounderPill({
  isFounder = true,
  founderText = 'Founding Member',
  size = 'sm',
}: {
  level?: number
  tier?: MetalTierConfig
  isFounder?: boolean
  founderText?: string
  size?: 'xs' | 'sm'
}) {
  if (!isFounder) return null

  const paddingClass =
    size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'

  return (
    <span
      className={`inline-flex items-center rounded-md font-bold border ${paddingClass} bg-slate-100 text-slate-900 border-slate-300 shadow-2xs`}
    >
      {founderText}
    </span>
  )
}

export default function ReputationBadgeCase({
  summary,
}: {
  summary: GamificationSummary
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const unlockedBadges = summary.badges.filter((b) => b.unlocked)
  const unlockedCount = unlockedBadges.length

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-xs overflow-hidden">
      {/* Minimalist Single-Row Earned Behavioral Signals Bar */}
      <div className="px-6 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mr-1">
            Earned Signals
          </span>

          {unlockedBadges.map((badge) => (
            <span
              key={badge.id}
              title={badge.description}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100/90 border border-slate-300 text-xs font-bold text-slate-900 shadow-2xs"
            >
              <span className="text-emerald-700 font-black">✓</span>
              <span>{badge.title}</span>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-600 font-bold">
            {unlockedCount} of {summary.badges.length} Active
          </span>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border-2 border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            <span>{isExpanded ? 'Hide Details' : 'Signal Criteria'}</span>
            <svg
              className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.25"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Collapsible Behavioral Signal Criteria Drawer */}
      {isExpanded && (
        <div className="px-6 py-5 bg-slate-50/70 border-t-2 border-slate-200 space-y-3.5 animate-in fade-in duration-150">
          <p className="text-xs font-medium text-slate-600">
            Behavioral signals are earned automatically through verified account setup, responsiveness, and platform activity.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {summary.badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  badge.unlocked
                    ? 'bg-white border-slate-300 shadow-2xs'
                    : 'bg-slate-50/80 border-slate-200 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4
                    className={`text-xs font-bold truncate ${
                      badge.unlocked ? 'text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    {badge.title}
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      badge.unlocked
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    {badge.unlocked ? '✓ Active' : 'Pending'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed mt-1.5 text-slate-600">
                  {badge.description}
                </p>
                {!badge.unlocked && badge.progressText && (
                  <p className="text-[10px] font-bold text-slate-700 mt-2">
                    To unlock: {badge.progressText}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
