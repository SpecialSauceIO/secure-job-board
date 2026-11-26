import Link from "next/link"

interface FlowTrack {
  id: string
  badge: string
  title: string
  subtitle: string
  borderClass: string
  badgeClass: string
  dotClass: string
  footerBadge: string
  footerClass: string
  steps: ReadonlyArray<{ label: string; detail: string }>
}

const FOUR_HIRING_TRACKS: ReadonlyArray<FlowTrack> = [
  {
    id: "direct-hire",
    badge: "Path 1 • Internal Payroll",
    title: "Full-Time Direct Hire",
    subtitle: "Hire Directly Onto Your Company Staff",
    borderClass: "border-emerald-500/50",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-400/35",
    dotClass: "bg-emerald-400",
    footerBadge: "$0 Placement Commission • $0 EOR Fee",
    footerClass: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
    steps: [
      {
        label: "1. Extend Direct Offer",
        detail: "Send your full-time offer directly inside your unlocked private thread.",
      },
      {
        label: "2. Internal HR Onboarding",
        detail: "Onboard the Professional through your own internal HR, benefits, and payroll system.",
      },
      {
        label: "3. Done — Direct Employee",
        detail: "Hired straight onto your company payroll with $0 recruiting or salary commissions.",
      },
    ],
  },
  {
    id: "contract-to-hire",
    badge: "Path 2 • Built-In W-2 EOR",
    title: "W-2 Contract-to-Hire",
    subtitle: "1–12 Mo Live Ramp + $0 Conversion",
    borderClass: "border-amber-500/50",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-400/35",
    dotClass: "bg-amber-400",
    footerBadge: "Net-30 Funded • $0 Conversion Anytime",
    footerClass: "text-amber-300 border-amber-500/30 bg-amber-500/10",
    steps: [
      {
        label: "1. Launch W-2 EOR Onboarding",
        detail: "Digital Form I-9, W-4, direct deposit, payroll taxes, and Workers' Comp handled for you.",
      },
      {
        label: "2. Approve Hours & Pay Net-30",
        detail: "Confirm real-world fit on paid W-2 work with weekly timesheets and one Net-30 invoice.",
      },
      {
        label: "3. Convert Full-Time for $0",
        detail: "Move onto your internal company payroll early or at term with $0 buyout penalties.",
      },
    ],
  },
  {
    id: "limited-w2",
    badge: "Path 3 • Built-In W-2 EOR",
    title: "Limited W-2 Contract",
    subtitle: "Fixed-Term Project or Seasonal Surge",
    borderClass: "border-sky-500/50",
    badgeClass: "bg-sky-500/15 text-sky-300 border-sky-400/35",
    dotClass: "bg-sky-400",
    footerBadge: "1–12 Mos • Extend or Convert ($0)",
    footerClass: "text-sky-300 border-sky-500/30 bg-sky-500/10",
    steps: [
      {
        label: "1. Launch W-2 EOR Onboarding",
        detail: "Staff defined deliverables, seasonal volume, or backfills with zero 1099 risk.",
      },
      {
        label: "2. Turnkey W-2 & Net-30 Billing",
        detail: "Scheduled W-2 paychecks, multi-state taxes, and Workers' Comp funded on Net-30 terms.",
      },
      {
        label: "3. Wrap Up, Extend, or Hire ($0)",
        detail: "Close cleanly with tracked laptop return gates, extend in one click, or convert for $0.",
      },
    ],
  },
  {
    id: "indefinite-w2",
    badge: "Path 4 • Built-In W-2 EOR",
    title: "Indefinite W-2 Contract",
    subtitle: "Open-Ended Ongoing Assignment",
    borderClass: "border-indigo-500/50",
    badgeClass: "bg-indigo-500/15 text-indigo-300 border-indigo-400/35",
    dotClass: "bg-indigo-400",
    footerBadge: "No End Date • $0 Conversion Option",
    footerClass: "text-indigo-300 border-indigo-500/30 bg-indigo-500/10",
    steps: [
      {
        label: "1. Launch W-2 EOR Onboarding",
        detail: "Hire verified talent in any U.S. state without opening new state payroll tax accounts.",
      },
      {
        label: "2. Ongoing Turnkey Operations",
        detail: "Continuous W-2 paychecks, statutory filings, Workers' Comp, and consolidated Net-30 billing.",
      },
      {
        label: "3. Run Open-Ended or Convert ($0)",
        detail: "Keep active as long as needed, close cleanly when priorities shift, or hire full-time for $0.",
      },
    ],
  },
]

