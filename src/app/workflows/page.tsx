'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export default function WorkflowsPage() {
  const [activeTab, setActiveTab] = useState<'candidate' | 'employer'>('candidate')

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col justify-between">
      <PublicHeader />
      <div className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden bg-[#0f172a] border-b border-slate-800 py-14 sm:py-18 md:py-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -left-24 w-[36rem] h-[36rem] rounded-full bg-emerald-500/10 blur-3xl z-0"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute inset-0 overflow-hidden z-0"
          >
            <div className="absolute top-1/2 right-[-6%] -translate-y-1/2 w-[42rem] h-[42rem] rounded-full bg-gradient-to-tr from-emerald-500/20 via-sky-500/15 to-indigo-500/20 blur-3xl" />

            <div
              className="absolute inset-0"
              style={{
                WebkitMaskImage:
                  'linear-gradient(to right, transparent 0%, transparent 46%, rgba(0,0,0,0.22) 60%, rgba(0,0,0,0.78) 76%, rgba(0,0,0,0.96) 92%)',
                maskImage:
                  'linear-gradient(to right, transparent 0%, transparent 46%, rgba(0,0,0,0.22) 60%, rgba(0,0,0,0.78) 76%, rgba(0,0,0,0.96) 92%)',
              }}
            >
              <div
                className="absolute -top-[2%] sm:-top-[5%] lg:-top-[8%] right-[-18%] sm:right-[-8%] lg:right-[-1%] w-[920px] sm:w-[1120px] lg:w-[1260px] opacity-85"
                style={{
                  transform:
                    'perspective(1350px) rotateY(-34deg) rotateX(12deg) rotateZ(-4deg) scale(1.06)',
                  transformOrigin: 'center right',
                }}
              >
                <div className="rounded-2xl border border-emerald-400/25 bg-[#0a0f1c] p-2 shadow-[0_35px_90px_rgba(0,0,0,0.9)]">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-white/10 rounded-t-xl">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 tracking-wider">
                      specialsauce.io • Step-by-Step Platform Guide
                    </span>
                  </div>
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-b-xl bg-[#0a0f1c]">
                    <img
                      src="/media/ui-card-mutual-unlock.webp"
                      alt=""
                      className="w-full h-full object-cover object-left-top"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0f172a] to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/90 to-transparent" />
          </div>

          <div className="relative z-10 px-4 sm:px-6 md:px-12 max-w-5xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-emerald-300 text-xs sm:text-sm font-extrabold uppercase tracking-wide backdrop-blur-xs">
              <span>Simple, Step-by-Step Guide • Built for Real People</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-xs">
              How Special Sauce Works{' '}
              <span className={activeTab === 'candidate' ? 'text-sky-400' : 'text-emerald-400'}>
                {activeTab === 'candidate' ? 'for Professionals' : 'for Employers'}
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Get verified once, explore matches at $0/mo, and connect on your terms with complete privacy.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/security"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 hover:border-sky-400 text-xs sm:text-sm font-extrabold transition-all shadow-md backdrop-blur-md"
              >
                🛡️ Security &amp; Privacy →
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/40 text-xs sm:text-sm font-extrabold transition-all backdrop-blur-md"
              >
                ★ View Plans &amp; Pricing
              </Link>
            </div>
          </div>
        </section>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-10 sm:py-14 space-y-10 sm:space-y-12">
          {/* Interactive Workflow Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('candidate')}
              className={`p-4 sm:p-5 rounded-2xl border-2 font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 transition-all cursor-pointer ${
                activeTab === 'candidate'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center text-xs font-black">
                P
              </span>
              <span>Professional Workflow (5 Steps)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('employer')}
              className={`p-4 sm:p-5 rounded-2xl border-2 font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 transition-all cursor-pointer ${
                activeTab === 'employer'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center text-xs font-black">
                E
              </span>
              <span>Employer Workflow (5 Steps)</span>
            </button>
          </div>

          {activeTab === 'candidate' ? (
            <section className="rounded-3xl border-2 border-indigo-500/60 bg-slate-950 p-6 sm:p-10 shadow-xl space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shrink-0">
                    P
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">
                      $5 One-Time Verification • $0/Mo Explorer Mode
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      Professional Workflow: Private Profile to Direct Offers
                    </h2>
                  </div>
                </div>
                <Link
                  href="/signup/candidate"
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-extrabold text-center transition-colors shrink-0"
                >
                  Get Started ($5) →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Step 1 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 1 • Get Started
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      1. Unlock Explorer Mode ($5 Once)
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Pay <strong>$5 once</strong> for lifetime verification and $0/mo Explorer access forever.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Automatically enter our <strong>Weekly Drawing</strong> for a free 1-year Prestige membership.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ $0/Mo Explorer Access &amp; Weekly Drawing
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 2 • Identity Check
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      2. Quick Stripe Photo ID Check
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Complete a 60-second photo ID check powered securely by Stripe.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Earns your permanent <strong>🛡️ Verified Professional Shield</strong> in Employer Search.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ Verified Professional Shield
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 3 • Private Profile
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      3. Upload Resume &amp; Set Preferences
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Upload your PDF resume once to organize your skills, experience, and certifications automatically.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Set your minimum pay and work model while keeping your name and contact info hidden.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ Anonymous Skill Profile &amp; Pay Filter
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 4 • Match &amp; Apply
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      4. Check Your Fit &amp; Connect
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Check your <strong>TrueFit Score™</strong> on roles with upfront pay and accept employer invitations free at $0/mo.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Upgrade to <strong>Professional ($12/mo)</strong> or <strong>Prestige ($19/mo)</strong> anytime to submit outbound applications.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ Free Invitations &amp; Outbound Applications
                  </div>
                </div>

                {/* Step 5 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5 md:col-span-2">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 5 • Privacy Handshake
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      5. Chat First, Share Your Resume When Ready
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span><strong>The Introduction:</strong> See the verified company name and chat directly while showing only your first name and last initial.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span><strong>The Conversation:</strong> Click <strong>Release Resume &amp; Contact Vault</strong> only when you are ready to share your full resume and contact details.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ Direct Chat &amp; One-Click Resume Release
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-3xl border-2 border-emerald-500/60 bg-slate-950 p-6 sm:p-10 shadow-xl space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shrink-0">
                    E
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                      $25 One-Time Verification • $0/Mo Sandbox • Refund-Protected Invitations
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      Employer Workflow: Verified Sandbox to Great Hires
                    </h2>
                  </div>
                </div>
                <Link
                  href="/signup/employer"
                  className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-extrabold text-center transition-colors shrink-0"
                >
                  Verify Organization ($25) →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Employer Step 1 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 1 • Sandbox Access
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      1. Unlock Your $0/Mo Sandbox ($25 Once)
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Complete the <strong>$25 Organization Verification Pass</strong> to access your $0/mo Sandbox.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Draft roles and preview verified talent matches before starting a monthly plan.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ $0/Mo Sandbox &amp; Live Match Previews
                  </div>
                </div>

                {/* Employer Step 2 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 2 • Domain Check
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      2. Confirm Your Business Domain
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Verify your company domain automatically using your work email.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Keeps free webmail and fake accounts out of the marketplace.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ Verified Business Domain Badge
                  </div>
                </div>

                {/* Employer Step 3 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 3 • Business &amp; Admin Check
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      3. Confirm EIN &amp; Admin ID
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Enter your business tax ID (EIN) and complete a 60-second Stripe ID check for your account admin.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Shows professionals that every role belongs to a real, trusted company.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ Verified Organization Shield
                  </div>
                </div>

                {/* Employer Step 4 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 4 • Post &amp; Invite
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      4. Publish Roles &amp; Invite Talent
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Activate <strong>Starter ($149/mo)</strong>, <strong>Growth ($499/mo)</strong>, or <strong>Enterprise ($1,250/mo)</strong> when ready to hire.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Inbound applicants are 100% free to unlock, and declined outbound invitations are automatically refunded.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ Live Roles &amp; Refund-Protected Invitations
                  </div>
                </div>

                {/* Employer Step 5 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5 md:col-span-2">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 5 • Chat &amp; Hire
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      5. Direct Chat, Resume Download &amp; Team Sync
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Chat directly with matched professionals and download their full PDF resume once released.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Collaborate with your team seats, export via CSV, or auto-sync with <strong>Workday &amp; Greenhouse</strong> (Enterprise).</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ Full Resume Access, Team Seats &amp; HR Sync
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Bottom Unified Privacy Handshake Summary */}
          <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-10 shadow-xl space-y-8">
            <div className="flex flex-col gap-5 pb-6 border-b border-slate-800">
              <div className="space-y-2 max-w-4xl">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  Where Both Sides Meet • The Privacy Handshake
                </span>
                <h2 className="text-xl sm:text-3xl font-black text-white">
                  Mutual Respect, Upfront Pay &amp; Complete Privacy Control
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-3">
                <h3 className="text-base sm:text-lg font-black text-white">
                  1. Anonymous Discovery
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  Professionals appear as <strong className="text-emerald-400">Professional #ID</strong> showing skills and experience. Employers show industry, company size, and upfront pay bands.
                </p>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-3">
                <h3 className="text-base sm:text-lg font-black text-white">
                  2. The Introduction (Private Chat)
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  When an invitation is accepted or an application is unlocked, the verified company name is revealed and chat opens using <strong className="text-amber-300">First Name + Last Initial</strong>.
                </p>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-3">
                <h3 className="text-base sm:text-lg font-black text-white">
                  3. The Conversation (Resume Shared)
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  When ready to move forward, the professional clicks <strong className="text-white">Release Resume &amp; Contact Vault</strong> to share their full PDF resume and direct email.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>

      <PublicFooter />
    </div>
  )
}
