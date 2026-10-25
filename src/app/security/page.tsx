import Link from 'next/link'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { LEGAL_CONFIG } from '@/constants/legal'

export const metadata = {
  title: 'Security & Trust Architecture | specialsauce.io',
  description:
    'How Special Sauce works under the hood: 2-Stage Identity & Resume Vault, Stripe Identity Stripe ID Protection, Anti-Harvesting Guardrails, and 5-Point AI Fit Radar.',
}

export default function SecurityTrustPage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col justify-between">
      <div>
        <PublicHeader />

        {/* Dark Hero Header */}
        <section className="bg-slate-900 text-white py-12 sm:py-20 px-4 sm:px-6 md:px-12 border-b border-slate-800">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-slate-300/30 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
              🛡️ Security &amp; Privacy Architecture
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              How Special Sauce Works Under the Hood
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl">
              Built so candidates and hiring managers across all 28 industry verticals get a simple, stress-free experience—backed by enterprise-grade identity verification, data minimization, and anti-harvesting guardrails.
            </p>
          </div>
        </section>

        {/* 4 Pillars Grid */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 md:px-12 py-10 sm:py-16 space-y-8 sm:space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pillar 1 */}
            <div className="bg-white p-7 rounded-2xl border-2 border-slate-300 shadow-2xs space-y-3 border-slate-300">
              <span className="inline-block px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-extrabold">
                1. 2-Stage Identity &amp; Resume Vault
              </span>
              <h2 className="text-lg font-extrabold text-slate-900">
                Staged Disclosure &amp; Signed Resume URLs
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                When a candidate uploads a PDF resume, it is stored in a private, non-public vault. During initial discovery, employers only see an anonymized skill, experience, certification, and language matrix.
              </p>
              <ul className="text-xs text-slate-600 space-y-2 pt-3 border-t border-slate-300">
                <li>
                  • <strong>Stage 1 (Safe Thread):</strong> Opens an in-platform message thread and reveals the employer’s company name while masking the candidate’s last name (<code>First Name + Last Initial</code>) and keeping their email and PDF resume locked.
                </li>
                <li>
                  • <strong>Stage 2 (Candidate-Controlled Release):</strong> Only when the candidate clicks <em>Release Resume &amp; Contact Vault</em> does the platform generate a time-limited, cryptographically signed 1-hour URL to their PDF resume.
                </li>
              </ul>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white p-7 rounded-2xl border-2 border-slate-300 shadow-2xs space-y-3 border-slate-300">
              <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-extrabold">
                2. Offloaded Biometric &amp; Payment Vaulting
              </span>
              <h2 className="text-lg font-extrabold text-slate-900">
                Zero Sensitive IDs or Cards on Our Servers
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Special Sauce never stores government ID images, verification selfies, Social Security Numbers, or raw credit card numbers in our database.
              </p>
              <ul className="text-xs text-slate-600 space-y-2 pt-3 border-t border-slate-300">
                <li>
                  • <strong>Candidate Verification:</strong> Handled directly by Stripe Identity. Our database only stores a boolean <code>identity_verified</code> status flag.
                </li>
                <li>
                  • <strong>Employer Domain Verification:</strong> Verified via corporate email domain matching and live DNS MX/TXT record validation.
                </li>
              </ul>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white p-7 rounded-2xl border-2 border-slate-300 shadow-2xs space-y-3 border-slate-300">
              <span className="inline-block px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-extrabold">
                3. Anti-Harvesting &amp; Freshness Guardrails
              </span>
              <h2 className="text-lg font-extrabold text-slate-900">
                30-Day Job Expiry &amp; Silent Unlock Caps
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Traditional job boards incentivize &ldquo;ghost jobs&rdquo; and bulk resume scraping. Special Sauce enforces two automatic platform guardrails:
              </p>
              <ul className="text-xs text-slate-600 space-y-2 pt-3 border-t border-slate-300">
                <li>
                  • <strong>30-Day Auto-Expiry:</strong> Every active job listing automatically closes after 30 days unless manually renewed by the hiring team.
                </li>
                <li>
                  • <strong>Unmessaged Unlock Cap:</strong> Employers cannot bulk-unlock candidate profiles without engaging; if an organization has 5 unlocked candidates awaiting an introductory message, further unlocks are paused until they message or archive those candidates.
                </li>
              </ul>
            </div>

            {/* Pillar 4 */}
            <div className="bg-white p-7 rounded-2xl border-2 border-slate-300 shadow-2xs space-y-3 border-slate-300">
              <span className="inline-block px-2.5 py-1 rounded-md bg-violet-50 text-violet-800 text-xs font-extrabold">
                4. Multi-Industry AI Matching &amp; Dealbreakers
              </span>
              <h2 className="text-lg font-extrabold text-slate-900">
                5-Point Radar, Language Matrix &amp; Dealbreaker Firewall
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Our matching engine evaluates candidates and roles across five normalized pillars: Core Competencies, Skill Tenure, Logistics &amp; Pay, Industry &amp; Creds, and Execution &amp; Comm.
              </p>
              <ul className="text-xs text-slate-600 space-y-2 pt-3 border-t border-slate-300">
                <li>
                  • <strong>Practical Experience &amp; Language Precision:</strong> Roles that accept practical experience in lieu of a degree weight hands-on skills equally, while verifying written/verbal language modality and proficiency.
                </li>
                <li>
                  • <strong>Hard Dealbreaker Firewall:</strong> Employers are automatically blocked from pitching candidates if the role violates the candidate’s minimum salary expectation, work model, employment type, or language requirements.
                </li>
              </ul>
            </div>
          </div>

          {/* Infrastructure Subprocessors & B2B Compliance Banner */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl border-2 border-slate-800 space-y-4 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider mb-2">
                  Enterprise Encryption &amp; Subprocessor Isolation
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  Zero Raw Biometrics, PCI-DSS Level 1 Billing &amp; Row-Level Security
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed max-w-3xl">
                  All platform traffic is encrypted in transit via TLS 1.3 and at rest via AES-256. Payment credentials and government ID biometrics are isolated inside Stripe&apos;s PCI-DSS Level 1 and SOC 2 Type II certified vault, and private resume files are protected by strict Supabase Row-Level Security (RLS) policies with zero public AI model training.
                </p>
              </div>
              <div className="shrink-0 text-xs text-slate-300 space-y-1 md:text-right">
                <p className="font-bold text-white">Security &amp; Compliance Desk</p>
                <p>
                  <a
                    href={`mailto:${LEGAL_CONFIG.legalEmail}`}
                    className="text-emerald-300 font-bold hover:underline"
                  >
                    {LEGAL_CONFIG.legalEmail}
                  </a>
                </p>
                <p>
                  <a
                    href={`mailto:${LEGAL_CONFIG.privacyEmail}`}
                    className="text-slate-300 hover:underline"
                  >
                    {LEGAL_CONFIG.privacyEmail}
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs border-slate-300">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                Ready to claim your 30-Day Founding Rewards?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Create your free Candidate or Employer account in under two minutes, or compare our plan matrix.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/pricing"
                className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-extrabold hover:bg-amber-100 transition-colors"
              >
                ★ Compare Plans &amp; Perks
              </Link>
              <Link
                href="/signup/candidate"
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors"
              >
                Join as Candidate
              </Link>
              <Link
                href="/signup/employer"
                className="px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-slate-800 text-xs font-extrabold hover:bg-slate-50 transition-colors border-slate-300"
              >
                Join as Employer
              </Link>
            </div>
          </div>
        </main>
      </div>

      <PublicFooter />
    </div>
  )
}
