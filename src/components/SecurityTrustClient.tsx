"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { LEGAL_CONFIG } from "@/constants/legal"

type ViewMode = "standard" | "technical"

const STANDARD_PILLARS = [
  {
    badge: "1. Private Resume & Identity Vault",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-400/40",
    dotColor: "bg-indigo-400",
    title: "You Decide Who Sees Your Resume",
    summary: "Your uploaded PDF resume stays locked inside your private vault. While browsing and matching, employers only see your skills, experience, certifications, and languages.",
    bullets: [
      "The Introduction (Private Chat): Reveals the verified company name and opens direct chat showing only your First Name + Last Initial.",
      "The Conversation (One-Click Release): Shares your full PDF resume and contact info only when you click Release Resume & Contact Vault.",
    ],
  },
  {
    badge: "2. Stripe Identity & Business Verification",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
    dotColor: "bg-emerald-400",
    title: "No Sensitive IDs or Cards Stored on Our Servers",
    summary: "Special Sauce never stores government ID photos, selfies, Social Security Numbers, or credit card numbers on our servers.",
    bullets: [
      "Professional Verification: Handled directly by Stripe Identity so we only receive a simple verified confirmation.",
      "Employer Verification: Every business confirms its corporate domain, tax ID (EIN), and account admin identity before posting jobs.",
    ],
  },
  {
    badge: "3. Fresh Jobs & Anti-Spam Protections",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-400/40",
    dotColor: "bg-amber-400",
    title: "No Ghost Jobs or Bulk Resume Scraping",
    summary: "Traditional job boards let stale jobs sit for months. Special Sauce keeps every listing and connection active:",
    bullets: [
      "30-Day Job Expiration: Every job listing closes automatically after 30 days unless actively renewed by the hiring team.",
      "Active Response Requirement: Employers must message the professionals they unlock before unlocking more profiles.",
    ],
  },
  {
    badge: "4. Fair Matching & Dealbreaker Protection",
    badgeColor: "bg-sky-500/20 text-sky-300 border-sky-400/40",
    dotColor: "bg-sky-400",
    title: "TrueFit Score\u2122 & Automatic Dealbreakers",
    summary: "Our matching engine evaluates real skills, experience depth, pay alignment, credentials, and communication.",
    bullets: [
      "Hands-On Experience Counts: Roles that accept practical experience in place of a degree weight your real-world work history fairly.",
      "Automatic Dealbreaker Filter: Blocks invitations that fall below your minimum pay or conflict with your preferred work model.",
    ],
  },
]

const TECHNICAL_PILLARS = [
  {
    badge: "1. Intro/Convo Identity & Resume Vault",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-400/40",
    dotColor: "bg-indigo-400",
    title: "Staged Disclosure & Ephemeral Signed Resume URLs",
    summary: "Your uploaded PDF resume stays locked inside a private, non-public Supabase Storage bucket protected by PostgreSQL Row-Level Security (RLS). During discovery, employers only query your anonymized skill, tenure, certification, and language matrix.",
    bullets: [
      "The Introduction (Safe Thread): Reveals the verified company entity and opens encrypted chat while exposing only First Name + Last Initial.",
      "The Conversation (Professional-Controlled Release): Generates a 1-hour (3,600s TTL) cryptographically signed PDF resume URL only when you explicitly trigger Release Resume & Contact Vault.",
    ],
  },
  {
    badge: "2. Offloaded Biometric & Payment Vaulting",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
    dotColor: "bg-emerald-400",
    title: "Zero Raw Biometrics, Government IDs, or PAN Data on Our Servers",
    summary: "Special Sauce never ingests or persists government ID images, live biometric selfies, Social Security Numbers, or raw payment card numbers (PAN) in our database.",
    bullets: [
      "Professional Verification: Processed inside Stripe Identity (SOC 2 Type II & ISO 27001 certified); Special Sauce receives an HMAC-SHA256 signed webhook and persists only a boolean identity_verified flag.",
      "Employer 3-Pillar Verification: Enforces corporate domain DNS MX/TXT verification, 90-day RDAP domain registration age checks, IRS EIN attestation, and admin Stripe Identity verification.",
    ],
  },
  {
    badge: "3. Anti-Harvesting & Freshness Guardrails",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-400/40",
    dotColor: "bg-amber-400",
    title: "30-Day TTL Job Expiry & 5-Unlock Anti-Scraping Ceiling",
    summary: "Traditional job boards reward 6-month-old ghost jobs and automated bulk resume scraping. Special Sauce enforces deterministic state-machine guardrails:",
    bullets: [
      "30-Day Auto-Expiry: Every active job listing enforces a hard 30-day TTL and transitions out of active search unless renewed by the hiring team.",
      "5-Unlock Anti-Scraping Ceiling: Employer outbound unlocks are automatically rate-limited and paused if 5 unlocked professionals sit unmessaged, neutralizing bulk harvesting.",
    ],
  },
  {
    badge: "4. Deterministic TrueFit\u2122 Engine & Dealbreaker Firewall",
    badgeColor: "bg-sky-500/20 text-sky-300 border-sky-400/40",
    dotColor: "bg-sky-400",
    title: "5-Pillar TrueFit Score\u2122, Language Matrix & Hard Dealbreaker Firewall",
    summary: "Our deterministic matching engine evaluates professionals and roles across five weighted pillars: Core Competencies, Skill Tenure, Logistics & Pay, Industry & Credentials, and Execution & Communication.",
    bullets: [
      "Practical Experience Parity: Roles configured with degree-equivalency flags weight verified hands-on tenure equally alongside CEFR/proficiency language matrices.",
      "Hard Dealbreaker Firewall: Server-side pre-flight validation blocks outbound invitations that violate a professional\u2019s minimum compensation floor, work model, or employment type.",
    ],
  },
]

