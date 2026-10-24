"use client"

import { useState } from "react"
import {
  GamificationSummary,
  MetalTierConfig,
} from "@/constants/gamification"

const PASTEL_SIGNAL_PALETTES = [
  {
    pill: "bg-emerald-100/90 border-emerald-300 text-emerald-950",
    icon: "text-emerald-700 font-black",
    card: "bg-emerald-50/70 border-emerald-300 shadow-2xs",
    tag: "bg-emerald-200/80 text-emerald-950 border-emerald-400",
  },
  {
    pill: "bg-sky-100/90 border-sky-300 text-sky-950",
    icon: "text-sky-700 font-black",
    card: "bg-sky-50/70 border-sky-300 shadow-2xs",
    tag: "bg-sky-200/80 text-sky-950 border-sky-400",
  },
  {
    pill: "bg-violet-100/90 border-violet-300 text-violet-950",
    icon: "text-violet-700 font-black",
    card: "bg-violet-50/70 border-violet-300 shadow-2xs",
    tag: "bg-violet-200/80 text-violet-950 border-violet-400",
  },
  {
    pill: "bg-rose-100/90 border-rose-300 text-rose-950",
    icon: "text-rose-700 font-black",
    card: "bg-rose-50/70 border-rose-300 shadow-2xs",
    tag: "bg-rose-200/80 text-rose-950 border-rose-400",
  },
  {
    pill: "bg-teal-100/90 border-teal-300 text-teal-950",
    icon: "text-teal-700 font-black",
    card: "bg-teal-50/70 border-teal-300 shadow-2xs",
    tag: "bg-teal-200/80 text-teal-950 border-teal-400",
  },
  {
    pill: "bg-fuchsia-100/90 border-fuchsia-300 text-fuchsia-950",
    icon: "text-fuchsia-700 font-black",
    card: "bg-fuchsia-50/70 border-fuchsia-300 shadow-2xs",
    tag: "bg-fuchsia-200/80 text-fuchsia-950 border-fuchsia-400",
  },
]

function getSignalPalette(badgeId: string, idx: number) {
  let hash = idx
  for (let i = 0; i < badgeId.length; i++) {
    hash = (hash * 31 + badgeId.charCodeAt(i)) % PASTEL_SIGNAL_PALETTES.length
  }
  return PASTEL_SIGNAL_PALETTES[Math.abs(hash) % PASTEL_SIGNAL_PALETTES.length]
}

export function RankAndFounderPill({
  isFounder = true,
  founderText = "Founding Member",
  size = "sm",
}: {
  level?: number
  tier?: MetalTierConfig
  isFounder?: boolean
  founderText?: string
  size?: "xs" | "sm"
}) {
  if (!isFounder) return null

  const paddingClass =
    size === "xs" ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1 text-[11px]"

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-extrabold border-2 ${paddingClass} bg-gradient-to-r founder-gold-pill from-amber-300 via-yellow-200 to-amber-300 text-amber-950 border-amber-500 shadow-xs`}
    >
      <span className="text-amber-800 drop-shadow-2xs">★</span>
      <span>{founderText}</span>
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

  const isFounderBadge = (id: string) =>
    id === "founder_season_0" || id === "founder_partner"

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-xs overflow-hidden">
      {/* Minimalist Single-Row Earned Behavioral Signals Bar */}
      <div className="px-6 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mr-1">
            Earned Distinctions
          </span>

          {unlockedBadges.map((badge, idx) => {
            const isFounder = isFounderBadge(badge.id)
            const palette = getSignalPalette(badge.id, idx)
            return (
              <span
                key={badge.id}
                title={badge.description}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold shadow-2xs ${
                  isFounder
                    ? "bg-gradient-to-r founder-gold-pill from-amber-300 via-yellow-200 to-amber-300 border-2 border-amber-500 text-amber-950"
                    : `border ${palette.pill}`
                }`}
              >
                <span
                  className={
                    isFounder
                      ? "text-amber-800 font-black"
                      : palette.icon
                  }
                >
                  {isFounder ? "★" : "✓"}
                </span>
                <span>{badge.title}</span>
              </span>
            )
          })}
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
            <span>{isExpanded ? "Hide Details" : "Distinction Criteria"}</span>
            <svg
              className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
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

      {/* Collapsible Behavioral Distinction Criteria Drawer */}
      {isExpanded && (
        <div className="px-6 py-5 bg-slate-50/70 border-t-2 border-slate-200 space-y-3.5 animate-in fade-in duration-150">
          <p className="text-xs font-medium text-slate-600">
            Profile distinctions are earned automatically through verified account setup, timely responsiveness, and milestone activity.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {summary.badges.map((badge, idx) => {
              const isFounder = isFounderBadge(badge.id)
              const palette = getSignalPalette(badge.id, idx)
              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    badge.unlocked
                      ? isFounder
                        ? "bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-200/80 border-amber-400 shadow-xs"
                        : palette.card
                      : "bg-slate-50/80 border-slate-200 opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`text-xs font-extrabold truncate ${
                        badge.unlocked
                          ? isFounder
                            ? "text-amber-950"
                            : "text-slate-900"
                          : "text-slate-600"
                      }`}
                    >
                      {isFounder && badge.unlocked ? `★ ${badge.title}` : badge.title}
                    </h4>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                        badge.unlocked
                          ? isFounder
                            ? "bg-amber-300/90 text-amber-950 border-amber-500"
                            : palette.tag
                          : "bg-white text-slate-600 border-slate-300"
                      }`}
                    >
                      {badge.unlocked ? (isFounder ? "★ Charter" : "✓ Active") : "Pending"}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed mt-1.5 text-slate-700">
                    {badge.description}
                  </p>
                  {!badge.unlocked && badge.progressText && (
                    <p className="text-[10px] font-bold text-slate-700 mt-2">
                      To unlock: {badge.progressText}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
