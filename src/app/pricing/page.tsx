import Link from 'next/link'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata = {
  title: 'Pricing, Plans & Founding Member Perks | specialsauce.io',
  description:
    'Compare Special Sauce Candidate and Employer plans side-by-side, including 30-Day Founding Member and Founding Partner launch rewards.',
}

export default function PricingMatrixPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col justify-between">
      <div>
        <PublicHeader />

        {/* Hero Header */}
        <section className="py-16 md:py-20 px-6 md:px-12 max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold uppercase tracking-wide">
            <span>★ Early-Access Launch • Founding Memberships Open</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Transparent Plans &amp; Founding Rewards
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Whether you&apos;re exploring your next career move in privacy or hiring verified talent across 28 industry verticals, compare every plan and launch reward side by side.
          </p>
        </section>

        {/* Main Matrix Container */}
        <main className="max-w-7xl mx-auto px-6 md:px-12 pb-24 space-y-20">
          {/* CANDIDATE PLANS */}
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                For Job Seekers &amp; Passive Professionals
              </span>
              <h2 className="text-3xl font-black text-slate-900">
                Candidate Plans &amp; Founding Member Perks
              </h2>
              <p className="text-sm text-slate-500 max-w-xl mx-auto">
                Your passive career vault and inbound employer pitches stay $0 forever. Verify during launch to claim 30 days of Founding Member rewards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Tier 1: Free Explorer */}
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Passive Career Vault
                    </span>
                    <h3 className="text-2xl font-black text-slate-900">Free Explorer</h3>
                    <div className="text-3xl font-black text-slate-900 mt-2">
                      $0 <span className="text-xs font-normal text-slate-500">/ forever</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Ideal for passive professionals who want to check AI Fit scores and receive inbound employer pitches without risking their current job.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-center gap-2">✓ Browse blind role feed &amp; real pay bands</li>
                    <li className="flex items-center gap-2">✓ Unlimited 5-Pillar AI Fit Radar checks</li>
                    <li className="flex items-center gap-2">✓ Unlimited inbound employer pitches &amp; chat</li>
                    <li className="flex items-center gap-2">✓ 2-Stage Identity &amp; Resume Vault protection</li>
                    <li className="flex items-center gap-2 text-slate-400">✕ Outbound blind applications</li>
                  </ul>
                </div>
                <Link
                  href="/signup/candidate"
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl text-center transition-colors"
                >
                  Create Free Vault →
                </Link>
              </div>

              {/* Tier 2: 30-Day Founding Member Launch */}
              <div className="bg-white p-8 rounded-2xl border-2 border-amber-500 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-900 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                  ★ Launch Window
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600">
                      Early-Access Enrollment
                    </span>
                    <h3 className="text-2xl font-black text-slate-900">Founding Member</h3>
                    <div className="text-3xl font-black text-slate-900 mt-2">
                      $0 <span className="text-xs font-normal text-slate-500">for 30 Days</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Verify your identity during our launch window to unlock 30 days of outbound access plus permanent lifetime founder privileges.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-center gap-2 font-bold text-amber-700">★ Permanent Gold Founding Member Badge</li>
                    <li className="flex items-center gap-2 font-bold text-amber-700">★ Permanent 1.25x XP Rank Multiplier</li>
                    <li className="flex items-center gap-2">✓ <strong>15 Free Outbound Blind Applications</strong> (30 days)</li>
                    <li className="flex items-center gap-2">✓ Lifetime <strong>$9/mo Founder&apos;s Rate Lock</strong> (25% off Pro)</li>
                    <li className="flex items-center gap-2">✓ Automatic $0 Passive Vault if you don&apos;t upgrade</li>
                  </ul>
                </div>
                <Link
                  href="/signup/candidate"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs rounded-xl text-center transition-colors shadow-sm"
                >
                  Claim Founding Member Status →
                </Link>
              </div>

              {/* Tier 3: Candidate Pro */}
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">
                      Active Job Seeker
                    </span>
                    <h3 className="text-2xl font-black text-slate-900">Candidate Pro</h3>
                    <div className="text-3xl font-black text-slate-900 mt-2">
                      $12 <span className="text-xs font-normal text-slate-500">/ mo ($9/mo for Founders)</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    For active professionals submitting ongoing outbound applications with priority placement in Employer Talent Search.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-center gap-2">✓ <strong>Unlimited Outbound Blind Applications</strong></li>
                    <li className="flex items-center gap-2">✓ Priority placement in Employer Talent Search</li>
                    <li className="flex items-center gap-2">✓ Unlimited 5-Pillar AI Fit Radar checks</li>
                    <li className="flex items-center gap-2">✓ Verified Candidate trust badge</li>
                    <li className="flex items-center gap-2">✓ Cancel or pause anytime back to $0 Vault</li>
                  </ul>
                </div>
                <Link
                  href="/signup/candidate"
                  className="w-full py-3 bg-slate-900 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl text-center transition-colors"
                >
                  Start With 30-Day Launch Access →
                </Link>
              </div>
            </div>
          </div>

          {/* EMPLOYER PLANS */}
          <div className="space-y-8 pt-12 border-t border-slate-200">
            <div className="text-center space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                For Verified Companies &amp; Hiring Teams
              </span>
              <h2 className="text-3xl font-black text-slate-900">
                Employer Plans &amp; Founding Partner Perks
              </h2>
              <p className="text-sm text-slate-500 max-w-2xl mx-auto">
                Verify your corporate domain during launch to claim <strong>30 Days of Founding Partner Access ($99 Starter Value for $0)</strong>—including 5 active blind job slots, 10 outbound pitch credits, 2 team seats, and a permanent ★ Founding Partner badge.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Free Explorer */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Browse Only
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">Free Explorer</h3>
                  <div className="text-2xl font-black text-slate-900">$0</div>
                  <p className="text-xs text-slate-500">Explore the anonymized talent pool before subscribing.</p>
                  <ul className="space-y-2 text-xs text-slate-700">
                    <li>✓ Search anonymized talent pool</li>
                    <li>✓ Preview candidate skill &amp; language matrices</li>
                    <li className="text-slate-400">✕ Active job slots (0)</li>
                    <li className="text-slate-400">✕ Outbound pitch credits (0)</li>
                  </ul>
                </div>
                <Link
                  href="/signup/employer"
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl text-center"
                >
                  Create Employer Account
                </Link>
              </div>

              {/* Starter */}
              <div className="bg-white p-6 rounded-2xl border-2 border-indigo-600 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-900 text-[9px] font-black uppercase px-2.5 py-1 rounded-bl-lg">
                  ★ $0 First 30 Days
                </div>
                <div className="space-y-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600">
                    Small Teams + Launch Bonus
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">Starter</h3>
                  <div className="text-2xl font-black text-slate-900">
                    $99 <span className="text-xs font-normal text-slate-500">/mo</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Includes 30-day Founding Partner launch bonus upon domain verification.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-700 font-medium">
                    <li className="text-amber-700 font-bold">★ Permanent Founding Partner Badge</li>
                    <li>✓ <strong>3 Active Roles</strong> (5 during 30-day launch)</li>
                    <li>✓ <strong>10 Outbound Pitches / mo</strong></li>
                    <li>✓ Unlimited Free Inbound Applicant Unlocks</li>
                    <li>✓ <strong>2 Team Seats</strong></li>
                  </ul>
                </div>
                <Link
                  href="/signup/employer"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl text-center shadow-sm"
                >
                  Claim 30-Day Partner Access →
                </Link>
              </div>

              {/* Growth */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600">
                    Scaling Organizations
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">Growth</h3>
                  <div className="text-2xl font-black text-slate-900">
                    $299 <span className="text-xs font-normal text-slate-500">/mo</span>
                  </div>
                  <p className="text-xs text-slate-500">For mid-market teams hiring across multiple departments.</p>
                  <ul className="space-y-2 text-xs text-slate-700">
                    <li className="text-amber-700 font-bold">★ Permanent Founding Partner Badge</li>
                    <li>✓ <strong>10 Active Roles</strong></li>
                    <li>✓ <strong>35 Outbound Pitches / mo</strong></li>
                    <li>✓ Unlimited Free Inbound Applicant Unlocks</li>
                    <li>✓ <strong>5 Team Seats</strong> + BPO Partner Delegation</li>
                  </ul>
                </div>
                <Link
                  href="/signup/employer"
                  className="w-full py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl text-center"
                >
                  Select Growth →
                </Link>
              </div>

              {/* Enterprise */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600">
                    High-Volume &amp; Enterprise
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">Enterprise</h3>
                  <div className="text-2xl font-black text-slate-900">
                    $899 <span className="text-xs font-normal text-slate-500">/mo</span>
                  </div>
                  <p className="text-xs text-slate-500">For multi-location enterprises and authorized W-2 RPOs.</p>
                  <ul className="space-y-2 text-xs text-slate-700">
                    <li className="text-amber-700 font-bold">★ Permanent Founding Partner Badge</li>
                    <li>✓ <strong>Unlimited Active Roles</strong></li>
                    <li>✓ <strong>100 Outbound Pitches / mo</strong></li>
                    <li>✓ Unlimited Free Inbound Applicant Unlocks</li>
                    <li>✓ <strong>Unlimited Team Seats</strong> &amp; Priority Support</li>
                  </ul>
                </div>
                <Link
                  href="/signup/employer"
                  className="w-full py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl text-center"
                >
                  Select Enterprise →
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
