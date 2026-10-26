'use client'

import React, { useState } from 'react'

export interface InteractiveProductShowcaseProps {
  studioMode?: boolean
}

export function InteractiveProductShowcase({ studioMode = false }: InteractiveProductShowcaseProps) {
  const [activeTab, setActiveTab] = useState<'radar' | 'vault' | 'pitch'>('radar')
  const [radarScenario, setRadarScenario] = useState<'qualified' | 'blocked'>('qualified')
  const [vaultStage, setVaultStage] = useState<1 | 2>(1)
  const [pitchOutcome, setPitchOutcome] = useState<'pending' | 'accepted' | 'declined'>('accepted')

  const isQualified = radarScenario === 'qualified'

  return (
    <div className={studioMode ? 'w-full max-w-5xl mx-auto' : 'mb-24'}>
      {!studioMode && (
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 text-amber-300 border border-slate-700 text-xs font-extrabold uppercase tracking-wider mb-3 shadow-xs">
            <span>⚡</span> Live Interactive Platform Preview
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            See How Special Sauce Works <span className="text-[#0077D4]">Inside the Platform</span>
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-500">
            Click through the interactive controls below to test our 5-Point AI Fit Radar™, trigger the 2-Stage Privacy Handshake, and see how Accepted-Only Pitch Credit Protection works.
          </p>
        </div>
      )}

      {/* Outer Dark Mode Product Stage (#0f172a) */}
      <div className="rounded-3xl bg-[#0f172a] text-white border-2 border-slate-800 shadow-2xl overflow-hidden">
        {/* Top Browser / Window Chrome + Interactive Tab Switcher */}
        <div className="px-4 sm:px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-400/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <div className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>app.specialsauce.io/verified-session</span>
            </div>
          </div>

          {/* 3 Mechanism Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('radar')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                activeTab === 'radar'
                  ? 'bg-[#0077D4] text-white border-sky-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>🎯</span>
              <span>1. 5-Point AI Fit Radar™</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vault')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                activeTab === 'vault'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>🔐</span>
              <span>2. 2-Stage Privacy Vault</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pitch')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                activeTab === 'pitch'
                  ? 'bg-[#EA580C] text-white border-orange-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>🛡️</span>
              <span>3. Protected Pitch Credits</span>
            </button>
          </div>
        </div>

        {/* STAGE BODY */}
        <div className="p-5 sm:p-8 lg:p-10 bg-gradient-to-b from-[#0f172a] to-slate-950">
          {/* =========================================================
              TAB 1: 5-POINT AI FIT RADAR & 40% MINIMUM MATCH GATE
             ========================================================= */}
          {activeTab === 'radar' && (
            <div className="space-y-6">
              {/* Interactive Scenario Toggle Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-400 block">
                    Interactive Fit Gate Simulator
                  </span>
                  <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                    Toggle between a qualified candidate and an unqualified spam application to see how the 40% minimum threshold protects both sides.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setRadarScenario('qualified')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      isQualified
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    ✓ 88% Qualified Match
                  </button>
                  <button
                    type="button"
                    onClick={() => setRadarScenario('blocked')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      !isQualified
                        ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    ✕ 28% Blocked (&lt;40% Gate)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left Column: Role Card & Pay Transparency */}
                <div className="lg:col-span-5 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[11px] font-extrabold">
                        ✓ DNS Verified Employer
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 text-amber-950 text-[11px] font-extrabold border border-amber-500">
                        ★ Founding Partner
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Role ID: SS-ROLE-4092 • Enterprise SaaS &amp; Cloud
                    </div>
                    <h3 className="text-xl font-extrabold text-white mt-1">
                      Senior Cloud Infrastructure Architect
                    </h3>

                    {/* Upfront Pay Band & 30-Day Freshness */}
                    <div className="mt-4 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Verified Pay Band:</span>
                        <span className="text-emerald-400 font-extrabold text-sm">$145,000 – $165,000 / yr</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Work Arrangement:</span>
                        <span className="text-slate-200 font-bold">Remote (US Metro Aligned)</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Listing Expiration:</span>
                        <span className="text-sky-400 font-bold">26 Days Left (30-Day Cap)</span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Required Core Stack &amp; Credentials
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {['AWS / Kubernetes', 'Terraform', 'Zero-Trust IAM', 'SOC2 / ISO 27001', 'English (Native/Fluent)'].map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-xs font-semibold text-slate-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>🔒 Employer Name Hidden in Feed</span>
                    <span className="text-emerald-400 font-bold">100% Free to Apply</span>
                  </div>
                </div>

                {/* Right Column: 5-Point AI Fit Radar Breakdown */}
                <div className="lg:col-span-7 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-sky-400">
                            5-Point AI Fit Radar™
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700">
                            Calibrated Daily
                          </span>
                        </div>
                        <h4 className="text-lg font-extrabold text-white mt-1">
                          {isQualified
                            ? 'High-Precision Candidate Match Verified'
                            : 'Below 40% Minimum Match Threshold'}
                        </h4>
                      </div>

                      <div className={`px-4 py-2.5 rounded-2xl border text-center shrink-0 ${
                        isQualified
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                          : 'bg-rose-500/15 border-rose-500/50 text-rose-300'
                      }`}>
                        <div className="text-2xl font-black leading-none">
                          {isQualified ? '88%' : '28%'}
                        </div>
                        <div className="text-[10px] font-extrabold uppercase tracking-wider mt-1">
                          {isQualified ? '✓ Gate Passed (≥40%)' : '✕ Gate Locked (<40%)'}
                        </div>
                      </div>
                    </div>

                    {/* 5 Dimension Bars */}
                    <div className="mt-5 space-y-3.5">
                      {[
                        {
                          label: '1. Core Technical & Functional Skills',
                          score: isQualified ? 92 : 25,
                          note: isQualified ? 'AWS, Kubernetes, Terraform, IAM matched' : 'Missing core cloud architecture stack',
                        },
                        {
                          label: '2. Role Seniority & Industry Experience',
                          score: isQualified ? 86 : 30,
                          note: isQualified ? '8+ yrs enterprise infrastructure leadership' : '1 yr unrelated role experience',
                        },
                        {
                          label: '3. Licenses, Degrees & Certifications',
                          score: isQualified ? 100 : 20,
                          note: isQualified ? 'AWS Solutions Architect Pro verified' : 'Required security credentials missing',
                        },
                        {
                          label: '4. Written & Verbal Language Fluency',
                          score: isQualified ? 100 : 60,
                          note: isQualified ? 'C2 Native / Bilingual Proficiency' : 'Partial fluency match',
                        },
                        {
                          label: '5. Minimum Pay & Dealbreaker Alignment',
                          score: isQualified ? 84 : 15,
                          note: isQualified ? '$150k target inside $145k–$165k band' : 'Pay & location dealbreaker mismatch',
                        },
                      ].map((row) => (
                        <div key={row.label} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-200">{row.label}</span>
                            <span className={`font-extrabold ${
                              row.score >= 75
                                ? 'text-emerald-400'
                                : row.score >= 40
                                ? 'text-amber-300'
                                : 'text-rose-400'
                            }`}>
                              {row.score}%
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                row.score >= 75
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                  : row.score >= 40
                                  ? 'bg-amber-400'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${row.score}%` }}
                            />
                          </div>
                          <div className="text-[11px] text-slate-400">{row.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {isQualified ? (
                      <>
                        <div className="text-xs text-emerald-300 font-semibold flex items-center gap-2">
                          <span>✓ Stripe Identity Verified</span>
                          <span>•</span>
                          <span>Anonymous Stage 1 Ready</span>
                        </div>
                        <span className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs text-center shadow-md">
                          Submit Protected Application (88% Fit) →
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="text-xs text-rose-300 font-semibold">
                          🛡️ Blocked from Employer Inbox: Below 40% Minimum Fit Threshold
                        </div>
                        <span className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 font-extrabold text-xs text-center border border-slate-700">
                          Application Locked (&lt;40% Fit)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 2: 2-STAGE PRIVACY HANDSHAKE (STAGE 1 <-> STAGE 2)
             ========================================================= */}
          {activeTab === 'vault' && (
            <div className="space-y-6">
              {/* Interactive Stage Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                    Interactive 2-Stage Privacy Vault
                  </span>
                  <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                    Click between Stage 1 and Stage 2 to see exactly what an employer sees before and after the candidate releases their contact vault.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setVaultStage(1)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      vaultStage === 1
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    🔒 Stage 1: Anonymous Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setVaultStage(2)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      vaultStage === 2
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    🔓 Stage 2: Vault Released
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left Column: Candidate Identity & Vault Card */}
                <div className="lg:col-span-5 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[11px] font-extrabold">
                        ✓ Stripe ID Verified Human
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 text-amber-950 text-[11px] font-extrabold border border-amber-500">
                        ★ Founding Member
                      </span>
                    </div>

                    <div className="flex items-center gap-3.5 mb-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg border-2 ${
                        vaultStage === 1
                          ? 'bg-slate-950 border-amber-400/60 text-amber-300'
                          : 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      }`}>
                        {vaultStage === 1 ? '🔒' : 'AM'}
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Candidate Ref: #SS-8492
                        </div>
                        <h3 className="text-xl font-extrabold text-white">
                          {vaultStage === 1 ? 'Anonymous Verified Candidate' : 'Alex Mercer (Identity Released)'}
                        </h3>
                        <div className="text-xs font-semibold text-emerald-400">
                          88% AI Fit Score • Dallas–Fort Worth Metro
                        </div>
                      </div>
                    </div>

                    {/* Vault Fields */}
                    <div className="space-y-2.5 p-4 rounded-xl bg-slate-950/90 border border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Legal Name:</span>
                        <span className={vaultStage === 1 ? 'text-amber-300 font-mono font-bold' : 'text-white font-bold'}>
                          {vaultStage === 1 ? '🔒 Protected in Stage 2 Vault' : 'Alex Mercer'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Direct Email:</span>
                        <span className={vaultStage === 1 ? 'text-amber-300 font-mono font-bold' : 'text-emerald-400 font-bold'}>
                          {vaultStage === 1 ? '🔒 ••••••••@••••••••.com' : 'alex.mercer@verified-mail.io'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Direct Phone:</span>
                        <span className={vaultStage === 1 ? 'text-amber-300 font-mono font-bold' : 'text-slate-200 font-bold'}>
                          {vaultStage === 1 ? '🔒 (•••) •••-••••' : '(214) 555-0194'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                        <span className="text-slate-400">Full PDF Resume:</span>
                        <span className={vaultStage === 1 ? 'text-amber-300 font-mono font-bold' : 'text-sky-400 font-extrabold underline'}>
                          {vaultStage === 1 ? '🔒 Locked Until Candidate Releases' : '⬇ Alex_Mercer_Resume_Verified.pdf'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setVaultStage(vaultStage === 1 ? 2 : 1)}
                    className={`mt-6 w-full py-3 px-4 rounded-xl font-extrabold text-xs transition-all cursor-pointer shadow-md ${
                      vaultStage === 1
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {vaultStage === 1
                      ? '🔓 Click to Simulate Candidate Releasing Stage 2 Vault →'
                      : '🔒 Reset to Stage 1 (Anonymous Protected Mode)'}
                  </button>
                </div>

                {/* Right Column: Encrypted Stage 1 & 2 Messaging Thread */}
                <div className="lg:col-span-7 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                      <div>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                          {vaultStage === 1 ? 'Stage 1: Double-Blind Protected Chat' : 'Stage 2: Full Contact & Resume Unlocked'}
                        </span>
                        <h4 className="text-base font-extrabold text-white mt-0.5">
                          Connected with: Apex Cloud Systems (DNS Verified: apexcloud.io)
                        </h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300">
                        Zero Public Exposure
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 max-w-xl">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span className="font-bold text-sky-400">Apex Cloud Systems (Hiring Lead)</span>
                          <span>Stage 1 Connection</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                          Hi #SS-8492 — your 88% Fit Radar match and AWS Solutions Architect Pro credentials stood out immediately. Our band for this role is $155,000 base + equity. Would you be open to a quick architecture chat this week?
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-indigo-950/50 border border-indigo-500/30 max-w-xl ml-auto">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span className="font-bold text-emerald-400">
                            {vaultStage === 1 ? 'Candidate #SS-8492 (You)' : 'Alex Mercer (You)'}
                          </span>
                          <span>Stage 1 Reply</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                          Thanks for reaching out! The $155k band and remote US setup align with my preferences. I’m releasing my Stage 2 Resume &amp; Contact Vault now so we can schedule.
                        </p>
                      </div>

                      {vaultStage === 2 && (
                        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-between gap-3">
                          <div className="text-xs text-emerald-200 font-semibold">
                            <span className="font-extrabold text-emerald-300">✓ Stage 2 Vault Released by Candidate:</span> Full PDF resume, email, and phone number are now unlocked for Apex Cloud Systems.
                          </div>
                          <span className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 text-[10px] font-black uppercase shrink-0">
                            Unlocked
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>🛡️ Current employer can never search your name or resume</span>
                    <span className="text-slate-300 font-semibold">Candidate controls Stage 2 release</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 3: EMPLOYER ACCEPTED-ONLY PITCH CREDIT PROTECTION
             ========================================================= */}
          {activeTab === 'pitch' && (
            <div className="space-y-6">
              {/* Interactive Pitch Outcome Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-400 block">
                    100% Accepted-Only Pitch Credit Simulator
                  </span>
                  <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                    Test what happens to your employer pitch credit balance when a passive candidate accepts vs. declines or ignores your outreach.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPitchOutcome('accepted')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      pitchOutcome === 'accepted'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    ✓ Candidate Accepts Pitch
                  </button>
                  <button
                    type="button"
                    onClick={() => setPitchOutcome('declined')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      pitchOutcome === 'declined'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    ↺ Declined / No Reply (0 Credits Used)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left Column: Employer Credit Ledger */}
                <div className="lg:col-span-5 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="px-2.5 py-1 rounded-md bg-orange-500/15 border border-orange-500/40 text-orange-300 text-[11px] font-extrabold">
                        🛡️ Accepted-Only Credit Ledger
                      </span>
                      <span className="text-xs font-bold text-emerald-400">
                        Inbound Applicants: 100% Free
                      </span>
                    </div>

                    <h3 className="text-xl font-extrabold text-white">
                      Zero Wasted Outreach Budget
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Reviewing and messaging candidates who apply to your job posts is always 100% free. Pitch credits are only used when you proactively pitch passive talent AND they accept.
                    </p>

                    <div className="mt-5 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-semibold">Starting Pitch Credits:</span>
                        <span className="text-sm font-extrabold text-white">25 Credits</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-semibold">Outreach Event:</span>
                        <span className="text-xs font-bold text-slate-200">
                          {pitchOutcome === 'accepted'
                            ? 'Candidate #SS-8492 Accepted Chat'
                            : 'Candidate Declined / Unanswered'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <span className="text-xs text-slate-400 font-semibold">Credits Deducted:</span>
                        <span className={`text-sm font-black ${
                          pitchOutcome === 'accepted' ? 'text-emerald-400' : 'text-amber-300'
                        }`}>
                          {pitchOutcome === 'accepted' ? '1 Credit (Mutual Chat Opened)' : '0 Credits (100% Auto-Protected)'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <span className="text-xs font-bold text-slate-200">Remaining Balance:</span>
                        <span className="text-lg font-black text-sky-400">
                          {pitchOutcome === 'accepted' ? '24 / 25 Credits' : '25 / 25 Credits'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                    <span>★ 12-Month Founding Partner Rate Lock</span>
                    <span className="text-orange-400 font-bold">No Recruiting Agency Fees</span>
                  </div>
                </div>

                {/* Right Column: Passive Candidate Search Card */}
                <div className="lg:col-span-7 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800">
                      <div>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-orange-400">
                          Passive Talent Directory • Filtered Match
                        </span>
                        <h4 className="text-lg font-extrabold text-white mt-0.5">
                          Candidate #SS-8492 • 88% Fit for Senior Cloud Architect
                        </h4>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 text-amber-950 text-[11px] font-extrabold border border-amber-500">
                        ★ Founding Member
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[10px] font-bold uppercase text-slate-400">Identity</div>
                        <div className="text-xs font-extrabold text-emerald-400 mt-0.5">✓ Stripe ID Verified</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[10px] font-bold uppercase text-slate-400">Experience</div>
                        <div className="text-xs font-extrabold text-white mt-0.5">8+ Years Verified</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[10px] font-bold uppercase text-slate-400">Min Pay Target</div>
                        <div className="text-xs font-extrabold text-emerald-400 mt-0.5">$150,000 / yr</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[10px] font-bold uppercase text-slate-400">Fluency</div>
                        <div className="text-xs font-extrabold text-white mt-0.5">English (Native C2)</div>
                      </div>
                    </div>

                    <div className="mt-4 p-4 rounded-xl bg-slate-950/90 border border-slate-800">
                      <div className="text-xs font-bold text-slate-300 mb-1.5">
                        {pitchOutcome === 'accepted'
                          ? '✓ Outcome: Candidate Accepted Your Pitch'
                          : '🛡️ Outcome: Candidate Declined / Did Not Respond'}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {pitchOutcome === 'accepted'
                          ? 'Candidate #SS-8492 accepted your pitch! Stage 1 direct messaging is now open, your verified company name is revealed to the candidate, and 1 pitch credit has been applied.'
                          : 'Because Candidate #SS-8492 did not accept the connection request, your pitch credit is automatically protected and returned to your balance. You never pay for ignored outreach.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">
                      Filter passive pool by 28 verticals, certs, metro &amp; language
                    </span>
                    <span className="px-4 py-2.5 rounded-xl bg-[#EA580C] text-white font-extrabold text-xs text-center shadow-md">
                      Send Protected Pitch (Accepted-Only Credit) →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
