import Link from "next/link"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"

export const metadata = {
  title: "Pricing, Plans & Founding Partner Rates | specialsauce.io",
  description:
    "Compare Special Sauce Candidate plans (Free Explorer Vault, ID-Verified Professional $9/mo & Prestige $15/mo) and Employer plans (Starter $149/mo, Growth $499/mo, Enterprise $1,250/mo Founding Partner Rates).",
}

export default function PricingMatrixPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col justify-between">
      <div>
        <PublicHeader />

        {/* Hero Header */}
        <section className="py-14 md:py-20 px-6 md:px-12 max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold uppercase tracking-wide">
            <span>★ Founding Launch Window • Free Candidate Explorer Vault &amp; Founding Partner Rates</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Transparent Plans &amp; Verified Signals
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Candidates build their anonymous career vault on <strong className="text-slate-900">Explorer for $0 forever</strong> and only upgrade + verify identity when ready to apply or accept a pitch. Employers lock in <strong className="text-slate-900">Founding Partner Launch Rates</strong> backed by 100% Accepted-Only Credit Protection.
          </p>
        </section>

        {/* Main 3x3 Matrix Container */}
        <main className="max-w-7xl mx-auto px-6 md:px-12 pb-24 space-y-20">
          {/* ================================================================
              SECTION 1: CANDIDATE PLANS (Explorer $0 / Professional $9 / Prestige $15)
             ================================================================ */}
          <div className="rounded-3xl border-2 border-slate-300 bg-gradient-to-b from-amber-50/60 via-white to-white p-6 sm:p-10 shadow-md space-y-8 relative overflow-hidden">
            {/* Top Unified Candidate Banner */}
            <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-7 border border-slate-300/60 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
                  <span>🛡️ Zero-Friction Onboarding • Pay &amp; Verify Only When Ready</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Start Free on Explorer + Upgrade to Apply or Unlock Pitches
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                  Create your anonymous profile, browse verified salary bands, and run unlimited 5-Point AI Fit checks for <strong className="text-emerald-300">$0 forever on Explorer</strong>. When you spot a role you want to apply for—or a verified employer sends you an outbound pitch—upgrade to <strong className="text-white">Professional ($9/mo)</strong> or <strong className="text-white">Prestige ($15/mo)</strong> and complete 1-time <strong className="text-amber-300">Biometric ID Verification</strong> to unlock full Stage 1/2 engagement.
                </p>
              </div>
              <div className="shrink-0">
                <Link
                  href="/signup/candidate"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-black transition-colors shadow-sm"
                >
                  Create Free Explorer Vault →
                </Link>
              </div>
            </div>

            {/* 3 Candidate Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Tier 1: Explorer ($0) */}
              <div className="bg-white p-8 rounded-2xl border-2 border-slate-300 shadow-xs flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
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
                    Ideal when you&apos;re exploring privately. Build your anonymous profile, test AI role fit, and receive pitch notifications from verified employers before deciding to upgrade.
                  </p>
                  <ul className="space-y-2.5 pt-3 border-t border-slate-300 text-xs text-slate-700 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Live Anonymous Talent Profile</strong> in Employer Search</span>
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
                      <span>Receive real-time <strong>Inbound Employer Pitch Alerts</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-amber-800 font-bold">
                      <span>★</span>
                      <span>Prompted to upgrade &amp; verify ID only when ready to open a pitch or apply</span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-400">
                      <span>✕</span>
                      <span>Outbound Blind Applications &amp; Pitch Unlocks (Requires Professional or Prestige + ID Verification)</span>
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

              {/* Tier 2: Professional ($9/mo) */}
              <div className="bg-white p-8 rounded-2xl border-2 border-slate-300 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                  🛡️ ID-Verified Active Tier
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
                      <span className="text-xs font-bold text-slate-500">/ month</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Built for selective professionals ready to unlock inbound employer pitches, complete biometric ID verification, and submit targeted blind applications.
                  </p>
                  <ul className="space-y-2.5 pt-3 border-t border-slate-300 text-xs text-slate-700 font-medium">
                    <li className="flex items-start gap-2 text-emerald-700 font-bold">
                      <span>🛡️</span>
                      <span><strong>Includes Biometric ID Verification</strong> &amp; Verified Candidate Shield</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Unlock &amp; Accept Unlimited Inbound Employer Pitches</strong> (Stage 1/2 Chat)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>15 Outbound Blind Applications / month</strong> (70%+ AI Fit)</span>
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
                      <span>Elevated placement in Employer Talent Search</span>
                    </li>
                  </ul>
                </div>
                <Link
                      href="/signup/candidate?plan=professional"
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl text-center transition-colors shadow-sm"
                    >
                      Choose Professional ($9/mo) →
                    </Link>
              </div>

              {/* Tier 3: Prestige ($15/mo) */}
              <div className="bg-slate-900 text-white p-8 rounded-2xl border-2 border-indigo-500 shadow-lg flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                  ★ Priority Spotlight &amp; Unlimited
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
                      <span className="text-xs font-bold text-slate-300">/ month</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Maximum visibility and zero application caps for active, ID-verified professionals ready to transition fast.
                  </p>
                  <ul className="space-y-2.5 pt-3 border-t border-slate-800 text-xs text-slate-200 font-medium">
                    <li className="flex items-start gap-2 text-emerald-300 font-bold">
                      <span>🛡️</span>
                      <span><strong>Includes Biometric ID Verification</strong> &amp; Verified Candidate Shield</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span><strong>Unlimited Outbound Blind Applications</strong> (70%+ AI Fit)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span><strong>Unlock &amp; Accept Unlimited Inbound Employer Pitches</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-amber-300 font-bold">
                      <span>★</span>
                      <span><strong>Top-Priority Placement</strong> in Employer Talent Search</span>
                    </li>
                    <li className="flex items-start gap-2 text-amber-300 font-bold">
                      <span>★</span>
                      <span><strong>Verified Behavioral Trust Signals</strong> &amp; Priority Shortlist Placement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Switch or downgrade to Professional or Explorer anytime</span>
                    </li>
                  </ul>
                </div>
                <Link
                      href="/signup/candidate?plan=prestige"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl text-center transition-colors shadow-sm"
                    >
                      Choose Prestige (w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl text-center transition-colors shadow-sm5/mo) →
                    </Link>
              </div>
            </div>
          </div>

          {/* ================================================================
              SECTION 2: EMPLOYER PLANS (Starter $149 / Growth $499 / Enterprise $1,250)
             ================================================================ */}
          <div className="rounded-3xl border-2 border-slate-300 bg-gradient-to-b from-indigo-50/50 via-white to-white p-6 sm:p-10 shadow-md space-y-8 relative overflow-hidden">
            {/* Top Unified Employer Launch Banner */}
            <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-7 border border-slate-300/60 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
                  <span>★ 12-Month Employer Founding Partner Rate Lock (First 100 Verified Organizations)</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Lock In Up to 50% Off Retail Pricing for Your First 12 Months
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                  Verify your corporate domain during our launch window to lock in <strong className="text-amber-300">Founding Partner Rates ($149 / $499 / $1,250 per month) for your first 12 full months</strong> before standard retail pricing ($299 / $799 / $1,999) applies. Reviewing and unlocking inbound candidate applications is <strong className="text-white">100% free (0 credits)</strong>, and every outbound pitch is backed by our <strong className="text-emerald-300">Accepted-Only Guarantee (declined pitches auto-refunded)</strong>.
                </p>
              </div>
              <div className="shrink-0">
                <Link
                  href="/signup/employer"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-black transition-colors shadow-sm"
                >
                  Lock In 12-Month Founding Rate →
                </Link>
              </div>
            </div>

            {/* 3 Employer Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Employer Tier 1: Starter ($149 Founding / $299 Retail) */}
              <div className="bg-white p-8 rounded-2xl border-2 border-slate-300 shadow-xs flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                  ★ 12-Mo Founding Rate (-50%)
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
                      <span className="text-lg font-bold text-slate-400 line-through">$299</span>
                      <span className="text-3xl font-black text-slate-900">$149</span>
                      <span className="text-xs font-bold text-amber-700">/ mo Founding Rate (Locked 12 Mos)</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Built for small businesses and hiring managers filling 1 to 5 active roles at a time—for less than the cost of a single promoted job slot.
                  </p>
                  <ul className="space-y-2.5 pt-3 border-t border-slate-300 text-xs text-slate-700 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Up to 5 Simultaneous Active Blind Roles</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-amber-800 font-bold">
                      <span>★</span>
                      <span><strong>$149/mo Locked for First 12 Months</strong> ($299/mo standard retail after Month 12)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>10 Outbound Talent Pitch Credits / month</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-emerald-700 font-bold">
                      <span>🛡️</span>
                      <span><strong>100% Accepted-Only Credit Protection</strong> (Declined pitches auto-refunded)</span>
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
                      href="/signup/employer?plan=starter"
                      className="w-full py-3 bg-slate-900 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl text-center transition-colors shadow-sm"
                    >
                      Get Started with Starter (w-full py-3 bg-slate-900 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl text-center transition-colors shadow-sm49/mo) →
                    </Link>
              </div>

              {/* Employer Tier 2: Growth ($499 Founding / $799 Retail) */}
              <div className="bg-slate-900 text-white p-8 rounded-2xl border-2 border-indigo-500 shadow-lg flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                  ★ Most Popular • 12-Mo Rate Lock
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
                      <span className="text-lg font-bold text-slate-400 line-through">$799</span>
                      <span className="text-3xl font-black text-white">$499</span>
                      <span className="text-xs font-bold text-amber-300">/ mo Founding Rate (Locked 12 Mos)</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Designed for scaling companies actively sourcing biometric ID-verified talent across multiple departments.
                  </p>
                  <ul className="space-y-2.5 pt-3 border-t border-slate-800 text-xs text-slate-200 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span><strong>Up to 15 Simultaneous Active Blind Roles</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-amber-300 font-bold">
                      <span>★</span>
                      <span><strong>$499/mo Locked for First 12 Months</strong> ($799/mo standard retail after Month 12)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span><strong>35 Outbound Talent Pitch Credits / month</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-emerald-300 font-bold">
                      <span>🛡️</span>
                      <span><strong>100% Accepted-Only Credit Protection</strong> (Declined pitches auto-refunded)</span>
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
                      href="/signup/employer?plan=growth"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl text-center transition-colors shadow-sm"
                    >
                      Get Started with Growth ($499/mo) →
                    </Link>
              </div>

              {/* Employer Tier 3: Enterprise ($1,250 Founding / $1,999 Retail) */}
              <div className="bg-white p-8 rounded-2xl border-2 border-slate-300 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                  ★ ATS &amp; Webhook Hub • 12-Mo Rate Lock
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
                      <span className="text-lg font-bold text-slate-400 line-through">$1,999</span>
                      <span className="text-3xl font-black text-slate-900">$1,250</span>
                      <span className="text-xs font-bold text-amber-700">/ mo Founding Rate (Locked 12 Mos)</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Built for high-velocity talent acquisition teams, multi-location enterprises, and W-2 RPOs requiring automated HRIS/ATS synchronization.
                  </p>
                  <ul className="space-y-2.5 pt-3 border-t border-slate-300 text-xs text-slate-700 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Unlimited Simultaneous Active Blind Roles</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-amber-800 font-bold">
                      <span>★</span>
                      <span><strong>$1,250/mo Locked for First 12 Months</strong> ($1,999/mo standard retail after Month 12)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>120 Outbound Talent Pitch Credits / month</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-emerald-700 font-bold">
                      <span>🛡️</span>
                      <span><strong>100% Accepted-Only Credit Protection</strong> (Declined pitches auto-refunded)</span>
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
                      href="/signup/employer?plan=enterprise"
                      className="w-full py-3 bg-slate-900 hover:bg-indigo-600 text-white font-black text-xs rounded-xl text-center transition-colors shadow-sm"
                    >
                      Get Started with Enterprise (w-full py-3 bg-slate-900 hover:bg-indigo-600 text-white font-black text-xs rounded-xl text-center transition-colors shadow-sm,250/mo) →
                    </Link>
              </div>
            </div>

            {/* ================================================================
                ON-DEMAND ROLLOVER PITCH CREDIT TOP-UP PACKS (Two-Bucket System)
               ================================================================ */}
            <div className="pt-6 border-t-2 border-slate-200 space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-700">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="inline-flex items-center gap-2 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider">
                    <span>⚡ Two-Bucket Rollover Credit System • Active Subscribers Only</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Need Extra Outbound Reach During a Hiring Surge?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Active <strong className="text-white">Starter, Growth, and Enterprise</strong> subscribers can add on-demand Pitch Credit packs anytime. We use a <strong className="text-amber-300">Monthly-First Depletion Rule</strong>: your monthly plan allowance is always spent first, and purchased Top-Up Credits <strong className="text-emerald-300">roll over month-to-month and never expire</strong> while your subscription is active.
                  </p>
                </div>
                <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2 text-[11px] font-extrabold text-slate-200 bg-slate-800/90 px-4 py-3 rounded-xl border border-slate-700">
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    ✓ Bucket 1: Monthly Plan Credits (Used 1st)
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-300">
                    ✓ Bucket 2: Top-Up Credits (100% Rollover)
                  </span>
                  <span className="flex items-center gap-1.5 text-sky-300">
                    🛡️ Declined Pitches Auto-Refunded (+1 Credit)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pack 1: Boost Pack */}
                <div className="bg-white rounded-2xl p-6 border-2 border-slate-300 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        ⚡ Boost Pack
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-extrabold border border-slate-300">
                        $15.00 / pitch
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <h4 className="text-xl font-black text-slate-900">
                        +10 Pitch Credits
                      </h4>
                      <span className="text-2xl font-black text-slate-900">$150</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Ideal when your team is 2–3 outbound pitches away from rounding out a final interview slate this month.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>✓ Non-expiring rollover</span>
                    <span>One-time top-up</span>
                  </div>
                </div>

                {/* Pack 2: Surge Pack */}
                <div className="bg-white rounded-2xl p-6 border-2 border-indigo-500 shadow-sm flex flex-col justify-between space-y-4 relative overflow-hidden">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600">
                        🚀 Surge Pack • Save 13%
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-extrabold border border-indigo-200">
                        $13.00 / pitch
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <h4 className="text-xl font-black text-slate-900">
                        +25 Pitch Credits
                      </h4>
                      <span className="text-2xl font-black text-slate-900">$325</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Built for hiring managers actively sourcing passive candidates across 2 to 4 concurrent role openings.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] font-bold text-indigo-700">
                    <span>✓ Non-expiring rollover</span>
                    <span>Most Popular Top-Up</span>
                  </div>
                </div>

                {/* Pack 3: Scale Pack */}
                <div className="bg-white rounded-2xl p-6 border-2 border-slate-300 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                        🏢 Scale Pack • Save 27%
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-extrabold border border-emerald-200">
                        $11.00 / pitch
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <h4 className="text-xl font-black text-slate-900">
                        +75 Pitch Credits
                      </h4>
                      <span className="text-2xl font-black text-slate-900">$825</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Maximum volume discount for multi-department recruiting pushes and quarterly talent acquisition sprints.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] font-bold text-emerald-700">
                    <span>✓ Non-expiring rollover</span>
                    <span>Best Value Per Pitch</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <PublicFooter />
    </div>
  )
}
