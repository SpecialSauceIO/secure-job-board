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
          Vet External Leads and Cold DMs Before Revealing Your Company or Pay Band.
        </h1>
        <p className="text-sm sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
          Hiring teams routinely discover promising talent on LinkedIn or GitHub—and executives get flooded with unsolicited DMs asking for interviews. Verified Hiring Bridge lets you generate single-use Protected Role verification links that enforce Stripe real-person ID verification and a 40%+ TrueFit Score™ qualification check before opening a conversation.
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
          <p className="text-xs font-black uppercase tracking-wider text-indigo-600">Mode 1 • Outbound Sourcing</p>
          <h2 className="text-xl font-extrabold text-slate-900">Invite External LinkedIn, GitHub &amp; Referral Leads</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Found a standout specialist outside Special Sauce? Mint a single-use Outbound Sourcing link tied to your active Protected Role with an encrypted hiring-team note. They verify identity, clear your 40%+ TrueFit™ bar, and appear directly in your Sent Invitations pipeline.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-3 shadow-xs">
          <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Mode 2 • Inbound DM Gate</p>
          <h2 className="text-xl font-extrabold text-slate-900">Filter Unsolicited DMs Without Spending Credits</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            When applicants message your founders or recruiters directly, reply with a one-time Inbound DM Gate link instead of reviewing unverified PDFs. Qualified, ID-verified respondents land cleanly in Inbound Applications at zero cost to your monthly outbound invitation credits.
          </p>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 space-y-6 shadow-xs">
        <div className="space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">Confidentiality &amp; Verification</p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Four Protections Built Into Every Link</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2">
            <h3 className="text-base font-extrabold text-slate-900">1. Private Verification Gate Protects Confidential Searches</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Unverified visitors, competitors, and scrapers never see your company identity, pay band, or full role specification when opening the link.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2">
            <h3 className="text-base font-extrabold text-slate-900">2. Regulated Stripe Real-Person ID Check</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every external applicant proves real-human identity before they can redeem your link—stopping automated spam and proxy impersonation at the door.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2">
            <h3 className="text-base font-extrabold text-slate-900">3. Enforced 40%+ TrueFit Score™ Alignment</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Structured skills, experience tenure, and certifications are checked automatically against your role before the submission reaches your hiring team.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2">
            <h3 className="text-base font-extrabold text-slate-900">4. Automatic Single-Use Burn</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Each link deactivates the moment one qualified Professional redeems it (or when the role closes), ensuring a link can never be reposted or spammed.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
