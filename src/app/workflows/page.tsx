'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export default function WorkflowsPage() {
  const [activeTab, setActiveTab] = useState<'candidate' | 'employer'>('candidate')

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col justify-between">
      <div>
        <PublicHeader />

        {/* Full-Bleed Dark Slate Hero with Static Right-Side 3D Angled Interface */}
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
                      specialsauce.io • 2-Stage Intro/Convo Privacy Handshake
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
              <span>$5 Professional &amp; $25 Employer One-Time Verify • $0/Mo Explorer Vault • Weekly 1-Yr Giveaway</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-xs">
              How Special Sauce Works{' '}
              <span className={activeTab === 'candidate' ? 'text-sky-400' : 'text-emerald-400'}>
                {activeTab === 'candidate' ? 'for Professionals' : 'for Employers'}
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Complete your one-time verification (<strong className="text-white">$5 Professionals / $25 Employers</strong>) to unlock our <strong className="text-emerald-400">$0/mo Explorer Sandbox</strong>, run <strong className="text-white">TrueFit Score™</strong> checks, and connect via our Intro/Convo Privacy Handshake.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/security"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 hover:border-sky-400 text-xs sm:text-sm font-extrabold transition-all shadow-md backdrop-blur-md"
              >
                🛡️ View Intro/Convo Vault &amp; Security →
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/40 text-xs sm:text-sm font-extrabold transition-all backdrop-blur-md"
              >
                ★ Start for $5 • Plans &amp; Weekly Giveaway
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

          {/* ==============================================================
              TAB 1: PROFESSIONAL WORKFLOW (5 STEPS)
             ============================================================== */}
          {activeTab === 'candidate' ? (
            <section className="rounded-3xl border-2 border-indigo-500/60 bg-slate-950 p-6 sm:p-10 shadow-xl space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shrink-0">
                    P
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">
                      $5 One-Time ID Verification • $0/Mo Explorer Forever • Weekly 1-Yr Prestige Drawing
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      Professional Workflow: Verified Onboarding to Protected Offers
                    </h2>
                  </div>
                </div>
                <Link
                  href="/signup/candidate"
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-extrabold text-center transition-colors shrink-0"
                >
                  Start Professional Verification ($5) →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Step 1 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 1 • Explorer Onboarding ($5 One-Time)
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      1. Enroll in Explorer ($5 One-Time — $0/Mo Forever)
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Complete your one-time <strong>$5 ID Verification Pass</strong> to unlock the <strong>Explorer Plan at $0/mo forever</strong>—or activate Professional ($12/mo) or Prestige ($19/mo) immediately.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Earn automatic entry into our <strong>Weekly Drawing</strong> for a free 1-year Prestige membership.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Zero bots, fake profiles, or scrapers—every professional in the marketplace is a verified human.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ $0/Mo Explorer Sandbox &amp; Weekly 1-Yr Prestige Drawing Entry
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 2 • 1-Time Biometric Trust Gate
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      2. Pass 1-Time Stripe Real-Person ID Check
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Included with your $5 One-Time Verification Pass—complete a 60-second government photo ID and live selfie check via Stripe Identity.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Zero raw ID photos or biometrics ever touch Special Sauce servers (only a cryptographic verification token is stored).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Activates your permanent <strong>🛡️ Verified Professional Shield</strong> in Employer Talent Search.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ Verified Professional Shield &amp; Live Employer Search Placement
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 3 • Conversation Resume Vault
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      3. Upload Resume &amp; Set Dealbreakers
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Upload your PDF resume once to auto-extract your anonymous skill matrix, tenure, and certifications.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Your name, email, phone, and raw PDF stay locked inside your <strong>Conversation Vault</strong> while employers see only your anonymized <strong>Professional #ID</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Set your minimum salary expectations, work model (Remote/Hybrid/On-Site), and hard dealbreakers upfront.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ Anonymized Professional #ID &amp; Dealbreaker Firewall
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 4 • Inbound Free or Outbound Upgrades
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      4. Check TrueFit Score™ &amp; Connect
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Run unlimited <strong>TrueFit Score™</strong> checks on verified roles with upfront salary bands (every post expires in 30 days—zero ghost jobs).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Receive and accept <strong>Unlimited Inbound Employer Invitations</strong> at <strong>$0/mo forever</strong> in Explorer mode.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Upgrade anytime to <strong>Professional ($12/mo)</strong> for 15 outbound applications/mo + permanent ★ Founding Member Badge, or <strong>Prestige ($19/mo)</strong> for unlimited outbound applications + Top-Priority Spotlight—and <strong>downgrade back to Explorer ($0/mo)</strong> anytime once hired.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ Free Inbound Invitations, 40%+ TrueFit™ Outbound Apps &amp; Founding Badge
                  </div>
                </div>

                {/* Step 5 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5 md:col-span-2">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 5 • Intro/Convo Privacy Handshake
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      5. The Introduction (Chat First), The Conversation (Release Resume When Ready)
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span><strong>The Introduction (First-Name Encrypted Chat):</strong> Accepting an Employer Invitation or getting your outbound application unlocked reveals the verified company name and opens encrypted chat showing only your <strong>First Name + Last Initial</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span><strong>The Conversation (Professional-Controlled Vault Release):</strong> Your contact info and raw PDF resume remain hidden until you explicitly click <strong>&ldquo;Release Resume &amp; Contact Vault&rdquo;</strong> inside the chat thread.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ Full Mutual Intro &amp; 1-Hour Cryptographically Signed PDF Resume Link
                  </div>
                </div>
              </div>
            </section>
          ) : (
            /* ==============================================================
               TAB 2: EMPLOYER WORKFLOW (5 STEPS)
               ============================================================== */
            <section className="rounded-3xl border-2 border-emerald-500/60 bg-slate-950 p-6 sm:p-10 shadow-xl space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shrink-0">
                    E
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                      $25 One-Time Org Verify • $0/Mo Explorer Sandbox • Accepted-Only Invitation Guarantee
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      Employer Workflow: Verified Sandbox to Protected Hiring
                    </h2>
                  </div>
                </div>
                <Link
                  href="/signup/employer"
                  className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-extrabold text-center transition-colors shrink-0"
                >
                  Start Employer Verification ($25) →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Employer Step 1 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 1 • $25 Verification Pass &amp; Sandbox
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      1. Unlock $0/Mo Employer Explorer Sandbox ($25 One-Time)
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Complete the <strong>$25 One-Time Employer Verification Pass</strong> to unlock the <strong>Employer Explorer Sandbox ($0/mo)</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Configure your company profile, select your Industry Vertical, and draft role specifications.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Preview live verified professional match counts and run <strong>TrueFit Score™</strong> checks before activating a monthly plan.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ $0/Mo Employer Explorer Sandbox &amp; Live Professional Match Previews
                  </div>
                </div>

                {/* Employer Step 2 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 2 • Trust Gate Pillar 1
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      2. Verify Corporate Domain &amp; 90-Day Age
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Confirm corporate domain ownership via work-email match or DNS TXT verification.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Automated DNS MX and IANA/RDAP registry lookup verifies your domain age.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Blocks newly registered burner domains (&lt;90 days old) and free webmail accounts from harvesting talent.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ Domain &amp; 90-Day RDAP Verified Distinction
                  </div>
                </div>

                {/* Employer Step 3 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 3 • Trust Gate Pillars 2 &amp; 3
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      3. Attest IRS EIN &amp; Representative Stripe ID
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Submit your 9-digit IRS Federal Tax ID (EIN) &amp; State of Incorporation (Pillar 2).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Complete the 1-time 60-second Stripe Identity biometric check for the Account Admin (Pillar 3).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Proves to professionals that every protected role belongs to a real, accountable organization.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ 3-Pillar Verified Organization Shield
                  </div>
                </div>

                {/* Employer Step 4 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 4 • Founding Rate Plans &amp; Invitations
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      4. Activate Founding Plan, Publish Roles &amp; Invite Pros
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Lock in 12-Month Founding Partner Rates when ready to engage: <strong>Starter ($149/mo)</strong>, <strong>Growth ($499/mo)</strong>, or <strong>Enterprise ($1,250/mo)</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Publish company-shielded roles with upfront salary bands; reviewing and unlocking inbound 40%+ TrueFit™ applicants is <strong>100% free (0 credits)</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Every outbound Professional Invitation is backed by our <strong>Accepted-Only Guarantee</strong>—declined invitations are auto-refunded, and optional Rollover Credit Top-Up Packs never expire while active.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ 12-Mo Rate Lock, Live Protected Roles &amp; Refund-Protected Invitations
                  </div>
                </div>

                {/* Employer Step 5 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5 md:col-span-2">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 5 • Intro/Convo Handshake &amp; ATS Sync
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      5. The Introduction Chat, The Conversation Vault &amp; Enterprise HR Sync
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Message accepted Professional Invitations or unlocked inbound applicants directly in <strong>The Introduction Encrypted Chat</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Receive 1-hour cryptographically signed PDF resumes and direct contact details upon <strong>The Conversation Vault Release</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Collaborate with team/recruiter seats (2 on Starter, 5 on Growth, Unlimited on Enterprise) and export unlocked professionals via CSV or auto-sync directly to <strong>Workday &amp; Greenhouse</strong> (Enterprise).</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ Conversation Resume Access, Team Seats &amp; Enterprise ATS Sync
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ==============================================================
              BOTTOM UNIFIED SECTION: THE 2-STAGE PRIVACY HANDSHAKE
             ============================================================== */}
          <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-10 shadow-xl space-y-8">
            <div className="flex flex-col gap-5 pb-6 border-b border-slate-800">
              <div className="space-y-2 max-w-4xl">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  Where Both Workflows Meet • The Intro/Convo Privacy Handshake
                </span>
                <h2 className="text-xl sm:text-3xl font-black text-white">
                  Zero Unsolicited Spam, Zero Burner-Domain Harvesting &amp; 100% Professional-Controlled Disclosure
                </h2>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                <Link
                  href="/signup/candidate"
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-extrabold transition-colors"
                >
                  Start Professional Workflow ($5) →
                </Link>
                <Link
                  href="/signup/employer"
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs sm:text-sm font-extrabold transition-colors"
                >
                  Start Employer Workflow ($25) →
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-3">
                <h3 className="text-base sm:text-lg font-black text-white">
                  1. Pre-Match (Mutual Identity Protection)
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  Professionals appear as <strong className="text-emerald-400">Professional #ID</strong> with structured skills, dealbreakers, and TrueFit Score™s. Employers appear by Industry Vertical, Company Stage, and upfront salary bands—preventing resume harvesting and poaching risk.
                </p>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-3">
                <h3 className="text-base sm:text-lg font-black text-white">
                  2. The Introduction (Encrypted Chat)
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  When a professional accepts an outbound invitation or an employer unlocks an inbound application, the verified company identity is revealed and encrypted live chat opens using <strong className="text-amber-300">First Name + Last Initial</strong>.
                </p>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-3">
                <h3 className="text-base sm:text-lg font-black text-white">
                  3. The Conversation (Full Resume &amp; ATS)
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  Only when the professional clicks <strong className="text-white">Release Resume &amp; Contact Vault</strong> does the employer receive the 1-hour cryptographically signed PDF resume link and direct contact credentials.
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
