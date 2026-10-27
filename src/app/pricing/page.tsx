import Link from "next/link"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"

export const metadata = {
  title: "Pricing, Plans & Founding Partner Rates | specialsauce.io",
  description:
    "Start with a 30-Day Free Trial ($0.00 Due Today) on any 100% ID-Verified Special Sauce Candidate plan ($3, $9, or $15/mo after) or Employer Founding Partner plan ($149, $499, or $1,250/mo after).",
}

export default function PricingMatrixPage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col justify-between">
      <div>
        <PublicHeader />

        {/* Hero Header */}
        <section className="py-10 sm:py-14 md:py-20 px-4 sm:px-6 md:px-12 max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs sm:text-sm font-extrabold uppercase tracking-wide">
            <span>★ 30-Day Free Trial ($0 Due Today) • 100% ID-Verified Talent Pool &amp; Founding Partner Rates</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Transparent Plans • 30-Day Free Trial ($0 Today)
          </h1>
          <p className="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed">
            Explore the marketplace and run <strong className="text-white">5-Point AI Fit Radar™ checks for free</strong>. Every plan includes a <strong className="text-emerald-300">30-Day Free Trial ($0.00 due today)</strong>—cancel anytime before Day 30.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto pt-3 text-left">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/40">
              <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-300 mb-1">For Candidates ($3 / $9 / $15 mo)</div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">Build your anonymous skill matrix free. Includes 1-time <strong className="text-white">Stripe Real-Person ID Verification</strong> &amp; permanent <strong className="text-amber-300">★ Founding Member</strong> badge.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/40">
              <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-300 mb-1">For Employers ($149 / $499 / $1,250 mo)</div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">Lock in <strong className="text-amber-300">12-Month Founding Partner Rates</strong> (up to 50% off retail) &amp; <strong className="text-white">100% Accepted-Only Pitch Protection</strong>.</p>
            </div>
          </div>

          {/* Frameless Operational Trust Strip — Matching Landing Page Vertical Hairlines */}
          <div className="pt-6 w-full max-w-5xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 lg:divide-x divide-slate-400 dark:divide-white/70 py-2">
              <div className="px-4 py-1.5 lg:py-0 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-[0.14em]">
                  100% US-Based Company
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  US-Owned &amp; Operated
                </span>
              </div>

              <div className="px-4 py-1.5 lg:py-0 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-[0.14em]">
                  100% US Human Support
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Zero Offshore Call Centers
                </span>
              </div>

              <div className="px-4 py-1.5 lg:py-0 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-[0.14em]">
                  Daily-Calibrated AI
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Tested Daily for Accuracy
                </span>
              </div>

              <div className="px-4 py-1.5 lg:py-0 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-[0.14em]">
                  2-Stage Privacy Vault
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Stripe ID &amp; DNS Verified
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Main 3x3 Matrix Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pb-20 sm:pb-24 space-y-14 sm:space-y-20">
          {/* ================================================================
              SECTION 1: CANDIDATE PLANS (Explorer $3 / Professional $9 / Prestige $15)
             ================================================================ */}
          <div className="rounded-3xl border-2 border-indigo-500/50 bg-slate-950 p-5 sm:p-8 md:p-10 shadow-xl space-y-8 relative overflow-hidden">
            {/* Top Unified Candidate Banner */}
            <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-700 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-amber-300 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                  <span>🛡️ 100% ID-Verified Marketplace • Zero Bots, Scams, or Ghost Jobs</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Start With a 30-Day Free Trial ($0.00 Due Today) on Any Candidate Plan
                </h2>
                <ul className="space-y-1.5 pt-1 text-sm sm:text-base text-slate-200">
                  <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">✓</span><span><strong className="text-white">Free Profile Seeding:</strong> Build your anonymous skill matrix and run 5-Point AI Fit checks at $0 upfront.</span></li>
                  <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">✓</span><span><strong className="text-emerald-300">Explorer ($3/mo after trial):</strong> Unlock 1-time Stripe ID Verification &amp; accept unlimited inbound employer pitches.</span></li>
                  <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">✓</span><span><strong className="text-amber-300">Professional ($9/mo) &amp; Prestige ($15/mo):</strong> Proactively submit protected applications + earn Founding Member status.</span></li>
                </ul>
              </div>
              <div className="shrink-0">
                <Link
                  href="/signup/candidate"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm sm:text-base font-extrabold transition-colors shadow-md"
                >
                  Start 30-Day Free Trial ($0 Today) →
                </Link>
              </div>
            </div>

            {/* 3 Candidate Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Tier 1: Explorer ($3/mo) */}
              <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl border-2 border-slate-700 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-bl-xl">
                  🛡️ ID-Verified Inbound Vault
                </div>
                <div className="space-y-5 pt-2">
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-emerald-400">
                      Passive &amp; Inbound Discovery
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                      Explorer
                    </h3>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white">$3</span>
                      <span className="text-sm font-bold text-slate-300">/ month</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold">
                      ✓ 30-Day Free Trial ($0 Today)
                    </div>
                  </div>
                  <p className="text-base text-slate-100 leading-relaxed">
                    Let verified employers come to you with unlimited inbound pitch unlocks.
                  </p>
                  <ul className="space-y-3 pt-4 border-t border-slate-800 text-sm sm:text-base text-slate-100">
                    <li className="flex items-start gap-2.5 text-emerald-300 font-bold">
                      <span className="shrink-0">🛡️</span>
                      <span><strong className="text-white">Includes Real-Person ID Verification</strong> &amp; Verified Candidate Shield</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Live Anonymous Talent Profile</strong> in Employer Search</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Unlock &amp; Accept Unlimited Inbound Pitches</strong> (Private Chat)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>Browse protected role feed &amp; run 5-Point AI Fit Radar checks</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-slate-300">
                      <span className="text-slate-400 font-bold shrink-0">✕</span>
                      <span>Proactive Outbound Applications (Upgrade to $9/mo or $15/mo anytime)</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/candidate?plan=explorer"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm sm:text-base rounded-xl text-center transition-colors shadow-md"
                >
                  Start 30-Day Free Trial ($0 Today • $3/mo After) →
                </Link>
              </div>

              {/* Tier 2: Professional ($9/mo) */}
              <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl border-2 border-amber-500/80 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-bl-xl">
                  🛡️ ID-Verified Active Tier
                </div>
                <div className="space-y-5 pt-2">
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-amber-400">
                      Targeted Job Seeker
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                      Professional
                    </h3>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white">$9</span>
                      <span className="text-sm font-bold text-slate-300">/ month</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold">
                      ✓ 30-Day Free Trial ($0 Today)
                    </div>
                  </div>
                  <p className="text-base text-slate-100 leading-relaxed">
                    Accept unlimited inbound pitches and apply directly to up to 15 roles per month.
                  </p>
                  <ul className="space-y-3 pt-4 border-t border-slate-800 text-sm sm:text-base text-slate-100">
                    <li className="flex items-start gap-2.5 text-emerald-300 font-bold">
                      <span className="shrink-0">🛡️</span>
                      <span><strong className="text-white">Includes Real-Person ID Verification</strong> &amp; Verified Candidate Shield</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Unlock &amp; Accept Unlimited Inbound Pitches</strong> (Private Chat)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">15 Outbound Protected Applications / mo</strong> (40%+ AI Fit)</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-amber-300 font-bold">
                      <span className="shrink-0">★</span>
                      <span><strong className="text-white">Verified Profile Distinctions</strong> (Vault-Ready &amp; Responsive Badges)</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-amber-300 font-bold">
                      <span className="shrink-0">★</span>
                      <span><strong className="text-white">Permanent Founding Member Status</strong> &amp; Badge</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>Elevated placement in Employer Talent Search</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/candidate?plan=professional"
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm sm:text-base rounded-xl text-center transition-colors shadow-md"
                >
                  Start 30-Day Free Trial ($0 Today • $9/mo After) →
                </Link>
              </div>

              {/* Tier 3: Prestige ($15/mo) */}
              <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl border-2 border-indigo-500 shadow-lg flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-bl-xl">
                  ★ Priority Spotlight &amp; Unlimited
                </div>
                <div className="space-y-5 pt-2">
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-indigo-300">
                      Unlimited &amp; Priority Reach
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                      Prestige
                    </h3>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white">$15</span>
                      <span className="text-sm font-bold text-slate-300">/ month</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold">
                      ✓ 30-Day Free Trial ($0 Today)
                    </div>
                  </div>
                  <p className="text-base text-slate-100 leading-relaxed">
                    Unlimited protected applications and Top-Priority Spotlight in Employer Search.
                  </p>
                  <ul className="space-y-3 pt-4 border-t border-slate-800 text-sm sm:text-base text-slate-100">
                    <li className="flex items-start gap-2.5 text-emerald-300 font-bold">
                      <span className="shrink-0">🛡️</span>
                      <span><strong className="text-white">Includes Real-Person ID Verification</strong> &amp; Verified Candidate Shield</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Unlimited Outbound Protected Applications</strong> (40%+ AI Fit)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Unlock &amp; Accept Unlimited Inbound Pitches</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5 text-amber-300 font-bold">
                      <span className="shrink-0">★</span>
                      <span><strong className="text-white">Top-Priority Placement</strong> in Employer Talent Search</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-amber-300 font-bold">
                      <span className="shrink-0">★</span>
                      <span><strong className="text-white">Verified Profile Distinctions</strong> &amp; Priority Shortlist Placement</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>Switch or downgrade to Professional or Explorer anytime</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/candidate?plan=prestige"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm sm:text-base rounded-xl text-center transition-colors shadow-md"
                >
                  Start 30-Day Free Trial ($0 Today • $15/mo After) →
                </Link>
              </div>
            </div>
          </div>

          {/* ================================================================
              SECTION 2: EMPLOYER PLANS (Starter $149 / Growth $499 / Enterprise $1,250)
             ================================================================ */}
          <div className="rounded-3xl border-2 border-emerald-500/50 bg-slate-950 p-5 sm:p-8 md:p-10 shadow-xl space-y-8 relative overflow-hidden">
            {/* Top Unified Employer Launch Banner */}
            <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-700 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-amber-300 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                  <span>★ 12-Month Employer Founding Partner Rate Lock (First 100 Verified Organizations)</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  30-Day Free Trial ($0.00 Today) + Up to 50% Off Retail for Your First 12 Months
                </h2>
                <ul className="space-y-1.5 pt-1 text-sm sm:text-base text-slate-200">
                  <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">✓</span><span><strong className="text-amber-300">12-Month Rate Lock:</strong> Lock in $149 / $499 / $1,250 per month for your first 12 months (standard retail applies Month 13).</span></li>
                  <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">✓</span><span><strong className="text-white">Free Inbound Applicants:</strong> Reviewing and unlocking candidates who apply to your roles is 100% free (0 credits).</span></li>
                  <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">✓</span><span><strong className="text-emerald-300">Accepted-Only Pitch Guarantee:</strong> You only spend a credit when a candidate accepts—declined pitches are auto-refunded.</span></li>
                </ul>
              </div>
              <div className="shrink-0">
                <Link
                  href="/signup/employer"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm sm:text-base font-extrabold transition-colors shadow-md"
                >
                  Start 30-Day Free Trial ($0 Today) →
                </Link>
              </div>
            </div>

            {/* 3 Employer Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Employer Tier 1: Starter ($149 Founding / $299 Retail) */}
              <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl border-2 border-slate-700 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-bl-xl">
                  ★ 12-Mo Founding Rate (-50%)
                </div>
                <div className="space-y-5 pt-2">
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-indigo-400">
                      Small Teams &amp; Focused Hiring
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                      Starter
                    </h3>
                    <div className="mt-3 flex flex-wrap items-baseline gap-2">
                      <span className="text-lg font-bold text-slate-400 line-through">$299</span>
                      <span className="text-4xl font-black text-white">$149</span>
                      <span className="text-xs sm:text-sm font-bold text-amber-300">/ mo (Locked 12 Mos)</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold">
                      ✓ 30-Day Free Trial ($0 Today)
                    </div>
                  </div>
                  <p className="text-base text-slate-100 leading-relaxed">
                    For small teams filling 1 to 5 active roles at a time.
                  </p>
                  <ul className="space-y-3 pt-4 border-t border-slate-800 text-sm sm:text-base text-slate-100">
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Up to 5 Simultaneous Active Protected Roles</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5 text-amber-300 font-bold">
                      <span className="shrink-0">★</span>
                      <span><strong className="text-white">$149/mo Locked for First 12 Months</strong> ($299/mo standard retail starting Month 13)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">10 Outbound Talent Pitch Credits / month</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5 text-emerald-300 font-bold">
                      <span className="shrink-0">🛡️</span>
                      <span><strong className="text-white">100% Accepted-Only Pitch Credit Protection</strong> (Declined pitches are auto-refunded)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Unlimited Free Inbound Applicant Unlocks</strong> (0 credits)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">2 Team or Recruiter Seats</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5 text-amber-300 font-bold">
                      <span className="shrink-0">★</span>
                      <span><strong className="text-white">Permanent Founding Partner Status &amp; Distinctions</strong></span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/employer?plan=starter"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm sm:text-base rounded-xl text-center transition-colors shadow-md"
                >
                  Start 30-Day Free Trial ($0 Today • $149/mo After) →
                </Link>
              </div>

              {/* Employer Tier 2: Growth ($499 Founding / $799 Retail) */}
              <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl border-2 border-indigo-500 shadow-lg flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-bl-xl">
                  ★ Most Popular • 12-Mo Rate Lock
                </div>
                <div className="space-y-5 pt-2">
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-indigo-300">
                      Scaling &amp; Multi-Department Teams
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                      Growth
                    </h3>
                    <div className="mt-3 flex flex-wrap items-baseline gap-2">
                      <span className="text-lg font-bold text-slate-400 line-through">$799</span>
                      <span className="text-4xl font-black text-white">$499</span>
                      <span className="text-xs sm:text-sm font-bold text-amber-300">/ mo (Locked 12 Mos)</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold">
                      ✓ 30-Day Free Trial ($0 Today)
                    </div>
                  </div>
                  <p className="text-base text-slate-100 leading-relaxed">
                    For scaling teams sourcing verified talent across multiple departments.
                  </p>
                  <ul className="space-y-3 pt-4 border-t border-slate-800 text-sm sm:text-base text-slate-100">
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Up to 15 Simultaneous Active Protected Roles</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5 text-amber-300 font-bold">
                      <span className="shrink-0">★</span>
                      <span><strong className="text-white">$499/mo Locked for First 12 Months</strong> ($799/mo standard retail starting Month 13)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">35 Outbound Talent Pitch Credits / month</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5 text-emerald-300 font-bold">
                      <span className="shrink-0">🛡️</span>
                      <span><strong className="text-white">100% Accepted-Only Pitch Credit Protection</strong> (Declined pitches are auto-refunded)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Unlimited Free Inbound Applicant Unlocks</strong> (0 credits)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Up to 5 Team &amp; External Recruiter Seats</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5 text-amber-300 font-bold">
                      <span className="shrink-0">★</span>
                      <span><strong className="text-white">Permanent Founding Partner Status &amp; Distinctions</strong></span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/employer?plan=growth"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm sm:text-base rounded-xl text-center transition-colors shadow-md"
                >
                  Start 30-Day Free Trial ($0 Today • $499/mo After) →
                </Link>
              </div>

              {/* Employer Tier 3: Enterprise ($1,250 Founding / $1,999 Retail) */}
              <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl border-2 border-emerald-500/80 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-bl-xl">
                  ★ HR Software Sync • 12-Mo Lock
                </div>
                <div className="space-y-5 pt-2">
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-emerald-400">
                      Enterprise, High-Volume &amp; ATS Connected
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                      Enterprise
                    </h3>
                    <div className="mt-3 flex flex-wrap items-baseline gap-2">
                      <span className="text-lg font-bold text-slate-400 line-through">$1,999</span>
                      <span className="text-4xl font-black text-white">$1,250</span>
                      <span className="text-xs sm:text-sm font-bold text-amber-300">/ mo (Locked 12 Mos)</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold">
                      ✓ 30-Day Free Trial ($0 Today)
                    </div>
                  </div>
                  <p className="text-base text-slate-100 leading-relaxed">
                    For high-volume hiring teams and agencies with automated HR/ATS sync.
                  </p>
                  <ul className="space-y-3 pt-4 border-t border-slate-800 text-sm sm:text-base text-slate-100">
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Unlimited Simultaneous Active Protected Roles</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5 text-amber-300 font-bold">
                      <span className="shrink-0">★</span>
                      <span><strong className="text-white">$1,250/mo Locked for First 12 Months</strong> ($1,999/mo standard retail starting Month 13)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">120 Outbound Talent Pitch Credits / month</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5 text-emerald-300 font-bold">
                      <span className="shrink-0">🛡️</span>
                      <span><strong className="text-white">100% Accepted-Only Pitch Credit Protection</strong> (Declined pitches are auto-refunded)</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-indigo-300 font-bold">
                      <span className="shrink-0">⚡</span>
                      <span><strong className="text-white">Workday &amp; Enterprise Outbound Webhook (HMAC-SHA256)</strong> — real-time signed JSON payloads</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-indigo-300 font-bold">
                      <span className="shrink-0">⚡</span>
                      <span><strong className="text-white">Native Greenhouse HR Software Connector</strong> — auto-syncs unlocked PDF resumes &amp; AI Fit scorecards</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Unlimited Team &amp; BPO/RPO Recruiter Seats</strong> + CSV Export</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/employer?plan=enterprise"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm sm:text-base rounded-xl text-center transition-colors shadow-md"
                >
                  Start 30-Day Free Trial ($0 Today • $1,250/mo After) →
                </Link>
              </div>
            </div>

            {/* ================================================================
                ON-DEMAND ROLLOVER PITCH CREDIT TOP-UP PACKS ($150 / $350 / $900)
               ================================================================ */}
            <div className="pt-6 border-t border-slate-800 space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-slate-700">
                <div className="space-y-2 max-w-3xl">
                  <div className="inline-flex items-center gap-2 text-amber-300 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                    <span>⚡ Two-Bucket Rollover Credit System • Active Subscribers Only</span>
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    Need Extra Outbound Reach During a Hiring Surge?
                  </h3>
                  <p className="text-base text-slate-100 leading-relaxed">
                    Active <strong className="text-white">Starter, Growth, and Enterprise</strong> subscribers can add on-demand Pitch Credit packs anytime. We use a <strong className="text-amber-300">Monthly-First Depletion Rule</strong>: your monthly plan allowance is always spent first, and purchased Top-Up Credits <strong className="text-emerald-300">roll over month-to-month and never expire</strong> while your subscription is active.
                  </p>
                </div>
                <div className="shrink-0 flex flex-col gap-2 text-xs sm:text-sm font-extrabold text-slate-100 bg-slate-950 px-5 py-4 rounded-xl border border-slate-700">
                  <span className="flex items-center gap-2 text-emerald-300">
                    ✓ Bucket 1: Monthly Plan Credits (Used 1st)
                  </span>
                  <span className="flex items-center gap-2 text-amber-300">
                    ✓ Bucket 2: Top-Up Credits (100% Rollover)
                  </span>
                  <span className="flex items-center gap-2 text-sky-300">
                    🛡️ Declined Pitches Are Auto-Refunded (+1 Credit)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pack 1: Boost Pack ($150) */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700 shadow-md flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                        ⚡ Boost Pack
                      </span>
                      <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-100 text-xs font-extrabold border border-slate-600">
                        $15.00 / pitch
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <h4 className="text-xl sm:text-2xl font-black text-white">
                        +10 Pitch Credits
                      </h4>
                      <span className="text-3xl font-black text-white">$150</span>
                    </div>
                    <p className="text-base text-slate-100 leading-relaxed">
                      Ideal when your team is 2–3 outbound pitches away from rounding out a final interview slate this month.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs sm:text-sm font-bold text-emerald-300">
                    <span>✓ Non-expiring rollover</span>
                    <span className="text-slate-300">One-time top-up</span>
                  </div>
                </div>

                {/* Pack 2: Surge Pack ($350) */}
                <div className="bg-slate-900 rounded-2xl p-6 border-2 border-indigo-500 shadow-md flex flex-col justify-between space-y-4 relative overflow-hidden">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
                        🚀 Surge Pack • Most Popular
                      </span>
                      <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-extrabold border border-indigo-400/40">
                        $14.00 / pitch
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <h4 className="text-xl sm:text-2xl font-black text-white">
                        +25 Pitch Credits
                      </h4>
                      <span className="text-3xl font-black text-white">$350</span>
                    </div>
                    <p className="text-base text-slate-100 leading-relaxed">
                      Built for hiring managers actively sourcing passive candidates across 2 to 4 concurrent role openings.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs sm:text-sm font-bold text-indigo-300">
                    <span>✓ Non-expiring rollover</span>
                    <span>Most Popular Top-Up</span>
                  </div>
                </div>

                {/* Pack 3: Scale Pack ($900) */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700 shadow-md flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                        🏢 Scale Pack • Best Value
                      </span>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-extrabold border border-emerald-400/40">
                        $12.00 / pitch
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <h4 className="text-xl sm:text-2xl font-black text-white">
                        +75 Pitch Credits
                      </h4>
                      <span className="text-3xl font-black text-white">$900</span>
                    </div>
                    <p className="text-base text-slate-100 leading-relaxed">
                      Maximum volume discount for multi-department recruiting pushes and quarterly talent acquisition sprints.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs sm:text-sm font-bold text-emerald-300">
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
