import Link from "next/link"

export default function InboundShieldGuideView({
  isDashboard = false,
}: {
  isDashboard?: boolean
}) {
  return (
    <div className="space-y-10">
      <section className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 sm:p-10 space-y-5 shadow-lg">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold uppercase tracking-wider w-fit">
          Personal Inbound Shield • Included Starting in Explorer ($0/mo)
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
          Make Cold Recruiters Verify the Role &amp; Pay Before You Share Your Resume or Time.
        </h1>
        <p className="text-sm sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
          Employed Professionals get vague 'got 15 minutes?' messages on LinkedIn and email every week. Handing over an updated resume, cell number, or exploratory call up front wastes time on mystery roles and feeds resume-harvesting databases. Personal Inbound Shield gives you single-use reply links that require the recruiter to verify the hiring company and share upfront pay before you take a call or share private contact details.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href={isDashboard ? "/dashboard/shield" : "/signup/professional"} className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition-colors">
            {isDashboard ? "Open Personal Inbound Shield →" : "Get Verified ($5 Once · $0/mo Explorer) →"}
          </Link>
          <Link href={isDashboard ? "/dashboard/billing" : "/pricing"} className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm transition-colors">
            {isDashboard ? "Back to Membership & Plan Settings" : "Compare Professional Plans"}
          </Link>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 space-y-6 shadow-xs">
        <div className="space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">
            Step-by-Step Workflow
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            How a One-Time Verification Link Works
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2">
            <p className="text-xs font-black uppercase tracking-wider text-indigo-700">Step 1 • Mint a Single-Use Link</p>
            <h3 className="text-base font-extrabold text-slate-900">Create a link with a private context note</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Generate an unlinkable verification URL in one click and save an optional encrypted note for yourself (such as who messaged you and on which channel). Nobody else ever sees your note.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2">
            <p className="text-xs font-black uppercase tracking-wider text-indigo-700">Step 2 • Zero Data Handed Over Up Front</p>
            <h3 className="text-base font-extrabold text-slate-900">Recruiter lands on a clean verification gate</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Instead of sending your PDF resume, personal email, or cell number into a recruiting database, your link opens a neutral verification screen with zero resume or contact data attached—so nothing can be scraped or forwarded.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2">
            <p className="text-xs font-black uppercase tracking-wider text-indigo-700">Step 3 • Employer &amp; Role Verification</p>
            <h3 className="text-base font-extrabold text-slate-900">Real company, real human, real Protected Role</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              To send you an invitation, the employer must complete business domain and entity verification, Stripe real-person ID verification, and attach an active Protected Role with upfront compensation.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2">
            <p className="text-xs font-black uppercase tracking-wider text-indigo-700">Step 4 • Automatic Single-Use Retirement</p>
            <h3 className="text-base font-extrabold text-slate-900">Link burns automatically after one delivery</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              As soon as that verified role arrives in your Invitations inbox alongside your private reminder note, the link permanently deactivates so it cannot be forwarded or reused.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Career Safety</p>
          <h3 className="text-lg font-extrabold">Protect Your Current Role</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Entertain serious outreach 365 days a year without ever handing a resume or personal phone number to an unverified stranger.
          </p>
        </div>
        <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Signal Over Noise</p>
          <h3 className="text-lg font-extrabold">Filter Out Commission Harvesters</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Automated spam bots and resume collectors drop off immediately at the verification gate—only verified hiring teams with real pay bands come through.
          </p>
        </div>
        <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Always Included</p>
          <h3 className="text-lg font-extrabold">Active at $0/mo Forever</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Included on Explorer ($5 one-time ID verification, 100% credited toward Month 1 if you subscribe) and stays active whenever you downgrade back to Explorer.
          </p>
        </div>
      </section>
    </div>
  )
}
