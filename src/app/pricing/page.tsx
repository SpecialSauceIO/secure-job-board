import Link from 'next/link'
import Image from 'next/image'

export default function PricingMatrixPage() {
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
              href="/security"
              className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Security &amp; Trust
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
      <section className="py-16 md:py-20 px-6 md:px-12 max-w-5xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold uppercase tracking-wide">
          <span>★ Early-Access Launch • Founding Memberships Open</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Transparent Plans &amp; Founding Rewards
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Whether you&apos;re exploring your next career move or scaling an enterprise team, compare our features, rewards, and pricing below.
        </p>
      </section>

      {/* Main Matrix Container */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 pb-24 space-y-20">
        {/* CANDIDATE PLANS */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              For Job Seekers &amp; Passive Talent
            </span>
            <h2 className="text-3xl font-black text-slate-900">
              Candidate Plans &amp; Founding Member Perks
            </h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              Your passive career vault stays 100% free forever. Upgrade to Pro for active outbound applications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Tier 1: Free Explorer */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Explorer
                  </span>
                  <h3 className="text-2xl font-black text-slate-900">Free Tier</h3>
                  <div className="text-3xl font-black text-slate-900 mt-2">
                    $0 <span className="text-xs font-normal text-slate-500">/ forever</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ideal for passive professionals monitoring the market without active job hunting.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2">✓ Browse blind role feed</li>
                  <li className="flex items-center gap-2">✓ Unlimited 5-Pillar AI Fit checks</li>
                  <li className="flex items-center gap-2">✓ Unlimited inbound employer chats</li>
                  <li className="flex items-center gap-2 text-slate-400">✕ Outbound applications (Inbound only)</li>
                </ul>
              </div>
              <Link
                href="/signup/candidate"
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl text-center transition-colors"
              >
                Get Started Free →
              </Link>
            </div>

            {/* Tier 2: 7-Day Launch Trial */}
            <div className="bg-white p-8 rounded-2xl border-2 border-amber-500 shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-500 text-slate-900 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                ★ Recommended
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600">
                    Launch Window
                  </span>
                  <h3 className="text-2xl font-black text-slate-900">Founding Member</h3>
                  <div className="text-3xl font-black text-slate-900 mt-2">
                    $0 <span className="text-xs font-normal text-slate-500">for 30 Days</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Verify your identity during launch to claim permanent status and launch bonus perks.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2 font-bold text-amber-700">✓ Permanent Gold Founder Badge</li>
                  <li className="flex items-center gap-2 font-bold text-amber-700">✓ 1.25x XP Rank Multiplier</li>
                  <li className="flex items-center gap-2">✓ 15 Free Outbound Blind Applications</li>
                  <li className="flex items-center gap-2">✓ Lifetime $9/mo Pro rate lock</li>
                </ul>
              </div>
              <Link
                href="/signup/candidate"
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs rounded-xl text-center transition-colors shadow-sm"
              >
                Claim Founding Status →
              </Link>
            </div>

            {/* Tier 3: Candidate Pro */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">
                    Active Seeker
                  </span>
                  <h3 className="text-2xl font-black text-slate-900">Candidate Pro</h3>
                  <div className="text-3xl font-black text-slate-900 mt-2">
                    $12 <span className="text-xs font-normal text-slate-500">/ mo</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  For active professionals seeking immediate career transitions with unlimited outreach.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2">✓ Unlimited outbound applications</li>
                  <li className="flex items-center gap-2">✓ Priority placement in talent search</li>
                  <li className="flex items-center gap-2">✓ Advanced salary &amp; perk filters</li>
                  <li className="flex items-center gap-2">✓ Verified identity badge</li>
                </ul>
              </div>
              <Link
                href="/signup/candidate"
                className="w-full py-3 bg-slate-900 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl text-center transition-colors"
              >
                Upgrade to Pro →
              </Link>
            </div>
          </div>
        </div>

        {/* EMPLOYER PLANS */}
        <div className="space-y-8 pt-12 border-t border-slate-200">
          <div className="text-center space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              For Hiring Teams &amp; Companies
            </span>
            <h2 className="text-3xl font-black text-slate-900">
              Employer Plans &amp; Founding Partner Perks
            </h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              Post active roles, screen with 5-Point AI Fit, and pitch top verified talent directly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Free Explorer */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-slate-900">Explorer</h3>
                <div className="text-2xl font-black text-slate-900">$0</div>
                <p className="text-xs text-slate-500">Browse talent pool &amp; test platform features.</p>
                <ul className="space-y-2 text-xs text-slate-700">
                  <li>✓ Browse candidate pool</li>
                  <li>✓ Unlimited AI Fit previews</li>
                  <li className="text-slate-400">✕ Active job posting ($0 slots)</li>
                </ul>
              </div>
              <Link
                href="/signup/employer"
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl text-center"
              >
                Get Started
              </Link>
            </div>

            {/* Starter */}
            <div className="bg-white p-6 rounded-2xl border-2 border-indigo-600 shadow-md flex flex-col justify-between space-y-6 relative">
              <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-bl-lg">
                Popular
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-slate-900">Starter</h3>
                <div className="text-2xl font-black text-slate-900">$99 <span className="text-xs font-normal text-slate-500">/mo</span></div>
                <p className="text-xs text-slate-500">For growing teams and startups.</p>
                <ul className="space-y-2 text-xs text-slate-700 font-medium">
                  <li>✓ <strong>3 Active Roles</strong></li>
                  <li>✓ <strong>10 Outbound Pitches / mo</strong></li>
                  <li>✓ Unlimited Inbound Unlocks</li>
                  <li>✓ 2 Team Seats</li>
                </ul>
              </div>
              <Link
                href="/signup/employer"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl text-center shadow-sm"
              >
                Start Starter Trial →
              </Link>
            </div>

            {/* Growth */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-slate-900">Growth</h3>
                <div className="text-2xl font-black text-slate-900">$299 <span className="text-xs font-normal text-slate-500">/mo</span></div>
                <p className="text-xs text-slate-500">For mid-market and scaling businesses.</p>
                <ul className="space-y-2 text-xs text-slate-700">
                  <li>✓ <strong>10 Active Roles</strong></li>
                  <li>✓ <strong>35 Outbound Pitches / mo</strong></li>
                  <li>✓ Unlimited Inbound Unlocks</li>
                  <li>✓ 5 Team Seats</li>
                </ul>
              </div>
              <Link
                href="/signup/employer"
                className="w-full py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl text-center"
              >
                Select Growth
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-slate-900">Enterprise</h3>
                <div className="text-2xl font-black text-slate-900">$899 <span className="text-xs font-normal text-slate-500">/mo</span></div>
                <p className="text-xs text-slate-500">For enterprise recruiting and agencies.</p>
                <ul className="space-y-2 text-xs text-slate-700">
                  <li>✓ <strong>Unlimited Active Roles</strong></li>
                  <li>✓ <strong>100 Outbound Pitches / mo</strong></li>
                  <li>✓ Unlimited Inbound Unlocks</li>
                  <li>✓ Unlimited Team Seats &amp; Support</li>
                </ul>
              </div>
              <Link
                href="/signup/employer"
                className="w-full py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl text-center"
              >
                Select Enterprise
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