const TECHNICAL_SPECS_MATRIX = [
  {
    layer: "Encryption at Rest",
    standard: "AES-256 Block & Object Encryption",
    info: "All PostgreSQL database volumes, automated backups, and private resume PDF objects in vault storage are encrypted at rest using AES-256.",
  },
  {
    layer: "Encryption in Transit",
    standard: "TLS 1.3 / HTTPS Strict Transport Security (HSTS)",
    info: "All client-to-edge and server-to-subprocessor traffic enforces TLS 1.2/1.3 with strong cipher suites (ECDHE-RSA/ECDSA with AES-128/256-GCM).",
  },
  {
    layer: "Resume Vault Access Control",
    standard: "PostgreSQL Row-Level Security (RLS) + Ephemeral Signed URLs",
    info: "Resume buckets are non-public by default. Access requires explicit stage transition by the professional, generating a time-bound (3,600-second TTL) cryptographically signed token.",
  },
  {
    layer: "Biometric & Payment Isolation",
    standard: "Stripe Identity & Stripe Billing (PCI-DSS Level 1 / SOC 2 Type II)",
    info: "Government ID captures, facial biometrics, and payment methods are tokenized directly via Stripe TLS iframes. Webhook events are verified via HMAC-SHA256 signatures.",
  },
  {
    layer: "Corporate Entity Verification",
    standard: "RDAP Registry + DNS MX/TXT + IRS EIN Attestation",
    info: "Blocks disposable/free webmail domains, verifies domain age >= 90 days via RDAP lookup, validates mail exchange records, and requires admin biometric verification.",
  },
  {
    layer: "AI & Data Governance",
    standard: "Zero Public LLM Training Policy",
    info: "Private resumes, compensation floors, and chat transcripts are strictly isolated to your account workflow and are never sold, syndicated, or used to train external AI models.",
  },
]

