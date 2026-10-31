import Link from 'next/link'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { LEGAL_CONFIG } from '@/constants/legal'

export const metadata = {
  title: 'Security & Privacy | specialsauce.io',
  description:
    'How Special Sauce protects your identity, resume, and time with Stripe ID verification and private resume controls.',
}

const SECURITY_PILLARS = [
  {
    badge: '1. Private Resume & Identity Vault',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
    dotColor: 'bg-indigo-400',
    title: 'You Decide Who Sees Your Resume',
    summary:
      'Your uploaded PDF resume stays locked inside your private vault. While browsing and matching, employers only see your skills, experience, certifications, and languages.',
    bullets: [
      'The Introduction (Private Chat): Reveals the verified company name and opens direct chat showing only your First Name + Last Initial.',
      'The Conversation (One-Click Release): Shares your full PDF resume and contact info only when you click Release Resume & Contact Vault.',
    ],
  },
  {
    badge: '2. Stripe Identity & Business Verification',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    dotColor: 'bg-emerald-400',
    title: 'No Sensitive IDs or Cards Stored on Our Servers',
    summary:
      'Special Sauce never stores government ID photos, selfies, Social Security Numbers, or credit card numbers on our servers.',
    bullets: [
      'Professional Verification: Handled directly by Stripe Identity so we only receive a simple verified confirmation.',
      'Employer Verification: Every business confirms its corporate domain, tax ID (EIN), and account admin identity before posting jobs.',
    ],
  },
  {
    badge: '3. Fresh Jobs & Anti-Spam Protections',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    dotColor: 'bg-amber-400',
    title: 'No Ghost Jobs or Bulk Resume Scraping',
    summary:
      'Traditional job boards let stale jobs sit for months. Special Sauce keeps every listing and connection active:',
    bullets: [
      '30-Day Job Expiration: Every job listing closes automatically after 30 days unless actively renewed by the hiring team.',
      'Active Response Requirement: Employers must message the professionals they unlock before unlocking more profiles.',
    ],
  },
  {
    badge: '4. Fair Matching & Dealbreaker Protection',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    dotColor: 'bg-sky-400',
    title: 'TrueFit Score™ & Automatic Dealbreakers',
    summary:
      'Our matching engine evaluates real skills, experience depth, pay alignment, credentials, and communication.',
    bullets: [
      'Hands-On Experience Counts: Roles that accept practical experience in place of a degree weight your real-world work history fairly.',
      'Automatic Dealbreaker Filter: Blocks invitations that fall below your minimum pay or conflict with your preferred work model.',
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
              🛡️ Security &amp; Privacy
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              How We Protect Your{' '}
              <span className="text-emerald-400">Identity &amp; Data</span>
            </h1>
            <p className="text-slate-100 text-base sm:text-xl leading-relaxed max-w-3xl">
              Built to give professionals and hiring teams a safe, straightforward way to connect—without spam, data harvesting, or public resume exposure.
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

          {/* Encryption & Privacy Banner */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-slate-700 space-y-4 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
                  Bank-Grade Security &amp; Data Privacy
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  Encrypted Connections &amp; Zero External AI Training
                </h2>
                <p className="text-base text-slate-100 leading-relaxed max-w-3xl">
                  All platform traffic and stored files are encrypted end-to-end. Payments and ID checks are handled directly inside Stripe&apos;s certified vault, and your private resumes are never sold or used to train public AI models.
                </p>
              </div>
              <div className="shrink-0 text-sm text-slate-100 space-y-1.5 md:text-right bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="font-extrabold text-white text-base">Security &amp; Privacy Desk</p>
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
              <Link
                href="/pricing"
                className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black text-center transition-colors"
              >
                ★ View Plans &amp; Pricing
              </Link>
              <Link
                href="/signup/candidate"
                className="px-5 py-3 rounded-xl bg-indigo-600 text-white text-sm font-extrabold text-center hover:bg-indigo-500 transition-colors"
              >
                Join as Professional ($5) →
              </Link>
              <Link
                href="/signup/employer"
                className="px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-extrabold text-center hover:bg-emerald-500 transition-colors"
              >
                Join as Employer ($25) →
              </Link>
            </div>
          </div>
        </main>
      </div>

      <PublicFooter />
    </div>
  )
}
