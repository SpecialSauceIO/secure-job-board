'use client'

import React, { useState, useEffect } from 'react'

/**
 * CANDIDATE VIGNETTE:
 * Auto-loops every 4 seconds between:
 * Phase 0: 88% 5-Point AI Fit Radar Verified (Stage 1 Anonymous #SS-8492)
 * Phase 1: Stage 2 Privacy Vault Released (Alex Mercer Resume & Contact Unlocked)
 */
export function CandidateVisualVignette() {
  const [phase, setPhase] = useState<0 | 1>(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase((prev) => (prev === 0 ? 1 : 0))
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const isStage2 = phase === 1

  return (
    <div className="mt-10 max-w-3xl mx-auto select-none pointer-events-none">
      <div className="rounded-2xl bg-[#0f172a] text-white border-2 border-slate-800 shadow-xl overflow-hidden">
        {/* Subtle Auto-Play Progress Header */}
        <div className="px-5 py-3 bg-slate-950/90 border-b border-slate-800/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
              Live Candidate Preview • {isStage2 ? 'Step 2: Stage 2 Vault Released' : 'Step 1: 5-Point AI Fit & Stage 1 Privacy'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`h-1.5 rounded-full transition-all duration-500 ${
                !isStage2 ? 'w-6 bg-emerald-400' : 'w-2 bg-slate-700'
              }`}
            />
            <span
              className={`h-1.5 rounded-full transition-all duration-500 ${
                isStage2 ? 'w-6 bg-sky-400' : 'w-2 bg-slate-700'
              }`}
            />
          </div>
        </div>

        {/* Compact Single-Card Body */}
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Left: 5-Point Fit Radar Summary */}
          <div className="md:col-span-6 space-y-3.5 md:border-r md:border-slate-800 md:pr-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Senior Cloud Architect • Remote US
                </div>
                <div className="text-sm font-extrabold text-emerald-400 mt-0.5">
                  $145,000 – $165,000 / yr
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-right">
                <div className="text-lg font-black text-emerald-300 leading-none">88% Fit</div>
                <div className="text-[9px] font-extrabold uppercase text-emerald-400 mt-0.5">
                  ✓ ≥40% Gate
                </div>
              </div>
            </div>

            {/* Compact 5 Bars */}
            <div className="space-y-2 pt-1">
              {[
                { label: 'Core Skills (AWS, K8s, IAM)', score: 92 },
                { label: 'Role Seniority (8+ Yrs)', score: 86 },
                { label: 'Certifications Verified', score: 100 },
                { label: 'Language Fluency (C2)', score: 100 },
                { label: 'Pay & Location Alignment', score: 84 },
              ].map((bar) => (
                <div key={bar.label} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-300 font-semibold">{bar.label}</span>
                    <span className="text-emerald-400 font-extrabold">{bar.score}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      style={{ width: `${bar.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Animated Stage 1 -> Stage 2 Privacy Vault */}
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border transition-colors duration-500 ${
                  !isStage2
                    ? 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                    : 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                }`}
              >
                {!isStage2 ? '🔒 Stage 1: Identity Hidden' : '🔓 Stage 2: Released by Candidate'}
              </span>
              <span className="text-[10px] font-extrabold text-amber-300">
                ★ Founding Member
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 transition-all duration-500">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Candidate:</span>
                <span className="font-extrabold text-white">
                  {!isStage2 ? 'Anonymous #SS-8492' : 'Alex Mercer (Verified)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Direct Email:</span>
                <span className={!isStage2 ? 'text-amber-300 font-mono font-bold' : 'text-emerald-400 font-bold'}>
                  {!isStage2 ? '🔒 Locked in Vault' : 'alex.mercer@verified.io'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">PDF Resume:</span>
                <span className={!isStage2 ? 'text-amber-300 font-mono font-bold' : 'text-sky-400 font-bold'}>
                  {!isStage2 ? '🔒 Locked in Vault' : '✓ Resume_Unlocked.pdf'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-0.5">
              <span>✓ Stripe ID Verified Human</span>
              <span className="text-slate-300 font-semibold">
                {!isStage2 ? 'Chatting anonymously first...' : 'Contact card released!'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * EMPLOYER VIGNETTE:
 * Auto-loops every 4 seconds between:
 * Phase 0: Candidate Accepts Pitch -> 1 Credit Applied & Mutual Chat Opened
 * Phase 1: Candidate Declines / Unanswered -> 0 Credits Used (100% Protected)
 */
export function EmployerVisualVignette() {
  const [phase, setPhase] = useState<0 | 1>(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase((prev) => (prev === 0 ? 1 : 0))
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const isDeclined = phase === 1

  return (
    <div className="mt-10 max-w-3xl mx-auto select-none pointer-events-none">
      <div className="rounded-2xl bg-[#0f172a] text-white border-2 border-slate-800 shadow-xl overflow-hidden">
        {/* Subtle Auto-Play Progress Header */}
        <div className="px-5 py-3 bg-slate-950/90 border-b border-slate-800/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
              Live Employer Preview • {isDeclined ? 'Ignored Pitch = 0 Credits Used' : 'Accepted Pitch = Mutual Chat Opened'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`h-1.5 rounded-full transition-all duration-500 ${
                !isDeclined ? 'w-6 bg-emerald-400' : 'w-2 bg-slate-700'
              }`}
            />
            <span
              className={`h-1.5 rounded-full transition-all duration-500 ${
                isDeclined ? 'w-6 bg-amber-400' : 'w-2 bg-slate-700'
              }`}
            />
          </div>
        </div>

        {/* Compact Single-Card Body */}
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Left: 40% Fit Gate & Inbound Free Guarantee */}
          <div className="md:col-span-6 space-y-3 md:border-r md:border-slate-800 md:pr-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">
                Automated Inbox Gatekeeper
              </span>
              <span className="text-[10px] font-extrabold text-emerald-400">
                Inbound Apps: 100% Free
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Candidate #SS-8492 (88% Fit)</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold">
                  ✓ Delivered
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                <span className="text-slate-400">Unqualified Bot / Spam (24% Fit)</span>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-extrabold">
                  ✕ Blocked (&lt;40%)
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400">
              ✓ DNS Corporate Domain Verified • 28 Industry Verticals
            </div>
          </div>

          {/* Right: Animated Accepted-Only Pitch Credit Protection */}
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border transition-colors duration-500 ${
                  !isDeclined
                    ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                    : 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                }`}
              >
                {!isDeclined ? '✓ Pitch Accepted by Candidate' : '↺ Pitch Declined / Unanswered'}
              </span>
              <span className="text-[10px] font-extrabold text-orange-400">
                Protected Credits
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 transition-all duration-500">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Outreach Status:</span>
                <span className="font-extrabold text-white">
                  {!isDeclined ? 'Stage 1 Chat Opened' : 'No Reply After Invite'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Credits Deducted:</span>
                <span className={!isDeclined ? 'text-emerald-400 font-extrabold' : 'text-amber-300 font-extrabold'}>
                  {!isDeclined ? '1 Credit Applied' : '0 Credits (Auto-Protected)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                <span className="text-slate-300 font-bold">Remaining Balance:</span>
                <span className="text-sky-400 font-black text-sm">
                  {!isDeclined ? '24 / 25 Credits' : '25 / 25 Credits'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-0.5">
              <span>★ Founding Partner Rate Lock</span>
              <span className="text-slate-300 font-semibold">
                {!isDeclined ? 'Pay only for mutual interest' : 'Never pay for ghosted outreach'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function InteractiveProductShowcase() {
  return (
    <div className="space-y-10">
      <CandidateVisualVignette />
      <EmployerVisualVignette />
    </div>
  )
}
