import Link from 'next/link'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { LEGAL_CONFIG } from '@/constants/legal'

export const metadata = {
  title: 'Security & Trust Architecture | specialsauce.io',
  description:
    'How Special Sauce works under the hood: Intro/Convo Identity & Resume Vault, Stripe Identity Biometric Protection, Anti-Harvesting Guardrails, and TrueFit Score™.',
}

const SECURITY_PILLARS = [
  {
    badge: '1. Intro/Convo Identity & Resume Vault',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
    dotColor: 'bg-indigo-400',
    title: 'Staged Disclosure & Signed Resume URLs',
    summary:
      'Your uploaded PDF resume stays locked inside a private, non-public vault. During discovery, employers only see your anonymized skill, tenure, certification, and language matrix.',
    bullets: [
      'The Introduction (Safe Thread): Reveals the verified company name and opens encrypted chat while showing only your First Name + Last Initial.',
      'The Conversation (Candidate-Controlled Release): Generates a 1-hour cryptographically signed PDF resume link only when you click Release Resume & Contact Vault.',
    ],
  },
  {
    badge: '2. Offloaded Biometric & Payment Vaulting',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    dotColor: 'bg-emerald-400',
    title: 'Zero Sensitive IDs or Cards on Our Servers',
    summary:
      'Special Sauce never stores government ID images, live biometric selfies, Social Security Numbers, or raw credit card numbers in our database.',
    bullets: [
      'Candidate Verification: Processed directly inside Stripe Identity; Special Sauce stores only a boolean identity_verified flag.',
      'Employer 3-Pillar Verification: Verified via corporate domain DNS MX/TXT checks, 90-day RDAP domain age enforcement, and IRS EIN attestation.',
    ],
  },
  {
    badge: '3. Anti-Harvesting & Freshness Guardrails',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    dotColor: 'bg-amber-400',
    title: '30-Day Job Expiry & Silent Unlock Caps',
    summary:
      'Traditional job boards reward 6-month-old ghost jobs and bulk resume scraping. Special Sauce enforces two automatic platform guardrails:',
    bullets: [
      '30-Day Auto-Expiry: Every active job listing automatically closes after 30 days unless manually renewed by the hiring team.',
      '5-Unlock Anti-Scraping Ceiling: Employers are paused if 5 unlocked candidates sit unmessaged, blocking bulk data harvesting.',
    ],
  },
  {
    badge: '4. Multi-Industry TrueFit™ Matching & Dealbreakers',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    dotColor: 'bg-sky-400',
    title: '5-Point TrueFit Score™, Language Matrix & Dealbreaker Firewall',
    summary:
      'Our matching engine scores candidates and roles across five pillars: Core Competencies, Skill Tenure, Logistics & Pay, Industry & Creds, and Execution & Comm.',
    bullets: [
      'Practical Experience Parity: Roles accepting hands-on experience in lieu of a degree weight real-world tenure equally alongside language proficiency.',
      'Hard Dealbreaker Firewall: Automatically blocks invitations that violate your minimum pay band, work model, or employment type.',
    ],
  },
]

export default function SecurityTrustPage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col justify-between">
      <div>
        <PublicHeader />

        {/* Dark Hero Header */}
        <section className="bg-slate-900 text-white py-12 sm:py-16 px-4 sm:px-6 md:px-12 border-b border-slate-800">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
              🛡️ Security &amp; Privacy Architecture
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              How Special Sauce Works{' '}
              <span className="text-emerald-400">Under the Hood</span>
            </h1>
            <p className="text-slate-100 text-base sm:text-xl leading-relaxed max-w-3xl">
              Built so candidates and hiring managers across all 28 industry verticals get a simple, high-signal experience—backed by Stripe biometric isolation, Conversation vault encryption, and anti-harvesting guardrails.
            </p>
          </div>
        </section>

        {/* 4 Pillars Grid */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-10 sm:py-14 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SECURITY_PILLARS.map((pillar, i) => (
              <div
                key={i}
                className="bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-700 shadow-lg flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider border ${pillar.badgeColor}`}
                  >
                    {pillar.badge}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
                    {pillar.title}
                  </h2>
                  <p className="text-base text-slate-100 leading-relaxed">
                    {pillar.summary}
                  </p>
                  <ul className="space-y-3 pt-4 border-t border-slate-800 text-base text-slate-100 leading-relaxed">
                    {pillar.bullets.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span
                          className={`mt-2 w-2 h-2 rounded-full shrink-0 ${pillar.dotColor}`}
                        />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Infrastructure Subprocessors & B2B Compliance Banner */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-slate-700 space-y-4 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
                  Enterprise Encryption &amp; Subprocessor Isolation
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  Zero Raw Biometrics, PCI-DSS Level 1 Billing &amp; Row-Level Security
                </h2>
                <p className="text-base text-slate-100 leading-relaxed max-w-3xl">
                  All platform traffic is encrypted in transit via TLS 1.3 and at rest via AES-256. Payment credentials and government ID biometrics are isolated inside Stripe&apos;s PCI-DSS Level 1 and SOC 2 Type II certified vault, and private resume files are protected by strict Supabase Row-Level Security (RLS) policies with strict data isolation and zero external model training.
                </p>
              </div>
              <div className="shrink-0 text-sm text-slate-100 space-y-1.5 md:text-right bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="font-extrabold text-white text-base">Security &amp; Compliance Desk</p>
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
                    className="text-slate-200 hover:underline"
                  >
                    {LEGAL_CONFIG.privacyEmail}
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg">
            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                Ready to Join the 100% Human-to-Human Marketplace?
              </h3>
              <p className="text-base text-slate-100">
                Build your profile or stage roles for free, then start a 30-Day Free Trial on any Candidate or Employer Founding Partner plan.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/pricing"
                className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black transition-colors"
              >
                ★ Compare Plans &amp; Perks
              </Link>
              <Link
                href="/signup/candidate"
                className="px-5 py-3 rounded-xl bg-indigo-600 text-white text-sm font-extrabold hover:bg-indigo-500 transition-colors"
              >
                Join as Candidate (30-Day Free Trial) →
              </Link>
              <Link
                href="/signup/employer"
                className="px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-extrabold hover:bg-emerald-500 transition-colors"
              >
                Join as Employer (30-Day Free Trial) →
              </Link>
            </div>
          </div>
        </main>
      </div>

      <PublicFooter />
    </div>
  )
}