export function HiringTracksFlowchart({
  isDashboard = false,
  showGuideLink = false,
}: {
  isDashboard?: boolean
  showGuideLink?: boolean
}) {
  return (
    <section className="rounded-3xl bg-[#0f172a] text-white border-2 border-slate-800 p-5 sm:p-8 md:p-10 shadow-xl space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b border-slate-800">
        <div className="space-y-2.5 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-emerald-300 text-xs font-extrabold uppercase tracking-wider w-fit">
            Built-In U.S. W-2 Employer of Record (EOR) • 4 Employment Methodologies
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
            Visual Hiring Flowchart: Direct Hire + Turnkey W-2 Employer of Record
          </h2>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            Every Protected Role starts with verified matching and private chat. From there, choose internal full-time Direct Hire or launch built-in W-2 Employer of Record services directly from your portal.
          </p>
        </div>
        {showGuideLink && (
          <div className="shrink-0">
            <Link
              href={isDashboard ? "/dashboard/w2-hiring" : "/w2-hiring"}
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-extrabold transition-colors shadow-md">
              Full W-2 &amp; EOR Guide →
            </Link>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-4 sm:p-6 space-y-4">
        <div className="text-xs font-extrabold uppercase tracking-wider text-sky-300">
          Shared Entry Flow • Same Verified Start Before Selecting a Hiring Path
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-3">
          <div className="rounded-xl bg-slate-900 border border-slate-700/80 p-4 space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 block">Step A • Verified Match</span>
            <p className="text-sm font-extrabold text-white">ID Check + TrueFit Score™</p>
            <p className="text-xs text-slate-300 leading-relaxed">Verified Employers and verified Professionals align on skills and upfront pay.</p>
          </div>
          <div className="flex justify-center text-emerald-400" aria-hidden="true">
            <svg className="w-6 h-6 rotate-90 md:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14m-6-6l6 6-6 6" /></svg>
          </div>
          <div className="rounded-xl bg-slate-900 border border-slate-700/80 p-4 space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-sky-400 block">Step B • Privacy Handshake</span>
            <p className="text-sm font-extrabold text-white">Private Chat &amp; Resume Unlock</p>
            <p className="text-xs text-slate-300 leading-relaxed">Chat directly first; full PDF resume and contact details unlock when ready.</p>
          </div>
          <div className="flex justify-center text-emerald-400" aria-hidden="true">
            <svg className="w-6 h-6 rotate-90 md:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14m-6-6l6 6-6 6" /></svg>
          </div>
          <div className="rounded-xl bg-slate-900 border border-amber-500/40 p-4 space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300 block">Step C • Branch Into 1 of 4 Paths</span>
            <p className="text-sm font-extrabold text-white">Direct Payroll or Built-In W-2 EOR</p>
            <p className="text-xs text-slate-300 leading-relaxed">Pick the exact employment structure each role needs right inside your portal.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2" aria-hidden="true">
        <div className="w-0.5 h-5 bg-gradient-to-b from-amber-400 to-emerald-400" />
        <div className="px-4 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-extrabold uppercase tracking-wider text-slate-200 text-center">
          Choose Your Hiring Methodology Below (Paths 2, 3 &amp; 4 Include Full W-2 Employer of Record)
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {FOUR_HIRING_TRACKS.map((track) => (
          <div key={track.id} className={`rounded-2xl bg-slate-900 border-2 ${track.borderClass} p-5 flex flex-col justify-between space-y-5 shadow-md`}>
            <div className="space-y-4">
              <div className="space-y-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-extrabold uppercase tracking-wider ${track.badgeClass}`}>
                  <span className={`w-2 h-2 rounded-full ${track.dotClass}`} />
                  {track.badge}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white leading-snug">{track.title}</h3>
                <p className="text-xs font-bold text-slate-300">{track.subtitle}</p>
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-800">
                {track.steps.map((step, idx) => (
                  <div key={step.label} className="space-y-2">
                    <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 space-y-1">
                      <p className="text-xs sm:text-sm font-extrabold text-white">{step.label}</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{step.detail}</p>
                    </div>
                    {idx < track.steps.length - 1 && (
                      <div className="flex justify-center text-slate-500" aria-hidden="true">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v14m-5-5l5 5 5-5" /></svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className={`rounded-xl border px-3 py-2.5 text-center text-xs font-extrabold ${track.footerClass}`}>{track.footerBadge}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        <div className="rounded-2xl bg-slate-950 border border-slate-800 p-6 space-y-4">
          <div className="space-y-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300 block">Commission-Free W-2 Billing • Clear Rate Logic</span>
            <h3 className="text-lg sm:text-xl font-black text-white">Why Our W-2 Rate Beats Traditional Agencies Without Cutting Corners</h3>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">
            Traditional staffing agencies charge 50%+ markups because roughly half of every bill funds headhunter commissions. <strong className="text-white">Special Sauce saves you money by eliminating the need for recruiter middlemen.</strong> <strong className="text-white">Our Secured Workforce Ecosystem</strong> puts you in complete control of qualifying your future workforce in a fraction of the time it takes you today—something impossible with unverified resume piles and agency gatekeepers. On W-2 roles, you only pay statutory W-2 employer coverage, 100% funded Net-30 payroll, and a transparent, commission-free rate.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 space-y-1">
              <span className="text-xs font-extrabold text-slate-300 block">Starter ($299/mo)</span>
              <p className="text-xs sm:text-sm font-black text-white">Preferred W-2 Rate</p>
              <p className="text-xs text-slate-300">$0 conversion fee</p>
            </div>
            <div className="rounded-xl bg-slate-900 border border-indigo-500/50 p-3.5 space-y-1">
              <span className="text-xs font-extrabold text-indigo-300 block">Growth ($599/mo)</span>
              <p className="text-xs sm:text-sm font-black text-amber-300">-1% W-2 Markup</p>
              <p className="text-xs text-slate-300">Automatic rate reduction</p>
            </div>
            <div className="rounded-xl bg-slate-900 border border-emerald-500/50 p-3.5 space-y-1">
              <span className="text-xs font-extrabold text-emerald-300 block">Enterprise ($999/mo)</span>
              <p className="text-xs sm:text-sm font-black text-emerald-300">-2% W-2 Markup</p>
              <p className="text-xs text-slate-300">Lowest volume W-2 rate</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-950 border border-slate-800 p-6 space-y-4">
          <div className="space-y-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 block">4 Institutional Compliance Pillars • Included on Every W-2 Role</span>
            <h3 className="text-lg sm:text-xl font-black text-white">Full U.S. Employer of Record Protection Inside One Portal</h3>
          </div>
          <ul className="space-y-3 text-sm text-slate-200 leading-relaxed">
            <li className="flex items-start gap-2.5"><span className="text-emerald-400 font-extrabold shrink-0">✓</span><span><strong className="text-white">Statutory Payroll Taxes &amp; Workers' Comp:</strong> Employer FICA, FUTA/SUTA, multi-state withholdings, Workers' Comp, and year-end W-2 filings.</span></li>
            <li className="flex items-start gap-2.5"><span className="text-emerald-400 font-extrabold shrink-0">✓</span><span><strong className="text-white">Automated Digital Onboarding:</strong> Digital Form I-9, W-4, direct deposit, and optional background/drug screening launched from your thread.</span></li>
            <li className="flex items-start gap-2.5"><span className="text-emerald-400 font-extrabold shrink-0">✓</span><span><strong className="text-white">100% Funded Payroll on Net-30 Invoices:</strong> Professionals receive scheduled W-2 direct deposits while you pay one consolidated Net-30 invoice.</span></li>
            <li className="flex items-start gap-2.5"><span className="text-emerald-400 font-extrabold shrink-0">✓</span><span><strong className="text-white">$0 Conversion &amp; Hardware Return Gates:</strong> Bring W-2 talent onto internal staff anytime for $0, or wrap up with tracked equipment return controls.</span></li>
          </ul>
        </div>
      </div>
    </section>
  )
}

export default function W2HiringGuideView({
  isDashboard = false,
}: {
  isDashboard?: boolean
}) {
  return (
    <div className="space-y-10">
      <section className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 sm:p-10 space-y-5 shadow-lg">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-extrabold uppercase tracking-wider w-fit">
          Built-In U.S. W-2 Employer of Record (EOR) • 4 Hiring Methodologies
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
          Four Ways to Hire—Backed by Built-In U.S. W-2 Employer of Record, Net-30 Billing &amp; $0 Conversion Fees.
        </h1>
        <p className="text-sm sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
          Every Protected Role on Special Sauce supports Full-Time Direct Hire onto your own payroll alongside three built-in W-2 Employer of Record (EOR) tracks—W-2 Contract-to-Hire ($0 conversion fee), Limited W-2 Contract, and Indefinite W-2 Contract—giving Employers turnkey I-9/W-4 onboarding, statutory tax &amp; Workers' Comp coverage, and 100% funded Net-30 consolidated invoicing inside one portal.
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

      <HiringTracksFlowchart isDashboard={isDashboard} showGuideLink={false} />

      <section className="bg-indigo-950 text-white rounded-2xl border border-indigo-800 p-6 sm:p-8 space-y-3 shadow-sm">
        <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
          Clear Operational Structure • Turnkey W-2 Employer of Record
        </p>
        <h2 className="text-xl sm:text-2xl font-extrabold">
          Platform Verification by Special Sauce + Licensed U.S. W-2 Employer-of-Record Infrastructure
        </h2>
        <p className="text-sm sm:text-base text-indigo-100 leading-relaxed">
          Special Sauce Solutions LLC operates the secured workforce ecosystem—handling identity verification, TrueFit Score™ matching, the 2-Stage Privacy Vault, and lifecycle safeguards. Whenever you choose W-2 Contract-to-Hire, Limited W-2 Contract, or Indefinite W-2 Contract instead of Direct Hire, statutory Form I-9 and W-4 onboarding, scheduled W-2 direct deposits, federal and state employer payroll taxes, Workers' Compensation, year-end W-2 filings, and Net-30 consolidated employer billing are administered seamlessly under licensed U.S. W-2 employer-of-record infrastructure.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-3">
          <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">How Employers Benefit</p>
          <ul className="space-y-2.5 text-sm text-slate-200 leading-relaxed">
            <li>✓ <strong className="text-white">Commission-Free W-2 Billing &amp; $0 Conversion:</strong> Skip 50%+ agency recruiter markups and convert any W-2 contractor to full-time staff anytime for $0—plus automatic 1% and 2% W-2 markup reductions on Growth and Enterprise.</li>
            <li>✓ <strong className="text-white">100% Funded Net-30 Consolidated Billing:</strong> Offload digital I-9 and W-4 onboarding, payroll taxes, Workers' Comp, and multi-state compliance on one Net-30 invoice.</li>
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
