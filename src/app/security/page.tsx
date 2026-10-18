import Link from 'next/link'
import Image from 'next/image'

export default function SecurityTrustPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Nav */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-24 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="specialsauce.io Logo"
              width={420}
              height={105}
              className="h-12 sm:h-14 w-auto object-contain"
              priority
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Compare Plans &amp; Perks
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2.5 bg-slate-900 text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-indigo-600 transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <section className="py-16 md:py-24 px-6 md:px-12 max-w-5xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold uppercase tracking-wide">
          <span>🛡️ Privacy-First Architecture</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Security, Trust &amp; Anti-Harvesting Protocol
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
          specialsauce.io is engineered from the ground up to protect candidate privacy, eliminate ghost jobs, and guarantee true bilateral intent before any personal or corporate information is revealed.
        </p>
      </section>

      {/* Main Content Grid */}
      <main className="max-w-5xl mx-auto px-6 md:px-12 pb-24 space-y-12">
        {/* Pillar 1 */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 font-black flex items-center justify-center text-lg">
              1
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Double-Blind Candidate Identity Protection
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Candidates browse and apply anonymously. Your name, email, phone number, and resume remain completely hidden from employers during initial discovery and 5-Point AI Fit scoring. Employers only see an anonymous profile ID (e.g., <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">#A4F29</code>) and extracted skill matrices. Direct contact and resume release happen only after a mutual connection request is accepted.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-black flex items-center justify-center text-lg">
              2
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Corporate Domain Verification &amp; Anti-Ghost Job Firewall
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Every hiring organization must verify their official corporate email domain via DNS / workspace records before posting jobs or pitching talent. Furthermore, under our anti-harvesting rules, <strong>every job listing automatically expires after 30 days</strong> unless actively renewed by the employer—guaranteeing that candidates never waste time applying to dead or ghost listings.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 font-black flex items-center justify-center text-lg">
              3
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              5-Point AI Fit &amp; Dealbreaker Firewall
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Our multi-tier AI matching engine evaluates candidates across five normalized pillars (Core Competencies, Skill Tenure, Logistics &amp; Pay, Industry &amp; Creds, and Execution &amp; Comm.). The platform enforces strict dealbreaker firewalls for salary expectations, work models (Remote/Hybrid/Onsite), employment types, and language proficiencies—blocking mismatched connections before credits are spent.
          </p>
        </div>

        {/* Pillar 4 */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 font-black flex items-center justify-center text-lg">
              4
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Encrypted Data Storage &amp; Secure Auth
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Powered by Supabase Enterprise infrastructure with row-level security (RLS) policies, JWT session handling, and encrypted credentials. Your data is never sold, scraped for public AI training, or shared with third-party brokers.
          </p>
        </div>

        {/* Bottom CTA */}
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white text-center space-y-6">
          <h3 className="text-2xl sm:text-3xl font-black">
            Ready to experience respectful, high-integrity hiring?
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup/candidate"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors text-sm"
            >
              Join as a Candidate →
            </Link>
            <Link
              href="/signup/employer"
              className="px-6 py-3 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl transition-colors text-sm"
            >
              Join as an Employer →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
