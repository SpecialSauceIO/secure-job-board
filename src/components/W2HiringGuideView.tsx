import Link from "next/link"

export default function W2HiringGuideView({
  isDashboard = false,
}: {
  isDashboard?: boolean
}) {
  return (
    <div className="space-y-10">
      <section className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 sm:p-10 space-y-5 shadow-lg">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-extrabold uppercase tracking-wider w-fit">
          Direct Hire • W-2 Contract • Contract-to-Hire
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
          Three Hiring Tracks—Backed by Turnkey U.S. W-2 Payroll, Compliance &amp; $0 Conversion Fees.
        </h1>
        <p className="text-sm sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
          Every Protected Role on Special Sauce supports traditional full-time Direct Hire alongside optional W-2 Contract and Contract-to-Hire tracks—giving Employers workforce flexibility across 90-day, 180-day, or custom conversion timelines with $0 buyout fees and giving Professionals real W-2 paycheck protection from day one.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href={isDashboard ? "/dashboard" : "/pricing"} className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition-colors">
            {isDashboard ? "Return to Dashboard →" : "View Membership Pricing →"}
          </Link>
          <Link href={isDashboard ? "/dashboard/workflows" : "/workflows"} className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm transition-colors">
            {isDashboard ? "View Platform Workflows" : "Explore End-to-End Workflows"}
          </Link>
        </div>
      </section>

      <section className="bg-indigo-950 text-white rounded-2xl border border-indigo-800 p-6 sm:p-8 space-y-3 shadow-sm">
        <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
          Clear Operational Structure • Turnkey W-2 Administration
        </p>
        <h2 className="text-xl sm:text-2xl font-extrabold">
          Platform Verification by Special Sauce + Licensed U.S. W-2 Payroll Infrastructure
        </h2>
        <p className="text-sm sm:text-base text-indigo-100 leading-relaxed">
          Special Sauce Solutions LLC operates the secured workforce ecosystem—handling identity verification, TrueFit Score™ matching, the 2-Stage Privacy Vault, and lifecycle safeguards. When a hiring team selects a W-2 Contract or Contract-to-Hire track instead of Direct Hire, statutory I-9 and W-4 onboarding, scheduled W-2 paychecks, federal and state employer payroll taxes, workers' compensation, year-end W-2 filings, and consolidated employer billing are administered under licensed U.S. W-2 employer-of-record infrastructure.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
          <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Track 1 • Direct Hire</p>
          <h3 className="text-lg font-extrabold text-slate-900">Full-Time Onto Your Own Payroll ($0 Placement Fee)</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Hire verified Professionals directly onto your internal company payroll. Special Sauce charges zero recruiting commissions or percentage-of-salary placement fees—everything is included in your flat monthly membership.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
          <p className="text-xs font-black uppercase tracking-wider text-indigo-700">Track 2 • W-2 Contract</p>
          <h3 className="text-lg font-extrabold text-slate-900">Fixed-Term (3–12 Mos) or Open-Ended W-2</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Staff project deliverables, seasonal volume, or headcount-capped teams without contractor misclassification risk, complete with turnkey U.S. W-2 payroll and multi-state tax compliance, extendable anytime.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
          <p className="text-xs font-black uppercase tracking-wider text-amber-700">Track 3 • Contract-to-Hire</p>
          <h3 className="text-lg font-extrabold text-slate-900">Flexible Live Alignment + $0 Conversion Fee</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Confirm real-world technical and team fit on paid W-2 work across a 90-day, 180-day, or custom timeline, then transition the Professional onto your full-time internal staff for a $0 conversion fee—eliminating 20%–30% agency buyout penalties.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-3">
          <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">How Employers Benefit</p>
          <ul className="space-y-2.5 text-sm text-slate-200 leading-relaxed">
            <li>✓ <strong className="text-white">Zero Placement or Buyout Fees:</strong> Hire directly or convert W-2 contractors to full-time staff on your schedule with $0 conversion penalties.</li>
            <li>✓ <strong className="text-white">Turnkey U.S. W-2 Payroll Administration:</strong> Offload I-9 and W-4 onboarding, payroll tax withholding, workers' comp, and multi-state compliance.</li>
            <li>✓ <strong className="text-white">Built-In Hardware &amp; Lifecycle Safeguards:</strong> Track company-issued laptops and equipment with confirmation gates on contract wrap-up.</li>
          </ul>
        </div>
        <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-3">
          <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">How Professionals Benefit</p>
          <ul className="space-y-2.5 text-sm text-slate-200 leading-relaxed">
            <li>✓ <strong className="text-white">Upfront Pay Transparency:</strong> Every Direct Hire, W-2 Contract, and Contract-to-Hire role displays hourly or salary pay before you release your resume.</li>
            <li>✓ <strong className="text-white">Day-One W-2 Paycheck Protection:</strong> Receive legitimate W-2 paychecks and employer tax contributions instead of misclassified 1099 surprises.</li>
            <li>✓ <strong className="text-white">Frictionless Path to Full-Time:</strong> Because employers pay $0 conversion fees, agency buyout costs never block your full-time offer.</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
