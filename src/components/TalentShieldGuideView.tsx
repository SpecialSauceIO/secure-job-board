import Link from "next/link"

export default function TalentShieldGuideView({
  isDashboard = false,
}: {
  isDashboard?: boolean
}) {
  return (
    <div className="space-y-10">
      <section className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 sm:p-10 space-y-5 shadow-lg">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-extrabold uppercase tracking-wider w-fit">
          Verified Hiring Bridge • Included on Starter, Growth &amp; Enterprise
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
          Stop Applicant Spam. Bring Only Verified Humans Into Your Pipeline.
        </h1>
        <p className="text-sm sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
          Drop a Verified Hiring Bridge link on your careers page, LinkedIn post, or external listing. Every applicant completes a quick real-person ID check at $0 cost (covered by your plan) and clears your 40%+ TrueFit Score™ before they ever reach your inbox.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href={isDashboard ? "/dashboard/employer/shield" : "/signup/employer"} className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition-colors">
            {isDashboard ? "Open Verified Hiring Bridge →" : "Verify Organization ($25 Credited Toward Month 1) →"}
          </Link>
          <Link href={isDashboard ? "/dashboard/employer/billing" : "/pricing"} className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm transition-colors">
            {isDashboard ? "Back to Membership & Plan Settings" : "Compare Employer Memberships"}
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-3 shadow-xs">
          <p className="text-xs font-black uppercase tracking-wider text-indigo-600">Predictable Sponsored Verification</p>
          <h2 className="text-xl font-extrabold text-slate-900">Hard-Capped Allowances. Zero Surprise Bills.</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Every plan includes a clear monthly allowance for new bridge applicants: Starter (25/mo), Growth (75/mo), and Enterprise (200/mo). Already-verified Professionals are always unlimited and $0. Need extra volume? Add optional rollover Bridge Packs (25/$50, 50/$95, or 150/$270) on your own terms—never surprise metered charges.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-3 shadow-xs">
          <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Hire Your Way</p>
          <h2 className="text-xl font-extrabold text-slate-900">Unlimited Inbound Applicants &amp; Built-In W-2 Hiring</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Qualified, ID-verified applicants land directly in your Inbound Applications with zero per-applicant fees and zero impact on your outbound credits. Hire directly or bring them on through{' '}
            <Link href={isDashboard ? "/dashboard/w2-hiring" : "/w2-hiring"} className="text-indigo-600 underline decoration-indigo-300 underline-offset-4 hover:text-indigo-800 font-semibold">
              Built-In W-2 Hiring ($0 Conversion Fee Contract-to-Hire)
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 space-y-6 shadow-xs">
        <div className="space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">One Simple Flow</p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">How Verified Hiring Bridge Works</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2">
            <h3 className="text-base font-extrabold text-slate-900">1. Share One Link Anywhere</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Put your Verified Hiring Bridge link on your careers page, LinkedIn post, or any external listing—or send it directly to a standout person you want to invite.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2">
            <h3 className="text-base font-extrabold text-slate-900">2. Stop Bots at the Door ($0 to Applicants)</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Applicants complete a quick real-person ID check through Stripe at $0 cost to them. Automated bots, spam scripts, and fake profiles never get through.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2">
            <h3 className="text-base font-extrabold text-slate-900">3. Replace Broken ATS Keyword Filters</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              TrueFit Score™ checks real skills, pay alignment, and work model (40%+ match) so great talent never gets thrown away over missing keywords.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
