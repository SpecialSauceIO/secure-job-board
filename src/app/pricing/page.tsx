import Link from "next/link"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"

export const metadata = {
  alternates: { canonical: "/pricing" },
  title: "Pricing & Plans",
  description:
    "Verify once ($25 Employer Verification Pass with $0/mo Practice Mode / $5 Professional Explorer Mode), or activate Employer Base Memberships ($299, $599, or $999/mo with 2, 5, or 15 Active Protected Roles included) and Professional plans ($12 or $19/mo) when ready.",
}

export default function PricingMatrixPage() {
  return (
    <div className="min-h-screen w-full overflow-x-clip bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col justify-between">
      <PublicHeader />
      <div className="flex-1">

        {/* Hero Header */}
        <section className="relative overflow-hidden bg-[#0f172a] border-b border-slate-800 py-14 sm:py-18 md:py-24 mb-12 sm:mb-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -left-24 w-[36rem] h-[36rem] rounded-full bg-sky-500/10 blur-3xl z-0"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute inset-0 overflow-hidden z-0"
          >
            <div className="absolute top-1/2 right-[-6%] -translate-y-1/2 w-[42rem] h-[42rem] rounded-full bg-gradient-to-tr from-[#0077D4]/25 via-sky-500/15 to-[#EA580C]/15 blur-3xl" />

            <div
              className="absolute inset-0"
              style={{
                WebkitMaskImage:
                  'linear-gradient(to right, transparent 0%, transparent 46%, rgba(0,0,0,0.22) 60%, rgba(0,0,0,0.78) 76%, rgba(0,0,0,0.96) 92%)',
                maskImage:
                  'linear-gradient(to right, transparent 0%, transparent 46%, rgba(0,0,0,0.22) 60%, rgba(0,0,0,0.78) 76%, rgba(0,0,0,0.96) 92%)',
              }}
            >
              <div
                className="absolute -top-[2%] sm:-top-[5%] lg:-top-[8%] right-[-18%] sm:right-[-8%] lg:right-[-1%] w-[920px] sm:w-[1120px] lg:w-[1260px] opacity-85"
                style={{
                  transform:
                    'perspective(1350px) rotateY(-34deg) rotateX(12deg) rotateZ(-4deg) scale(1.06)',
                  transformOrigin: 'center right',
                }}
              >
                <div className="rounded-2xl border border-amber-400/25 bg-[#0a0f1c] p-2 shadow-[0_35px_90px_rgba(0,0,0,0.9)]">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-white/10 rounded-t-xl">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                    </div>
                    <span className="text-[11px] font-mono text-amber-400 tracking-wider">
                      specialsauce.io • Verified Pay Bands &amp; Roles
                    </span>
                  </div>
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-b-xl bg-[#0a0f1c]">
                    <img
                      src="/media/ui-card-employer-roles.webp"
                      alt=""
                      className="w-full h-full object-cover object-left-top"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0f172a] to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/90 to-transparent" />
          </div>

          <div className="relative z-10 px-4 sm:px-6 md:px-12 max-w-5xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/35 text-amber-300 text-xs sm:text-sm font-extrabold uppercase tracking-wide backdrop-blur-xs">
              <span>★ Simple, Transparent Pricing • No Long-Term Contracts</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-xs">
              Verify Once •{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] to-[#0077D4]">
                Match Forever Free
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Verify once for <strong className="text-emerald-400">$0/mo Practice Mode</strong> (Employers) or <strong className="text-emerald-400">$0/mo Explorer Mode</strong> (Professionals). Preview matches first—subscribe only when ready.
            </p>

            {/* Split-Screen Onboarding Callout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto pt-3 text-left">
              <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 shadow-lg flex flex-col justify-between space-y-3">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">For Employers</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[11px] font-black text-emerald-300">$25 Once</span>
                  </div>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-slate-200">
                    <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span><span>Domain, EIN &amp; Admin ID check</span></li>
                    <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span><span><strong className="text-emerald-300">$0/mo Practice Mode</strong> — draft roles &amp; preview matches</span></li>
                    <li className="flex items-center gap-2"><span className="text-amber-400 font-bold">★</span><span><strong className="text-amber-300">100% credited</strong> toward Month 1</span></li>
                  </ul>
                </div>
                <div className="pt-2.5 border-t border-slate-800/80">
                  <a
                    href="#employers"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-emerald-300 hover:text-emerald-200 transition-colors"
                  >
                    View Employer Plans ($299–$999/mo) ↓
                  </a>
                </div>
              </div>
              <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-indigo-500/40 shadow-lg flex flex-col justify-between space-y-3">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">For Professionals</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-[11px] font-black text-indigo-300">$5 Once</span>
                  </div>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-slate-200">
                    <li className="flex items-center gap-2"><span className="text-indigo-400 font-bold">✓</span><span>60-second Stripe ID check</span></li>
                    <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span><span><strong className="text-emerald-300">$0/mo forever</strong> — unlimited employer invitations</span></li>
                    <li className="flex items-center gap-2"><span className="text-amber-400 font-bold">★</span><span><strong className="text-amber-300">100% credited</strong> toward Month 1</span></li>
                  </ul>
                </div>
                <div className="pt-2.5 border-t border-slate-800/80">
                  <a
                    href="#professionals"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-indigo-300 hover:text-indigo-200 transition-colors"
                  >
                    View Professional Plans ($0–$19/mo) ↓
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main 3x3 Matrix Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pb-20 sm:pb-24 space-y-14 sm:space-y-20">
          {/* ================================================================
              SECTION 1: EMPLOYER PLANS
             ================================================================ */}
          <div id="employers" className="scroll-mt-28 rounded-3xl border-2 border-emerald-500/50 bg-slate-950 p-5 sm:p-8 md:p-10 shadow-xl space-y-8 relative overflow-hidden">
            <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-700 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-amber-300 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                  <span>★ Employer Base Memberships • 2, 5, or 15 Active Protected Roles Included</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Verify Your Organization for $25 • Preview Matches Free
                </h2>
                <div className="flex flex-wrap gap-2 pt-1 text-xs font-bold">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">✓ Verified Pros Apply Unlimited at $0</span>
                  <span className="px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300">✓ Free Bridge Checks Included/Role</span>
                  <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">✓ Declined Invitations Auto-Refund</span>
                </div>
              </div>
              <div className="shrink-0">
                <Link
                  href="/signup/employer"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm sm:text-base font-extrabold transition-colors shadow-md"
                >
                  Verify Organization ($25) →
                </Link>
              </div>
            </div>

            {/* 3 Employer Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Starter ($299) */}
              <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl border-2 border-slate-700 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-bl-xl">
                  ★ 2 Active Roles Included
                </div>
                <div className="space-y-5 pt-2">
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-indigo-400">
                      Base Membership
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                      Starter
                    </h3>
                    <div className="mt-3 flex flex-wrap items-baseline gap-2">
                      <span className="text-4xl font-black text-white">$299</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-300">/ month</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold">
                      ✓ $25 ID Check Credited Toward Month 1
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-slate-300">
                    For lean teams hiring 1–2 roles at a time.
                  </p>
                  <ul className="space-y-2.5 pt-4 border-t border-slate-800 text-sm sm:text-base text-slate-100">
                    <li className="flex items-start gap-2.5 text-amber-300 font-bold">
                      <span className="shrink-0">★</span>
                      <span><strong className="text-white">2 Active Protected Roles</strong> (25 Bridge checks/role)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">10 Invitations / mo</strong> (Accepted-Only Guarantee)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Verified Hiring Bridge</strong> links • <Link href="/hiring-bridge" className="text-emerald-300 underline hover:text-emerald-200 font-bold">Details →</Link></span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Built-In W-2 Payroll</strong> ($0 conversion) • <Link href="/w2-hiring" className="text-emerald-300 underline hover:text-emerald-200 font-bold">4 Paths →</Link></span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">2 Team Seats</strong> + Founding Partner Badge</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">+$199 Extra Role Slots</strong> anytime</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/employer?plan=starter"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm sm:text-base rounded-xl text-center transition-colors shadow-md"
                >
                  Select Starter ($299/mo) →
                </Link>
              </div>

              {/* Growth ($599) */}
              <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl border-2 border-indigo-500 shadow-lg flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-bl-xl">
                  ★ Most Popular • 5 Active Roles
                </div>
                <div className="space-y-5 pt-2">
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-indigo-300">
                      Growing Companies
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                      Growth
                    </h3>
                    <div className="mt-3 flex flex-wrap items-baseline gap-2">
                      <span className="text-4xl font-black text-white">$599</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-300">/ month</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold">
                      ✓ $25 ID Check Credited Toward Month 1
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-slate-300">
                    For growing teams hiring across departments.
                  </p>
                  <ul className="space-y-2.5 pt-4 border-t border-slate-800 text-sm sm:text-base text-slate-100">
                    <li className="flex items-start gap-2.5 text-amber-300 font-bold">
                      <span className="shrink-0">★</span>
                      <span><strong className="text-white">5 Active Protected Roles</strong> (50 Bridge checks/role)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">35 Invitations / mo</strong> (Accepted-Only Guarantee)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Verified Hiring Bridge</strong> links • <Link href="/hiring-bridge" className="text-emerald-300 underline hover:text-emerald-200 font-bold">Details →</Link></span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Built-In W-2 Payroll (-1% Rate)</strong> • <Link href="/w2-hiring" className="text-emerald-300 underline hover:text-emerald-200 font-bold">4 Paths →</Link></span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">5 Team Seats</strong> + Founding Partner Badge</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">+$199 Extra Role Slots</strong> anytime</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/employer?plan=growth"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm sm:text-base rounded-xl text-center transition-colors shadow-md"
                >
                  Select Growth ($599/mo) →
                </Link>
              </div>

              {/* Enterprise ($999) */}
              <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl border-2 border-emerald-500/80 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-bl-xl">
                  ★ 15 Active Roles + HR Sync
                </div>
                <div className="space-y-5 pt-2">
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-emerald-400">
                      High-Volume &amp; Enterprise
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                      Enterprise
                    </h3>
                    <div className="mt-3 flex flex-wrap items-baseline gap-2">
                      <span className="text-4xl font-black text-white">$999</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-300">/ month</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold">
                      ✓ $25 ID Check Credited Toward Month 1
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-slate-300">
                    For multi-team hiring with automated HR sync.
                  </p>
                  <ul className="space-y-2.5 pt-4 border-t border-slate-800 text-sm sm:text-base text-slate-100">
                    <li className="flex items-start gap-2.5 text-amber-300 font-bold">
                      <span className="shrink-0">★</span>
                      <span><strong className="text-white">15 Active Protected Roles</strong> (100 Bridge checks/role)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">120 Invitations / mo</strong> (Accepted-Only Guarantee)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Verified Hiring Bridge</strong> links • <Link href="/hiring-bridge" className="text-emerald-300 underline hover:text-emerald-200 font-bold">Details →</Link></span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Built-In W-2 Payroll (-2% Rate)</strong> • <Link href="/w2-hiring" className="text-emerald-300 underline hover:text-emerald-200 font-bold">4 Paths →</Link></span>
                    </li>
                    <li className="flex items-start gap-2.5 text-indigo-300 font-bold">
                      <span className="shrink-0">⚡</span>
                      <span><strong className="text-white">Workday &amp; Greenhouse Sync</strong> + CSV Export</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Unlimited Seats</strong> • +$199 Extra Slots anytime</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/employer?plan=enterprise"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm sm:text-base rounded-xl text-center transition-colors shadow-md"
                >
                  Select Enterprise ($999/mo) →
                </Link>
              </div>
            </div>

            {/* COMPACT OVERFLOW + 4-PATH W-2 STRIP */}
            <div className="pt-6 border-t border-slate-800 grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 border border-indigo-500/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">★ Need Extra Concurrent Roles?</div>
                  <h3 className="text-lg sm:text-xl font-black text-white">Extra Protected Role Slot</h3>
                  <p className="text-xs sm:text-sm text-slate-300">Closing a filled role frees its slot immediately. Need an extra live role at once? Add 1 slot + 25 Bridge checks with zero tier jump.</p>
                </div>
                <div className="shrink-0 sm:text-right bg-slate-950 px-4 py-3 rounded-xl border border-slate-800">
                  <div className="text-2xl sm:text-3xl font-black text-white">$199</div>
                  <div className="text-[11px] font-bold text-emerald-300">flat add-on • zero overages</div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 border border-emerald-500/40 flex flex-col justify-between gap-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">⚡ Built-In W-2 Hiring Included</div>
                    <h3 className="text-lg sm:text-xl font-black text-white">4 Flexible W-2 Hiring Paths • $0 Conversion Fee</h3>
                  </div>
                  <Link href="/w2-hiring" className="shrink-0 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-400/40 text-xs font-extrabold text-emerald-300 transition-colors">
                    Explore W-2 Guide →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-extrabold">
                  <div className="px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200">1. Direct Hire</div>
                  <div className="px-2.5 py-2 rounded-lg bg-slate-950 border border-emerald-500/40 text-emerald-300">2. Contract-to-Hire</div>
                  <div className="px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200">3. Fixed Contract</div>
                  <div className="px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200">4. Open Contract</div>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================
              SECTION 2: PROFESSIONAL PLANS
             ================================================================ */}
          <div id="professionals" className="scroll-mt-28 rounded-3xl border-2 border-indigo-500/50 bg-slate-950 p-5 sm:p-8 md:p-10 shadow-xl space-y-8 relative overflow-hidden">
            <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-700 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-amber-300 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                  <span>🛡️ Professional Membership Plans • Weekly 1-Year Prestige Giveaway</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Start for $5 • Receive Employer Invitations Free Forever
                </h2>
                <p className="text-sm sm:text-base text-slate-200 max-w-3xl leading-relaxed">
                  Stay in Explorer at $0/mo forever, and subscribe only when you're ready to submit applications.
                </p>
              </div>
              <div className="shrink-0">
                <Link
                  href="/signup/professional"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm sm:text-base font-extrabold transition-colors shadow-md"
                >
                  Verify &amp; Start for $5 →
                </Link>
              </div>
            </div>

            {/* 3 Professional Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Tier 1: Explorer */}
              <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl border-2 border-slate-700 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-bl-xl">
                  🛡️ $0/Mo Forever
                </div>
                <div className="space-y-5 pt-2">
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-emerald-400">
                      Inbound Discovery
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                      Explorer
                    </h3>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white">$0</span>
                      <span className="text-sm font-bold text-slate-300">/ month forever</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold">
                      ✓ $5 One-Time ID Verification
                    </div>
                  </div>
                  <p className="text-base text-slate-100 leading-relaxed">
                    Get discovered by verified employers and accept unlimited invitations at $0/mo.
                  </p>
                  <ul className="space-y-3 pt-4 border-t border-slate-800 text-sm sm:text-base text-slate-100">
                    <li className="flex items-start gap-2.5 text-emerald-300 font-bold">
                      <span className="shrink-0">🛡️</span>
                      <span><strong className="text-white">Real-Person ID Verification</strong> &amp; Verified Shield ($5 once)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Live Anonymous Profile</strong> in Employer Search</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Unlimited Employer Invitations</strong> &amp; Private Chat</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>Free TrueFit Score™ checks &amp; Weekly 1-Year Prestige Drawing entry</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-emerald-300 font-bold">
                      <span className="shrink-0">✓</span>
                      <span><strong className="text-white">$5 Credited Toward Month 1</strong> if you ever subscribe</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-slate-300">
                      <span className="text-slate-400 font-bold shrink-0">✕</span>
                      <span>Protected Applications (Upgrade anytime)</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/professional?plan=explorer"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm sm:text-base rounded-xl text-center transition-colors shadow-md"
                >
                  Start Explorer ($5 One-Time) →
                </Link>
              </div>

              {/* Tier 2: Professional ($12/mo) */}
              <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl border-2 border-amber-500/80 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-bl-xl">
                  🛡️ Active Job Seeker
                </div>
                <div className="space-y-5 pt-2">
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-amber-400">
                      Targeted Applications
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                      Professional
                    </h3>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white">$12</span>
                      <span className="text-sm font-bold text-slate-300">/ month</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-extrabold">
                      ✓ $5 ID Check Credited Toward Month 1
                    </div>
                  </div>
                  <p className="text-base text-slate-100 leading-relaxed">
                    Apply directly to up to 15 roles per month and receive unlimited employer invitations.
                  </p>
                  <ul className="space-y-3 pt-4 border-t border-slate-800 text-sm sm:text-base text-slate-100">
                    <li className="flex items-start gap-2.5 text-emerald-300 font-bold">
                      <span className="shrink-0">🛡️</span>
                      <span><strong className="text-white">Everything in Explorer</strong> + Verified Shield</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">15 Protected Applications / mo</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Unlimited Employer Invitations</strong> &amp; Private Chat</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-amber-300 font-bold">
                      <span className="shrink-0">★</span>
                      <span><strong className="text-white">Permanent Founding Member Badge</strong> &amp; Profile Distinctions</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>Elevated placement in Employer Talent Search</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/professional?plan=professional"
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm sm:text-base rounded-xl text-center transition-colors shadow-md"
                >
                  Select Professional ($12/mo) →
                </Link>
              </div>

              {/* Tier 3: Prestige ($19/mo) */}
              <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl border-2 border-indigo-500 shadow-lg flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-bl-xl">
                  ★ Priority &amp; Unlimited
                </div>
                <div className="space-y-5 pt-2">
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-indigo-300">
                      Maximum Visibility
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                      Prestige
                    </h3>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white">$19</span>
                      <span className="text-sm font-bold text-slate-300">/ month</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-extrabold">
                      ✓ $5 ID Check Credited Toward Month 1
                    </div>
                  </div>
                  <p className="text-base text-slate-100 leading-relaxed">
                    Unlimited protected applications and top-priority placement in Employer Search.
                  </p>
                  <ul className="space-y-3 pt-4 border-t border-slate-800 text-sm sm:text-base text-slate-100">
                    <li className="flex items-start gap-2.5 text-emerald-300 font-bold">
                      <span className="shrink-0">🛡️</span>
                      <span><strong className="text-white">Everything in Professional</strong> + Priority US Support</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Unlimited Protected Applications</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Unlimited Employer Invitations</strong> &amp; Private Chat</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-amber-300 font-bold">
                      <span className="shrink-0">★</span>
                      <span><strong className="text-white">Top-Priority Placement</strong> in Employer Talent Search</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>Priority 1-on-1 US Human Support</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/professional?plan=prestige"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm sm:text-base rounded-xl text-center transition-colors shadow-md"
                >
                  Select Prestige ($19/mo) →
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
