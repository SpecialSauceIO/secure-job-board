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
                    'perspective(1350px) rotateY(-30deg) rotateX(8deg) rotateZ(-3deg) scale(1.32)',
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
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-b-xl bg-[#0a0f1c]">
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
              <span>Free Upfront Seeding • 30-Day Free Trial • Intro/Convo Privacy Vault</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-xs">
              How Special Sauce Works{' '}
              <span className={activeTab === 'candidate' ? 'text-sky-400' : 'text-emerald-400'}>
                {activeTab === 'candidate' ? 'for Candidates' : 'for Employers'}
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Build your profile or stage open roles and run <strong className="text-white">TrueFit Score™</strong> checks for <strong className="text-emerald-400">free</strong>. When you are ready to connect, start a <strong className="text-white">30-Day Free Trial</strong> backed by 1-time real-person ID verification and our Intro/Convo Privacy Handshake.
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
                ★ 30-Day Free Trial • Plans &amp; Perks
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
                C
              </span>
              <span>Candidate Workflow (5 Steps)</span>
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
              TAB 1: CANDIDATE WORKFLOW (5 STEPS)
             ============================================================== */}
          {activeTab === 'candidate' ? (
            <section className="rounded-3xl border-2 border-indigo-500/60 bg-slate-950 p-6 sm:p-10 shadow-xl space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shrink-0">
                    C
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">
                      Free Profile Seeding • 30-Day Free Trial • Intro/Convo Privacy Vault
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      Candidate Workflow: Free Seeding to Protected Offers
                    </h2>
                  </div>
                </div>
                <Link
                  href="/signup/candidate"
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-extrabold text-center transition-colors shrink-0"
                >
                  Start Free Candidate Vault →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Step 1 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 1 • Free Profile Seeding
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      1. Create Free Account &amp; Upload Resume
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Sign up for free (no credit card required to stage your vault).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Upload your PDF resume once to auto-extract your anonymous skill matrix and tenure.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Your anonymous profile is immediately <strong>Vault-Staged</strong> in Employer Talent Search while your name, email, phone, and PDF stay locked in your Conversation Vault.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ Anonymous Candidate #ID &amp; Vault-Staged Discovery
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 2 • Dealbreakers &amp; Free TrueFit Score™
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      2. Set Dealbreakers &amp; Check TrueFit Score™ Free
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Set your minimum salary expectations, work model (Remote/Hybrid/On-Site), and availability upfront.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Browse verified roles with upfront salary bands (every post expires in 30 days—zero ghost jobs).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Run unlimited <strong>TrueFit Score™</strong> checks on live roles for free before starting a trial.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ Dealbreaker Firewall &amp; Free TrueFit Score™
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 3 • 30-Day Free Trial
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      3. Start Your 30-Day Free Trial When Ready
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>When an employer sends you a Professional Invitation or you find a role to apply to, start a <strong>30-Day Free Trial</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Choose <strong>Explorer ($3/mo after trial)</strong> for inbound Professional Invitations, <strong>Professional ($9/mo)</strong> for 15 applications/mo, or <strong>Prestige ($15/mo)</strong> for unlimited applications.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Claim a permanent <strong>★ Founding Member</strong> distinction on your profile (cancel anytime before Day 30).</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ 30-Day Free Trial, Invitation Unlocks &amp; Outbound Applications
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 4 • 1-Time Biometric Trust Gate
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      4. Pass 1-Time Stripe Real-Person ID Check
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Included with every Candidate trial—complete a 60-second government photo ID and live selfie check via Stripe Identity.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Zero raw ID photos or biometrics ever touch Special Sauce servers (only a cryptographic verification token is stored).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>Upgrades your profile from Vault-Staged to <strong>🛡️ Identity-Verified</strong> with priority placement in Employer Search.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ Verified Candidate Shield &amp; Priority Search Ranking
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
                        <span><strong>The Introduction (First-Name Encrypted Chat):</strong> Accepting a Professional Invitation or getting your application unlocked reveals the verified company name and opens encrypted chat showing only your <strong>First Name + Last Initial</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span><strong>The Conversation (Candidate-Controlled Vault Release):</strong> Your contact info and raw PDF resume remain hidden until you explicitly click <strong>&ldquo;Release Resume &amp; Contact Vault&rdquo;</strong> inside the chat thread.</span>
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
                      Free Talent Discovery • 30-Day Free Trial • Accepted-Only Invitation Guarantee
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      Employer Workflow: Free Staging to Verified Hiring
                    </h2>
                  </div>
                </div>
                <Link
                  href="/signup/employer"
                  className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-extrabold text-center transition-colors shrink-0"
                >
                  Start Free Employer Account →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Employer Step 1 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 1 • Free Workspace &amp; Search
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      1. Stage Roles &amp; Search Anonymous Talent Free
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Create your employer workspace for free and select your Industry Vertical and company size.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Draft and stage open job descriptions before activating a plan.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Search the anonymous talent pool and run <strong>TrueFit Score™</strong> checks on candidates for free.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ Free Role Staging, Talent Directory Search &amp; TrueFit Score™ Checks
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
                      Step 3 • 30-Day Trial &amp; Pillars 2–3
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      3. Start 30-Day Free Trial, EIN &amp; Admin ID Check
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Start your <strong>30-Day Free Trial</strong> and lock in 12-Month Founding Partner Rates: <strong>Starter ($149/mo)</strong>, <strong>Growth ($499/mo)</strong>, or <strong>Enterprise ($1,250/mo)</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Submit your 9-digit IRS Federal Tax ID (EIN) &amp; State of Incorporation (Pillar 2).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Complete the 1-time 60-second Stripe Identity check for the Account Admin (Pillar 3).</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ 30-Day Free Trial, 12-Mo Rate Lock &amp; 3-Pillar Verified Shield
                  </div>
                </div>

                {/* Employer Step 4 */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
                      Step 4 • Protected Roles &amp; Invitations
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      4. Publish Protected Roles &amp; Invite Talent
                    </h3>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Publish company-shielded roles showing salary bands and industry while keeping your company name private until The Introduction chat.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Reviewing and unlocking inbound 40%+ TrueFit™ applicants is <strong>100% free (0 credits)</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>Every Professional Invitation is backed by our <strong>Accepted-Only Guarantee</strong>—declined invitations are auto-refunded.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-xs font-extrabold text-emerald-400">
                    Unlocks: ✓ Live Role Publishing &amp; Refund-Protected Professional Invitations
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
                        <span>Invite team/recruiter seats, export unlocked candidates via CSV, or auto-sync directly to <strong>Workday &amp; Greenhouse</strong> (Enterprise plan).</span>
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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div className="space-y-2 max-w-2xl">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  Where Both Workflows Meet • The Intro/Convo Privacy Handshake
                </span>
                <h2 className="text-xl sm:text-3xl font-black text-white">
                  Zero Unsolicited Spam, Zero Burner-Domain Harvesting &amp; 100% Candidate-Controlled Disclosure
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  href="/signup/candidate"
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-extrabold transition-colors"
                >
                  Start Candidate Workflow →
                </Link>
                <Link
                  href="/signup/employer"
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs sm:text-sm font-extrabold transition-colors"
                >
                  Start Employer Workflow →
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-3">
                <h3 className="text-base sm:text-lg font-black text-white">
                  1. Pre-Match (Mutual Identity Protection)
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  Candidates appear as <strong className="text-emerald-400">Candidate #ID</strong> with structured skills, dealbreakers, and TrueFit Score™s. Employers appear by Industry Vertical, Company Stage, and upfront salary bands—preventing resume harvesting and poaching risk.
                </p>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-3">
                <h3 className="text-base sm:text-lg font-black text-white">
                  2. The Introduction (Encrypted Chat)
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  When a candidate accepts an outbound pitch or an employer unlocks an inbound application, the verified company identity is revealed and encrypted live chat opens using <strong className="text-amber-300">First Name + Last Initial</strong>.
                </p>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-3">
                <h3 className="text-base sm:text-lg font-black text-white">
                  3. The Conversation (Full Resume &amp; ATS)
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  Only when the candidate clicks <strong className="text-white">Release Resume &amp; Contact Vault</strong> does the employer receive the 1-hour cryptographically signed PDF resume link and direct contact credentials.
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
