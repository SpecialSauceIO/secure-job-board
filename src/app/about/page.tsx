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
              Modern hiring broke the moment automated tools made it free to flood every open job with hundreds of machine-generated applications—and just as easy for bad actors to post fake roles to harvest personal data. We built Special Sauce to close the door on the noise.
            </p>
          </div>
        </section>

        {/* Origin Story & The Broken Middle */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 md:px-12">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="bg-slate-900 text-white rounded-2xl border border-slate-700 shadow-lg p-6 sm:p-10 space-y-5">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Why We Built the World's First Secured Workforce Ecosystem
              </h2>
              <p className="text-slate-200 leading-relaxed text-base">
                After spending years inside global cloud, enterprise support, and frontier AI enablement teams, we watched both sides of the hiring market hit a wall at the exact same time. Qualified Professionals were sending tailored applications into a black hole—dodging ghost roles, identity harvesters, and automated rejections—while overwhelmed HR teams were buried under hundreds of bot-generated submissions within hours of posting a role.
              </p>
              <p className="text-slate-200 leading-relaxed text-base">
                Most platforms tried to fix AI spam by selling job seekers more automation tools to spray applications even faster. We went the opposite direction: verify every human and every business at the front door, keep personal contact details locked inside a 2-Stage Privacy Vault until both sides agree to talk, protect external DMs and sourcing with single-use Personal Inbound Shield and Talent Shield links, and support Direct Hire, W-2 Contract, and Contract-to-Hire ($0 conversion fee) roles with upfront pay.
              </p>
            </div>

            {/* Why Verification Exists Before Entry */}
            <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 sm:p-10 space-y-6 shadow-sm">
              <div className="space-y-2">
                <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  Plain-English Transparency
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Why Every Account Completes Verification at the Door
                </h2>
              </div>
              <p className="text-slate-300 leading-relaxed text-base">
                When creating an account on a job board costs nothing and checks nothing, scam networks can spin up thousands of fake profiles and fake job listings before breakfast. Our upfront verification gate exists for one reason: mathematical protection for everyone inside—and whenever you choose to activate a paid monthly membership, 100% of your upfront verification fee is credited right back toward Month 1.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-5 space-y-2.5">
                  <h3 className="text-lg font-extrabold text-white">
                    For Professionals ($5 One-Time — $0/mo Explorer)
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    We do not believe in taxing people who are looking for work. Explorer is $0/month forever. The one-time $5 verification covers live government ID verification through Stripe Identity so automated bots cannot impersonate real talent—while keeping your name, resume, and contact details private inside your vault until you choose to unlock them.
                  </p>
                  <p className="text-xs font-bold text-emerald-400 pt-1">
                    100% Credited Back: Whenever you upgrade to a Professional or Prestige monthly membership, your $5 verification fee is credited right toward Month 1.
                  </p>
                </div>
                <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-5 space-y-2.5">
                  <h3 className="text-lg font-extrabold text-white">
                    For Employers ($25 One-Time — $0/mo Practice Mode)
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Employers are held to an even stricter standard. Your $25 verification fee and administrator Stripe ID scan unlock Practice Mode immediately so your team can configure company settings and preview verified match counts—while corporate domain verification and U.S. business entity review must clear before publishing Protected Roles or sending Professional Invitations.
                  </p>
                  <p className="text-xs font-bold text-emerald-400 pt-1">
                    100% Credited Back: When your team activates a Starter, Growth, or Enterprise monthly membership, your $25 verification fee is credited right toward Month 1.
                  </p>
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