export function SecurityTrustClient() {
  const [mode, setMode] = useState<ViewMode>("standard")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      if (params.get("view") === "technical") {
        setMode("technical")
      }
    }
  }, [])

  const handleModeChange = (nextMode: ViewMode) => {
    setMode(nextMode)
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      if (nextMode === "technical") {
        url.searchParams.set("view", "technical")
      } else {
        url.searchParams.delete("view")
      }
      window.history.replaceState({}, "", url.toString())
    }
  }

  const pillars = mode === "standard" ? STANDARD_PILLARS : TECHNICAL_PILLARS

  return (
    <>
      <section className="bg-slate-900 text-white py-12 sm:py-16 px-4 sm:px-6 md:px-12 border-b border-slate-800">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs sm:text-sm font-extrabold uppercase tracking-wider w-fit">
              {mode === "standard" ? "Security & Privacy" : "Security & Trust Architecture (Technical Specs)"}
            </div>
            <div role="tablist" aria-label="Security explanation depth" className="inline-flex items-center p-1.5 rounded-xl bg-slate-950 border border-slate-700/80 shadow-inner w-full sm:w-auto">
              <button type="button" role="tab" aria-selected={mode === "standard"} onClick={() => handleModeChange("standard")} className={"flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-extrabold transition-all cursor-pointer " + (mode === "standard" ? "bg-emerald-500 text-slate-950 shadow-sm" : "text-slate-300 hover:text-white")}>
                Standard Overview
              </button>
              <button type="button" role="tab" aria-selected={mode === "technical"} onClick={() => handleModeChange("technical")} className={"flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-extrabold transition-all cursor-pointer " + (mode === "technical" ? "bg-indigo-500 text-white shadow-sm" : "text-slate-300 hover:text-white")}>
                Technical Specs & Cryptography
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {mode === "standard" ? (
              <>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                  How We Protect Your <span className="text-emerald-400">Identity & Data</span>
                </h1>
                <p className="text-slate-100 text-base sm:text-xl leading-relaxed max-w-3xl">
                  Built to give professionals and hiring teams a safe, straightforward way to connect\u2014without spam, data harvesting, or public resume exposure.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                  How Special Sauce Works <span className="text-indigo-400">Under the Hood</span>
                </h1>
                <p className="text-slate-100 text-base sm:text-xl leading-relaxed max-w-3xl">
                  Full technical documentation covering our AES-256 storage encryption, TLS 1.3 transport security, Stripe Identity biometric isolation, PostgreSQL Row-Level Security (RLS), and anti-scraping guardrails.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-10 sm:py-14 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((pillar, i) => (
            <div key={mode + "-" + i} className="bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-700 shadow-lg flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <span className={"inline-block px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider border " + pillar.badgeColor}>
                  {pillar.badge}
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">{pillar.title}</h2>
                <p className="text-base text-slate-100 leading-relaxed">{pillar.summary}</p>
                <ul className="space-y-3 pt-4 border-t border-slate-800 text-base text-slate-100 leading-relaxed">
                  {pillar.bullets.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className={"mt-2 w-2 h-2 rounded-full shrink-0 " + pillar.dotColor} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {mode === "technical" && (
          <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-indigo-500/40 shadow-lg space-y-6">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-lg bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-extrabold uppercase tracking-wider">
                Cryptographic & Infrastructure Specification Matrix
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Encryption Standards, Vault Isolation & Verification Protocols
              </h2>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-3xl">
                Reference architecture for enterprise IT, InfoSec, and privacy reviewers evaluating Special Sauce Solutions LLC.
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-xs font-extrabold uppercase tracking-wider text-slate-300">
                    <th className="py-3.5 px-4 sm:px-5">Security Layer</th>
                    <th className="py-3.5 px-4 sm:px-5">Protocol / Standard</th>
                    <th className="py-3.5 px-4 sm:px-5">Implementation Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm text-slate-100">
                  {TECHNICAL_SPECS_MATRIX.map((cell, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4 sm:px-5 font-extrabold text-white whitespace-nowrap align-top">{cell.layer}</td>
                      <td className="py-4 px-4 sm:px-5 font-mono text-xs sm:text-sm text-emerald-300 align-top">{cell.standard}</td>
                      <td className="py-4 px-4 sm:px-5 text-slate-200 leading-relaxed align-top">{cell.info}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-slate-700 space-y-4 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {mode === "standard" ? (
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
                  Bank-Grade Security & Data Privacy
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  Encrypted Connections & Zero External AI Training
                </h2>
                <p className="text-base text-slate-100 leading-relaxed max-w-3xl">
                  All platform traffic and stored files are encrypted end-to-end. Payments and ID checks are handled directly inside Stripe\u2019s certified vault, and your private resumes are never sold or used to train public AI models.
                </p>
                <div className="pt-2">
                  <button type="button" onClick={() => handleModeChange("technical")} className="text-xs sm:text-sm font-extrabold text-indigo-300 hover:text-indigo-200 underline underline-offset-4 cursor-pointer">
                    Need AES-256, TLS 1.3, and RLS architectural specs? Switch to Technical Specs view \u2192
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
                  Enterprise Encryption & Subprocessor Isolation
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  Zero Raw Biometrics, PCI-DSS Level 1 Billing & Row-Level Security
                </h2>
                <p className="text-base text-slate-100 leading-relaxed max-w-3xl">
                  All platform traffic is encrypted in transit via TLS 1.3 and at rest via AES-256. Payment credentials and government ID biometrics are isolated inside Stripe\u2019s PCI-DSS Level 1 and SOC 2 Type II certified vault, and private resume files are protected by strict Supabase Row-Level Security (RLS) policies with strict data isolation and zero external model training.
                </p>
              </div>
            )}
            <div className="shrink-0 text-sm text-slate-100 space-y-1.5 md:text-right bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="font-extrabold text-white text-base">
                {mode === "standard" ? "Security & Privacy Desk" : "Security & Compliance Desk"}
              </p>
              <p>
                <a href={"mailto:" + LEGAL_CONFIG.supportEmail} className="text-emerald-300 font-bold hover:underline">
                  {LEGAL_CONFIG.supportEmail}
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-700 flex flex-col gap-6 shadow-lg">
          <div className="space-y-2 max-w-4xl">
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              Ready to Experience Straightforward Hiring?
            </h3>
            <p className="text-base text-slate-100 leading-relaxed">
              Get verified once ($5 Professionals / $25 Employers) to explore matches at $0/mo, and upgrade only when you are ready to connect.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-1">
            <Link href="/pricing" className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black text-center transition-colors">
              \u2605 View Plans & Pricing
            </Link>
            <Link href="/signup/candidate" className="px-5 py-3 rounded-xl bg-indigo-600 text-white text-sm font-extrabold text-center hover:bg-indigo-500 transition-colors">
              Join as Professional ($5) \u2192
            </Link>
            <Link href="/signup/employer" className="px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-extrabold text-center hover:bg-emerald-500 transition-colors">
              Join as Employer ($25) \u2192
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
