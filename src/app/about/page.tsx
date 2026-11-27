import Link from "next/link"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { LEGAL_CONFIG } from "@/constants/legal"

export const metadata = {
  alternates: { canonical: "/about" },
  title: "About Special Sauce",
  description:
    "Why Special Sauce Solutions LLC built the world's first secured workforce ecosystem where verified Professionals and verified Employers connect without bots, ghost roles, or resume scraping.",
}

const INSTITUTIONAL_PILLARS = [
  {
    badge: "U.S. Registered & Insured",
    title: "Operated by Special Sauce Solutions LLC",
    body: "Special Sauce is an independent, privately held U.S. technology company registered in the State of Texas, headquartered in Austin, and backed by commercial general liability and cyber insurance coverage.",
  },
  {
    badge: "Regulated Identity Infrastructure",
    title: "Stripe Identity Handles Every ID Scan",
    body: "We never ask you to upload a driver's license to an unknown startup server. All identity and payment checks run directly through Stripe—the same regulated infrastructure trusted by Amazon, Shopify, and Lyft. Special Sauce never sees or stores raw ID photos.",
  },
  {
    badge: "Enterprise & Frontier AI Roots",
    title: "Built by Industry Veterans Who Saw the Problem Firsthand",
    body: "Our founding leadership brings over two decades of enterprise operations, global technical enablement, and frontier AI readiness experience across Fortune 500 financial, cloud, and AI organizations.",
  },
  {
    badge: "Aligned Incentives",
    title: "Zero Data Selling. Zero Ad-Driven Noise.",
    body: "Traditional job boards make more money when roles stay buried under hundreds of automated clicks. We never sell resumes, never scrape fake listings, and never expose your personal contact details without your permission.",
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen w-full overflow-x-clip bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col justify-between">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-slate-900 text-white py-14 sm:py-20 px-4 sm:px-6 md:px-12 border-b border-slate-800">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs sm:text-sm font-extrabold uppercase tracking-wider w-fit">
              About Special Sauce • Secured Workforce Ecosystem
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
              Built to Put Real Humans Back at the Center of Hiring.
            </h1>
            <p className="text-base sm:text-xl text-slate-300 max-w-3xl leading-relaxed">
              Automated bots flooded hiring with machine-generated spam while fake listings harvested personal data—so we built a verified ecosystem where real Employers and real Professionals connect without noise.
            </p>
          </div>
        </section>

        {/* Visual Contrast: The Old Way vs. Special Sauce */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 md:px-12">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="bg-slate-900 text-white rounded-2xl border border-slate-700 shadow-lg p-6 sm:p-10 space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
                  Why Special Sauce Exists
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Why We Built the World's First Secured Workforce Ecosystem
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Instead of selling more AI tools to spray applications faster, we fixed the front door for both sides:
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="rounded-xl bg-rose-950/30 border border-rose-500/30 p-5 space-y-3">
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-400/30 text-xs font-extrabold uppercase tracking-wider text-rose-300">
                    The Old Way • Public Boards &amp; Agencies
                  </span>
                  <ul className="space-y-2.5 text-sm text-slate-200 leading-relaxed">
                    <li className="flex items-start gap-2.5"><span className="text-rose-400 font-extrabold shrink-0">✕</span><span>Bot-flooded inboxes burying qualified applicants in hours</span></li>
                    <li className="flex items-start gap-2.5"><span className="text-rose-400 font-extrabold shrink-0">✕</span><span>Ghost roles and data harvesters scraping personal resumes</span></li>
                    <li className="flex items-start gap-2.5"><span className="text-rose-400 font-extrabold shrink-0">✕</span><span>Automated keyword rejections and hidden pay expectations</span></li>
                    <li className="flex items-start gap-2.5"><span className="text-rose-400 font-extrabold shrink-0">✕</span><span>20%–30% agency commissions and steep W-2 buyout fees</span></li>
                  </ul>
                </div>
                <div className="rounded-xl bg-emerald-950/30 border border-emerald-500/35 p-5 space-y-3">
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/35 text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                    Special Sauce • Secured Workforce Ecosystem
                  </span>
                  <ul className="space-y-2.5 text-sm text-slate-100 leading-relaxed">
                    <li className="flex items-start gap-2.5"><span className="text-emerald-400 font-extrabold shrink-0">✓</span><span>Every Employer and Professional verified via Stripe Identity</span></li>
                    <li className="flex items-start gap-2.5"><span className="text-emerald-400 font-extrabold shrink-0">✓</span><span>2-Stage Privacy Vault keeps personal details locked until mutual fit</span></li>
                    <li className="flex items-start gap-2.5"><span className="text-emerald-400 font-extrabold shrink-0">✓</span><span>Upfront pay, 40%+ TrueFit Score™ alignment &amp; Verified Hiring Bridge</span></li>
                    <li className="flex items-start gap-2.5"><span className="text-emerald-400 font-extrabold shrink-0">✓</span><span>Direct Hire &amp; Built-In W-2 Contract-to-Hire ($0 conversion fee)</span></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* $5 / $25 Verification & 100% Credit Split */}
            <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 sm:p-10 space-y-6 shadow-sm">
              <div className="space-y-2">
                <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  Front-Door Protection • 100% Credited Back
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Verified at Entry. 100% Credited Toward Month 1.
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Free anonymous sign-ups invite bots and scam listings—so every member verifies once at entry, and 100% of that fee is credited toward Month 1 whenever you activate a paid plan.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-700/80">
                      <h3 className="text-lg font-extrabold text-white">For Professionals</h3>
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-400/35 text-xs font-extrabold text-indigo-300">
                        $5 One-Time • $0/mo Explorer
                      </span>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-200 leading-relaxed">
                      <li className="flex items-start gap-2"><span className="text-emerald-400 font-extrabold shrink-0">✓</span><span>Live Stripe Identity check blocks automated bots and impersonators</span></li>
                      <li className="flex items-start gap-2"><span className="text-emerald-400 font-extrabold shrink-0">✓</span><span>$0/mo Explorer forever—receive Employer Invitations &amp; check TrueFit™</span></li>
                      <li className="flex items-start gap-2"><span className="text-emerald-400 font-extrabold shrink-0">✓</span><span>Private vault keeps name, contact info &amp; resume locked until you unlock</span></li>
                    </ul>
                  </div>
                  <div className="rounded-lg bg-emerald-500/15 border border-emerald-400/30 px-3.5 py-2.5 text-xs font-extrabold text-emerald-300">
                    100% Credited Back: $5 applied toward Month 1 on Professional ($12/mo) or Prestige ($19/mo).
                  </div>
                </div>
                <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-700/80">
                      <h3 className="text-lg font-extrabold text-white">For Employers</h3>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/35 text-xs font-extrabold text-emerald-300">
                        $25 One-Time • $0/mo Practice Mode
                      </span>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-200 leading-relaxed">
                      <li className="flex items-start gap-2"><span className="text-emerald-400 font-extrabold shrink-0">✓</span><span>Admin Stripe ID + corporate domain + U.S. business entity verification</span></li>
                      <li className="flex items-start gap-2"><span className="text-emerald-400 font-extrabold shrink-0">✓</span><span>Immediate $0/mo Practice Mode to draft roles &amp; preview verified counts</span></li>
                      <li className="flex items-start gap-2"><span className="text-emerald-400 font-extrabold shrink-0">✓</span><span>Sponsor $0 Verified Hiring Bridge checks once a Base Membership is active</span></li>
                    </ul>
                  </div>
                  <div className="rounded-lg bg-emerald-500/15 border border-emerald-400/30 px-3.5 py-2.5 text-xs font-extrabold text-emerald-300">
                    100% Credited Back: $25 applied toward Month 1 on Starter ($299/mo), Growth ($599/mo), or Enterprise ($999/mo).
                  </div>
                </div>
              </div>
            </div>

            {/* Institutional Trust Grid */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Institutional Standards &amp; Accountability
                </h2>
                <p className="text-slate-600 text-base">
                  We practice the same privacy discipline we build for our members—putting verified corporate governance, regulated security infrastructure, and transparent rules ahead of hype.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {INSTITUTIONAL_PILLARS.map((item) => (
                  <div
                    key={item.title}
                    className="bg-slate-900 text-white rounded-2xl border border-slate-700 p-6 sm:p-8 shadow-lg space-y-4"
                  >
                    <span className="inline-block px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 text-xs font-extrabold uppercase tracking-wider">
                      {item.badge}
                    </span>
                    <h3 className="text-lg sm:text-xl font-extrabold text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Corporate & Contact Verification Card */}
            <div className="bg-slate-900 text-white rounded-2xl border border-slate-700 p-6 sm:p-8 shadow-lg flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  Verified Corporate Headquarters &amp; Inquiries
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {LEGAL_CONFIG.brandName} ({LEGAL_CONFIG.domain}) is owned and operated by{" "}
                  <span className="font-bold text-white">{LEGAL_CONFIG.legalEntityName}</span>,{" "}
                  located at {LEGAL_CONFIG.legalEntityAddress}. For press, partnership, or general inquiries, reach our U.S. team at{" "}
                  <a
                    href={`mailto:${LEGAL_CONFIG.supportEmail}`}
                    className="font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
                  >
                    {LEGAL_CONFIG.supportEmail}
                  </a>
                  .
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  href="/workflows"
                  className="px-5 py-3 rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 text-white text-sm font-extrabold transition-colors"
                >
                  See How It Works
                </Link>
                <Link
                  href="/signup"
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-extrabold shadow-xs transition-colors"
                >
                  Get Verified →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
