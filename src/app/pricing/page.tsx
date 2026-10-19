import Link from 'next/link'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata = {
  title: 'Pricing, Plans & Founding Rewards | specialsauce.io',
  description:
    'Compare Special Sauce Candidate plans (Explorer, Professional, Prestige) and Employer plans (Starter, Growth, Enterprise with Workday & Greenhouse ATS Webhooks). First 30 days $0 during our Launch Window.',
}

export default function PricingMatrixPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col justify-between">
      <div>
        <PublicHeader />

        {/* Hero Header */}
        <section className="py-14 md:py-20 px-6 md:px-12 max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold uppercase tracking-wide">
            <span>★ Early-Access Launch • First 30 Days $0 Across All Plans</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Transparent Plans &amp; Founding Rewards
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Whether you&apos;re exploring your next career move in privacy or hiring verified talent across 28 industry verticals, your first 30 days are <strong className="text-slate-900">$0</strong> during our launch window.
          </p>
        </section>

        {/* Main 3x3 Matrix Container */}
        <main className="max-w-7xl mx-auto px-6 md:px-12 pb-24 space-y-20">
          {/* ================================================================
              SECTION 1: CANDIDATE PLANS (Explorer $0 / Professional $9 / Prestige $15)
             ================================================================ */}
          <div className="rounded-3xl border-2 border-slate-300 bg-gradient-to-b from-amber-50/60 via-white to-white p-6 sm:p-10 shadow-md space-y-8 relative overflow-hidden">
            {/* Top Unified Gold Launch Banner */}
            <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-7 border border-slate-300/60 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
                  <span>★ Candidate Founding Member Launch Window</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  First 30 Days Free on Any Plan + Permanent Founding Member Badge
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                  Enroll during our launch window to try <strong className="text-white">Professional</strong> or <strong className="text-white">Prestige</strong> for <strong className="text-emerald-300">$0 for your first 30 days</strong>. You permanently keep your <strong className="text-amber-300">Founding Member Status</strong> on any tier, plus full access to <strong className="text-amber-300">Verified Behavioral &amp; Responsiveness Signals</strong> across your blind profile.
                </p>
              </div>
              <div className="shrink-0">
                <Link
                  href="/signup/candidate"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-black transition-colors shadow-sm"
                >
                  Start 30-Day Free Trial →
                </Link>
              </div>
            </div>

            {/* 3 Candidate Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Tier 1: Explorer ($0) */}
              <div className="bg-white p-8 rounded-2xl border-2 border-slate-300 shadow-xs flex flex-col justify-between space-y-6 border-slate-300">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Passive Career Vault
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                      Explorer
                    </h3>
                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-slate-900">$0</span>
                      <span className="text-xs font-bold text-slate-500">/ forever</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Ideal when you&apos;re happily employed. Keep your anonymous profile live in the talent pool and let verified employers pitch you first.
                  </p>
                  <ul className="space-y-2.5 pt-3 border-t border-slate-300 text-xs text-slate-700 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Unlimited Inbound Employer Pitches</strong> &amp; Stage 1/2 Chat (100% Free)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Browse blind role feed &amp; transparent pay bands</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Unlimited 5-Point AI Fit Radar checks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>2-Stage Identity &amp; PDF Resume Vault protection</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">★</span>
                      <span>Keeps permanent <strong>Founding Member Status</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-400">
                      <span>✕</span>
                      <span>Outbound blind applications (Inbound pitches only)</span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-400">
                      <span>✕</span>
                      <span>Outbound Blind Applications (Included on Professional &amp; Prestige)</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/candidate"
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl text-center transition-colors"
                >
                  Create Free Explorer Vault →
                </Link>
              </div>

              {/* Tier 2: Professional ($9/mo - First 30 Days Free) */}
              <div className="bg-white p-8 rounded-2xl border-2 border-slate-300 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                  ★ First 30 Days $0
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700">
                      Targeted Job Seeker
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                      Professional
                    </h3>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">$9</span>
                      <span className="text-xs font-bold text-slate-500">/ mo after 30-day free trial</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Built for selective professionals actively submitting blind applications to high-fit roles with verified behavioral trust signals.
                  </p>
                  <ul className="space-y-2.5 pt-3 border-t border-slate-300 text-xs text-slate-700 font-medium">
                    <li className="flex items-start gap-2 text-amber-800 font-bold">
                      <span>★</span>
                      <span><strong>First 30 Days Free ($0)</strong> during Launch Window</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>15 Outbound Blind Applications / month</strong> (40%+ AI Fit)</span>
                    </li>
                    <li className="flex items-start gap-2 text-amber-800 font-bold">
                      <span>★</span>
                      <span><strong>Verified Behavioral Trust Signals</strong> (Vault-Ready &amp; Responsive Badges)</span>
                    </li>
                    <li className="flex items-start gap-2 text-amber-800 font-bold">
                      <span>★</span>
                      <span><strong>Permanent Founding Member Status</strong> &amp; Badge</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Unlimited 5-Point AI Fit Radar checks &amp; Inbound Pitches</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Elevated placement in Employer Talent Search</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/candidate"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl text-center transition-colors shadow-sm"
                >
                  Start 30-Day Free Professional Trial →
                </Link>
              </div>

              {/* Tier 3: Prestige ($15/mo - First 30 Days Free) */}
              <div className="bg-slate-900 text-white p-8 rounded-2xl border-2 border-indigo-500 shadow-lg flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                  ★ First 30 Days $0
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
                      Unlimited &amp; Priority Reach
                    </span>
                    <h3 className="text-2xl font-black text-white mt-0.5">
                      Prestige
                    </h3>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white">$15</span>
                      <span className="text-xs font-bold text-slate-300">/ mo after 30-day free trial</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Maximum visibility and zero application caps for active job seekers ready to transition fast.
                  </p>
                  <ul className="space-y-2.5 pt-3 border-t border-slate-800 text-xs text-slate-200 font-medium">
                    <li className="flex items-start gap-2 text-amber-300 font-bold">
                      <span>★</span>
                      <span><strong>First 30 Days Free ($0)</strong> during Launch Window</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span><strong>Unlimited Outbound Blind Applications</strong> (40%+ AI Fit)</span>
                    </li>
                    <li className="flex items-start gap-2 text-amber-300 font-bold">
                      <span>★</span>
                      <span><strong>Top-Priority Placement</strong> in Employer Talent Search</span>
                    </li>
                    <li className="flex items-start gap-2 text-amber-300 font-bold">
                      <span>★</span>
                      <span><strong>Verified Behavioral Trust Signals</strong> &amp; Priority Shortlist Placement</span>
                    </li>
                    <li className="flex items-start gap-2 text-amber-300 font-bold">
                      <span>★</span>
                      <span><strong>Permanent Founding Member Status</strong> &amp; Badge</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Switch or downgrade to $0 Explorer anytime</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/candidate"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl text-center transition-colors shadow-sm"
                >
                  Start 30-Day Free Prestige Trial →
                </Link>
              </div>
            </div>
          </div>

          {/* ================================================================
              SECTION 2: EMPLOYER PLANS (Starter $99 / Growth $299 / Enterprise $899)
             ================================================================ */}
          <div className="rounded-3xl border-2 border-slate-300 bg-gradient-to-b from-indigo-50/50 via-white to-white p-6 sm:p-10 shadow-md space-y-8 relative overflow-hidden">
            {/* Top Unified Gold Launch Banner */}
            <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-7 border border-slate-300/60 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
                  <span>★ Employer Founding Partner Launch Window</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  First 30 Days Free on Any Employer Plan + Permanent Founding Partner Status
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                  Verify your corporate domain during launch to experience <strong className="text-white">Starter, Growth, or Enterprise</strong> for <strong className="text-emerald-300">$0 for your first 30 days</strong>. Reviewing and unlocking inbound candidate applications is <strong className="text-white">100% free (0 credits)</strong> across all plans, and charter organizations keep permanent <strong className="text-amber-300">Founding Partner Status &amp; Verified Hiring Signals</strong>.
                </p>
              </div>
              <div className="shrink-0">
                <Link
                  href="/signup/employer"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-black transition-colors shadow-sm"
                >
                  Claim 30-Day Free Employer Trial →
                </Link>
              </div>
            </div>

            {/* 3 Employer Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Employer Tier 1: Starter ($99/mo) */}
              <div className="bg-white p-8 rounded-2xl border-2 border-slate-300 shadow-xs flex flex-col justify-between space-y-6 relative overflow-hidden border-slate-300">
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                  ★ First 30 Days $0
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">
                      Small Teams &amp; Focused Hiring
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                      Starter
                    </h3>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">$99</span>
                      <span className="text-xs font-bold text-slate-500">/ mo after 30-day free trial</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Built for small businesses and hiring managers filling 1 to 5 active roles at a time.
                  </p>
                  <ul className="space-y-2.5 pt-3 border-t border-slate-300 text-xs text-slate-700 font-medium">
                    <li className="flex items-start gap-2 text-amber-800 font-bold">
                      <span>★</span>
                      <span><strong>First 30 Days Free ($0)</strong> upon domain verification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Up to 5 Simultaneous Active Blind Roles</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>10 Outbound Talent Pitch Credits / month</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Unlimited Free Inbound Applicant Unlocks</strong> (0 credits)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>2 Team / BPO Collaborator Seats</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-amber-800 font-bold">
                      <span>★</span>
                      <span><strong>Permanent Founding Partner Status &amp; Trust Signals</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-400">
                      <span>✕</span>
                      <span>Workday &amp; Greenhouse ATS / Webhook Hub (Enterprise)</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/employer"
                  className="w-full py-3 bg-slate-900 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl text-center transition-colors shadow-sm"
                >
                  Start 30-Day Free Starter Trial →
                </Link>
              </div>

              {/* Employer Tier 2: Growth ($299/mo) */}
              <div className="bg-slate-900 text-white p-8 rounded-2xl border-2 border-indigo-500 shadow-lg flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                  ★ Most Popular • First 30 Days $0
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
                      Scaling &amp; Multi-Department Teams
                    </span>
                    <h3 className="text-2xl font-black text-white mt-0.5">
                      Growth
                    </h3>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white">$299</span>
                      <span className="text-xs font-bold text-slate-300">/ mo after 30-day free trial</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Designed for scaling companies actively sourcing passive talent across multiple departments.
                  </p>
                  <ul className="space-y-2.5 pt-3 border-t border-slate-800 text-xs text-slate-200 font-medium">
                    <li className="flex items-start gap-2 text-amber-300 font-bold">
                      <span>★</span>
                      <span><strong>First 30 Days Free ($0)</strong> upon domain verification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span><strong>Up to 15 Simultaneous Active Blind Roles</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span><strong>35 Outbound Talent Pitch Credits / month</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span><strong>Unlimited Free Inbound Applicant Unlocks</strong> (0 credits)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span><strong>Up to 5 Team &amp; Delegated W-2 BPO Partner Seats</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-amber-300 font-bold">
                      <span>★</span>
                      <span><strong>Permanent Founding Partner Status &amp; Trust Signals</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-500">
                      <span>✕</span>
                      <span>Workday &amp; Greenhouse ATS / Webhook Hub (Enterprise)</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/employer"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl text-center transition-colors shadow-sm"
                >
                  Start 30-Day Free Growth Trial →
                </Link>
              </div>

              {/* Employer Tier 3: Enterprise ($899/mo) */}
              <div className="bg-white p-8 rounded-2xl border-2 border-slate-300 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                  ★ ATS &amp; Webhook Hub • First 30 Days $0
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                      Enterprise, High-Volume &amp; ATS Connected
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                      Enterprise
                    </h3>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">$899</span>
                      <span className="text-xs font-bold text-slate-500">/ mo after 30-day free trial</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Built for high-velocity talent acquisition teams, multi-location enterprises, and W-2 RPOs requiring automated HRIS/ATS synchronization.
                  </p>
                  <ul className="space-y-2.5 pt-3 border-t border-slate-300 text-xs text-slate-700 font-medium">
                    <li className="flex items-start gap-2 text-amber-800 font-bold">
                      <span>★</span>
                      <span><strong>First 30 Days Free ($0)</strong> upon domain verification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Unlimited Simultaneous Active Blind Roles</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>100 Outbound Talent Pitch Credits / month</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-indigo-700 font-bold">
                      <span>⚡</span>
                      <span><strong>Workday &amp; Enterprise Outbound Webhook (HMAC-SHA256)</strong> — real-time signed <code>candidate.vault_released</code> JSON payloads (Workday, MuleSoft, Zapier, Ashby)</span>
                    </li>
                    <li className="flex items-start gap-2 text-indigo-700 font-bold">
                      <span>⚡</span>
                      <span><strong>Native Greenhouse Harvest API Connector</strong> — auto-syncs Stage 2 PDF resumes &amp; 5-Point AI Fit scorecards</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Unlimited Team &amp; Delegated W-2 BPO/RPO Seats</strong> + CSV Pipeline Export</span>
                    </li>
                    <li className="flex items-start gap-2 text-amber-800 font-bold">
                      <span>★</span>
                      <span><strong>Permanent Founding Partner Status &amp; Trust Signals</strong></span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/employer"
                  className="w-full py-3 bg-slate-900 hover:bg-indigo-600 text-white font-black text-xs rounded-xl text-center transition-colors shadow-sm"
                >
                  Start 30-Day Free Enterprise Trial →
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>

      <PublicFooter />
    </div>
  )
}
