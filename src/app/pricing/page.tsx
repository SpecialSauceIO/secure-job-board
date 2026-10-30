import Link from "next/link"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"

export const metadata = {
  title: "Pricing, Plans & Founding Partner Rates | specialsauce.io",
  description:
    "Get verified once for life ($5 Professionals / $25 Employers). Browse and match free in Explorer mode, or unlock active Professional plans ($12 or $19/mo) and Employer Founding Partner plans ($149, $499, or $1,250/mo).",
}

export default function PricingMatrixPage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col justify-between">
      <div>
        <PublicHeader />

        {/* Hero Header — Full-Bleed Dark Slate with Static Right-Side 3D Angled Interface */}
        <section className="relative overflow-hidden bg-[#0f172a] border-b border-slate-800 py-14 sm:py-18 md:py-24 mb-12 sm:mb-16">
          {/* Ambient Left-Side Deep Slate Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -left-24 w-[36rem] h-[36rem] rounded-full bg-sky-500/10 blur-3xl z-0"
          />

          {/* Full-Width Seamless Right-Side Static 3D Isometric Interface Accent */}
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
                      specialsauce.io • Verified Pay Bands &amp; Founding Partner Roles
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

          {/* Foreground Content */}
          <div className="relative z-10 px-4 sm:px-6 md:px-12 max-w-5xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/35 text-amber-300 text-xs sm:text-sm font-extrabold uppercase tracking-wide backdrop-blur-xs">
              <span>★ One-Time Lifetime Verification • 100% Human-to-Human Hiring &amp; Founding Partner Rates</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-xs">
              Verify Once •{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] to-[#0077D4]">
                Match Forever Free
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Connect directly with ID-verified professionals and domain-verified employers—with <strong className="text-white">zero bots, zero ghost jobs, and free TrueFit Score™ checks</strong>. Complete your one-time verification to enter the <strong className="text-emerald-400">$0/mo Explorer Vault</strong> and upgrade only when ready to actively connect.
            </p>

            {/* Split-Screen Onboarding Callout: Left Professionals ($5) | Right Employers ($25) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto pt-3 text-left">
              <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-indigo-500/40 shadow-lg space-y-2.5">
                <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
                  For Professionals ($5 One-Time ID Verification)
                </div>
                <ul className="space-y-1.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold shrink-0">•</span>
                    <span>Pay <strong className="text-white">$5 once for life</strong> for Stripe Real-Person ID Verification.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">•</span>
                    <span>Enjoy <strong className="text-emerald-300">$0/mo Explorer access forever</strong> (unlimited inbound invites + Weekly 1-Yr Prestige Drawing).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0">•</span>
                    <span>Upgrade to <strong className="text-amber-300">$12 / $19 mo</strong> only when applying outbound.</span>
                  </li>
                </ul>
              </div>
              <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 shadow-lg space-y-2.5">
                <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                  For Employers ($25 One-Time Org Verification)
                </div>
                <ul className="space-y-1.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">•</span>
                    <span>Pay <strong className="text-white">$25 once</strong> for Corporate Domain, EIN &amp; Admin ID Verification.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">•</span>
                    <span>Preview live verified professional matches in the <strong className="text-emerald-300">$0/mo Sandbox</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0">•</span>
                    <span>Activate <strong className="text-amber-300">Founding Partner Rates ($149 / $499 / $1,250 mo)</strong> when ready to hire.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Frameless Operational Trust Strip — Dark Slate Edition */}
            <div className="pt-6 w-full max-w-5xl mx-auto">
              <div className="grid grid-cols-2 lg:grid-cols-4 py-3 px-2 rounded-2xl bg-[#0f172a]/85 backdrop-blur-md border border-slate-800/90 shadow-lg">
                <div className="px-4 py-1.5 lg:py-0 flex flex-col items-center justify-center text-center border-r border-slate-800">
                  <span className="text-[11px] font-extrabold text-white uppercase tracking-[0.14em]">
                    100% US-Based Company
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    US-Owned &amp; Operated
                  </span>
                </div>

                <div className="px-4 py-1.5 lg:py-0 flex flex-col items-center justify-center text-center lg:border-r border-slate-800">
                  <span className="text-[11px] font-extrabold text-white uppercase tracking-[0.14em]">
                    100% US Human Support
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    Zero Offshore Call Centers
                  </span>
                </div>

                <div className="px-4 py-1.5 lg:py-0 flex flex-col items-center justify-center text-center border-r border-slate-800">
                  <span className="text-[11px] font-extrabold text-white uppercase tracking-[0.14em]">
                    Human-to-Human Hiring
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    Zero Automated Rejections
                  </span>
                </div>

                <div className="px-4 py-1.5 lg:py-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-extrabold text-white uppercase tracking-[0.14em]">
                    Intro/Convo Privacy Vault
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    Stripe ID &amp; DNS Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main 3x3 Matrix Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pb-20 sm:pb-24 space-y-14 sm:space-y-20">
          {/* ================================================================
              SECTION 1: PROFESSIONAL PLANS (Explorer $5 Once / Professional $12 / Prestige $19)
             ================================================================ */}
          <div className="rounded-3xl border-2 border-indigo-500/50 bg-slate-950 p-5 sm:p-8 md:p-10 shadow-xl space-y-8 relative overflow-hidden">
            {/* Top Unified Professional Banner */}
            <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-700 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-amber-300 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                  <span>🛡️ 100% Human-to-Human Marketplace • Weekly 1-Year Prestige Membership Giveaway</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Get Started Today for $5 • Browse &amp; Receive Invites Free Forever
                </h2>
                <ul className="space-y-1.5 pt-1 text-sm sm:text-base text-slate-200">
                  <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">✓</span><span><strong className="text-emerald-300">Explorer ($5 One-Time ID Pass, then $0/mo):</strong> Lifetime Stripe ID Verification, live anonymous profile, TrueFit Score™ checks, &amp; unlimited inbound Employer Invitations.</span></li>
                  <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">✓</span><span><strong className="text-amber-300">Professional ($12/mo) &amp; Prestige ($19/mo):</strong> Upgrade only when you want to proactively submit outbound applications—and downgrade back to $0/mo Explorer anytime once hired!</span></li>
                  <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">✓</span><span><strong className="text-white">Weekly Friday Drawing:</strong> Every verified member is automatically entered into our weekly drawing for a free 1-Year Prestige Membership.</span></li>
                </ul>
              </div>
              <div className="shrink-0">
                <Link
                  href="/signup/candidate"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm sm:text-base font-extrabold transition-colors shadow-md"
                >
                  Verify &amp; Start for $5 →
                </Link>
              </div>
            </div>

            {/* 3 Professional Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Tier 1: Explorer ($5 One-Time / $0 mo Forever) */}
              <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl border-2 border-slate-700 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-bl-xl">
                  🛡️ $0/Mo Forever After ID Check
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
                      <span className="text-4xl font-black text-white">$0</span>
                      <span className="text-sm font-bold text-slate-300">/ month forever</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold">
                      ✓ $5 One-Time Lifetime ID Verification
                    </div>
                  </div>
                  <p className="text-base text-slate-100 leading-relaxed">
                    Verify your identity once for $5 and let verified employers come to you with unlimited inbound Professional Invitations at $0/mo.
                  </p>
                  <ul className="space-y-3 pt-4 border-t border-slate-800 text-sm sm:text-base text-slate-100">
                    <li className="flex items-start gap-2.5 text-emerald-300 font-bold">
                      <span className="shrink-0">🛡️</span>
                      <span><strong className="text-white">Includes Lifetime Real-Person ID Verification</strong> &amp; Verified Professional Shield ($5 once)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Live Anonymous Talent Profile</strong> in Employer Search</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Unlock &amp; Accept Unlimited Professional Invitations</strong> (Private Chat)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>Browse protected role feed, run TrueFit Score™ checks &amp; enter Weekly 1-Yr Prestige Drawing</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-slate-300">
                      <span className="text-slate-400 font-bold shrink-0">✕</span>
                      <span>Proactive Outbound Applications (Upgrade to $12/mo or $19/mo anytime)</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/candidate?plan=explorer"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm sm:text-base rounded-xl text-center transition-colors shadow-md"
                >
                  Start Explorer ($5 One-Time ID Pass) →
                </Link>
              </div>

              {/* Tier 2: Professional ($12/mo) */}
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
                      <span className="text-4xl font-black text-white">$12</span>
                      <span className="text-sm font-bold text-slate-300">/ month</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-extrabold">
                      ✓ Activate Only When Ready to Apply ($5 One-Time ID Check)
                    </div>
                  </div>
                  <p className="text-base text-slate-100 leading-relaxed">
                    Accept unlimited Professional Invitations and apply directly to up to 15 roles per month.
                  </p>
                  <ul className="space-y-3 pt-4 border-t border-slate-800 text-sm sm:text-base text-slate-100">
                    <li className="flex items-start gap-2.5 text-emerald-300 font-bold">
                      <span className="shrink-0">🛡️</span>
                      <span><strong className="text-white">Everything in Explorer</strong> + Verified Professional Shield</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">15 Outbound Protected Applications / mo</strong> (40%+ TrueFit™)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Unlock &amp; Accept Unlimited Professional Invitations</strong> (Private Chat)</span>
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
                      <span>Elevated placement + downgrade to $0/mo Explorer anytime when hired</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/candidate?plan=professional"
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm sm:text-base rounded-xl text-center transition-colors shadow-md"
                >
                  Select Professional ($12/mo) →
                </Link>
              </div>

              {/* Tier 3: Prestige ($19/mo) */}
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
                      <span className="text-4xl font-black text-white">$19</span>
                      <span className="text-sm font-bold text-slate-300">/ month</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-extrabold">
                      ✓ Unlimited Outbound Reach ($5 One-Time ID Check)
                    </div>
                  </div>
                  <p className="text-base text-slate-100 leading-relaxed">
                    Unlimited protected applications and Top-Priority Spotlight in Employer Search.
                  </p>
                  <ul className="space-y-3 pt-4 border-t border-slate-800 text-sm sm:text-base text-slate-100">
                    <li className="flex items-start gap-2.5 text-emerald-300 font-bold">
                      <span className="shrink-0">🛡️</span>
                      <span><strong className="text-white">Everything in Professional</strong> + Priority 1-on-1 US Support</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Unlimited Outbound Protected Applications</strong> (40%+ TrueFit™)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-white">Unlock &amp; Accept Unlimited Professional Invitations</strong></span>
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
                      <span>Downgrade back to $0/mo Explorer anytime once hired to stay open to headhunting</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup/candidate?plan=prestige"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm sm:text-base rounded-xl text-center transition-colors shadow-md"
                >
                  Select Prestige ($19/mo) →
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
                  <span>★ $25 One-Time Org Verification • 12-Month Employer Founding Partner Rate Lock</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Verify Your Organization for $25 • Preview Live Professional Matches Free
                </h2>
                <ul className="space-y-1.5 pt-1 text-sm sm:text-base text-slate-200">
                  <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">✓</span><span><strong className="text-emerald-300">$25 One-Time Verification Sandbox:</strong> Complete Domain, EIN &amp; Stripe ID verification once to draft roles and preview verified professional matches at $0/mo before activating a plan.</span></li>
                  <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">✓</span><span><strong className="text-amber-300">12-Month Rate Lock:</strong> Lock in $149 / $499 / $1,250 per month for your first 12 months when ready to connect (standard retail applies Month 13).</span></li>
                  <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">✓</span><span><strong className="text-white">Accepted-Only Invitation Guarantee:</strong> Inbound applicants are 100% free (0 credits), and declined outbound invitations are auto-refunded.</span></li>
                </ul>
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
                      ✓ $25 One-Time Org Verification • Activate When Ready
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
                      <span><strong className="text-white">10 Outbound Professional Invitation Credits / month</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5 text-emerald-300 font-bold">
                      <span className="shrink-0">🛡️</span>
                      <span><strong className="text-white">100% Accepted-Only Invitation Credit Protection</strong> (Declined invitations are auto-refunded)</span>
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
                  Verify ($25) &amp; Select Starter ($149/mo) →
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
                      ✓ $25 One-Time Org Verification • Activate When Ready
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
                      <span><strong className="text-white">35 Outbound Professional Invitation Credits / month</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5 text-emerald-300 font-bold">
                      <span className="shrink-0">🛡️</span>
                      <span><strong className="text-white">100% Accepted-Only Invitation Credit Protection</strong> (Declined invitations are auto-refunded)</span>
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
                  Verify ($25) &amp; Select Growth ($499/mo) →
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
                      ✓ $25 One-Time Org Verification • Activate When Ready
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
                      <span><strong className="text-white">120 Outbound Professional Invitation Credits / month</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5 text-emerald-300 font-bold">
                      <span className="shrink-0">🛡️</span>
                      <span><strong className="text-white">100% Accepted-Only Invitation Credit Protection</strong> (Declined invitations are auto-refunded)</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-indigo-300 font-bold">
                      <span className="shrink-0">⚡</span>
                      <span><strong className="text-white">Workday &amp; Enterprise Outbound Webhook (HMAC-SHA256)</strong> — real-time signed JSON payloads</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-indigo-300 font-bold">
                      <span className="shrink-0">⚡</span>
                      <span><strong className="text-white">Native Greenhouse HR Software Connector</strong> — auto-syncs unlocked PDF resumes &amp; TrueFit Score™ cards</span>
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
                  Verify ($25) &amp; Select Enterprise ($1,250/mo) →
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
                    Active <strong className="text-white">Starter, Growth, and Enterprise</strong> subscribers can add on-demand Professional Invitation Credit packs anytime. We use a <strong className="text-amber-300">Monthly-First Depletion Rule</strong>: your monthly plan allowance is always spent first, and purchased Top-Up Credits <strong className="text-emerald-300">roll over month-to-month and never expire</strong> while your subscription is active.
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
                    🛡️ Declined Invitations Are Auto-Refunded (+1 Credit)
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
                        $15.00 / invitation
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <h4 className="text-xl sm:text-2xl font-black text-white">
                        +10 Invitation Credits
                      </h4>
                      <span className="text-3xl font-black text-white">$150</span>
                    </div>
                    <p className="text-base text-slate-100 leading-relaxed">
                      Ideal when your team is 2–3 outbound Professional Invitations away from rounding out a final interview slate this month.
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
                        $14.00 / invitation
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <h4 className="text-xl sm:text-2xl font-black text-white">
                        +25 Invitation Credits
                      </h4>
                      <span className="text-3xl font-black text-white">$350</span>
                    </div>
                    <p className="text-base text-slate-100 leading-relaxed">
                      Built for hiring managers actively sourcing passive professionals across 2 to 4 concurrent role openings.
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
                        $12.00 / invitation
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <h4 className="text-xl sm:text-2xl font-black text-white">
                        +75 Invitation Credits
                      </h4>
                      <span className="text-3xl font-black text-white">$900</span>
                    </div>
                    <p className="text-base text-slate-100 leading-relaxed">
                      Maximum volume discount for multi-department recruiting pushes and quarterly talent acquisition sprints.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs sm:text-sm font-bold text-emerald-300">
                    <span>✓ Non-expiring rollover</span>
                    <span>Best Value Per Invitation</span>
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
