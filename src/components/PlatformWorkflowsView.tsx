'use client'

import { useState } from 'react'
import Link from 'next/link'

interface WorkflowStep {
  step: string
  title: string
  bullets: string[]
  unlockBadge: string
}

const CANDIDATE_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    step: 'Step 1 • Explorer Onboarding ($5 One-Time)',
    title: '1. Enroll in Explorer ($5 One-Time — $0/Mo Forever)',
    bullets: [
      'Complete your $5 One-Time ID Verification Pass to unlock Explorer at $0/mo forever—or activate Professional ($12/mo) or Prestige ($19/mo) immediately.',
      'Receive automatic entry into our Weekly Drawing for a free 1-year Prestige membership.',
      'Zero bots, fake profiles, or scrapers—every member is a verified professional.',
    ],
    unlockBadge: 'Unlocks: ✓ $0/Mo Explorer Sandbox & Weekly 1-Yr Prestige Drawing Entry',
  },
  {
    step: 'Step 2 • 1-Time Biometric Trust Gate',
    title: '2. Pass 1-Time Stripe Real-Person ID Check',
    bullets: [
      'Included with your $5 One-Time Verification Pass—complete a 60-second government photo ID and live selfie check via Stripe Identity.',
      'Zero raw ID photos or biometrics ever touch Special Sauce servers (only a cryptographic verification token is stored).',
      'Activates your permanent 🛡️ Verified Professional Shield in Employer Talent Search.',
    ],
    unlockBadge: 'Unlocks: ✓ Verified Professional Shield & Live Search Visibility',
  },
  {
    step: 'Step 3 • Conversation Resume Vault',
    title: '3. Upload Resume & Set Dealbreakers',
    bullets: [
      'Upload your PDF resume once to auto-extract your anonymous skill matrix, tenure, and certifications.',
      'Your name, email, phone, and raw PDF stay locked inside your Conversation Vault while employers see only your anonymized Professional #ID.',
      'Set your minimum salary expectations, work model (Remote/Hybrid/On-Site), and hard dealbreakers upfront.',
    ],
    unlockBadge: 'Unlocks: ✓ Anonymized Professional #ID & Dealbreaker Firewall',
  },
  {
    step: 'Step 4 • Inbound Free or Outbound Upgrades',
    title: '4. Check TrueFit Score™ & Field Invitations',
    bullets: [
      'See upfront salary bands and your instant TrueFit Score™ (every job post expires after 30 days—zero ghost jobs).',
      'Accept Unlimited Inbound Employer Invitations free at $0/mo forever in Explorer mode.',
      'Upgrade to Professional ($12/mo) for 15 outbound applications/mo + ★ Founding Member Badge, or Prestige ($19/mo) for unlimited outbound applications—and downgrade back to $0/mo Explorer anytime once hired.',
    ],
    unlockBadge: 'Unlocks: ✓ Free Inbound Invitations, 40%+ TrueFit™ Outbound Apps & Founding Badge',
  },
  {
    step: 'Step 5 • Intro/Convo Privacy Handshake',
    title: '5. Chat First, Release Your Resume Later',
    bullets: [
      'The Introduction reveals the verified company name and opens encrypted live chat.',
      'Employers only see your First Name + Last Initial during The Introduction chat.',
      'Click "Release Resume & Contact Vault" (The Conversation) only when you are ready to share your 1-hour cryptographically signed PDF resume and contact details.',
    ],
    unlockBadge: 'Unlocks: ✓ Full Mutual Intro & 1-Hour Signed Resume Link',
  },
]

const EMPLOYER_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    step: 'Step 1 • $25 Verification Pass & Sandbox',
    title: '1. Unlock $0/Mo Employer Explorer Sandbox ($25 One-Time)',
    bullets: [
      'Complete your $25 One-Time Employer Verification Pass to unlock the $0/mo Employer Explorer Sandbox.',
      'Configure your company profile, select your Industry Vertical, and draft role specifications.',
      'Preview live verified professional match counts and run TrueFit Score™ checks before activating a monthly plan.',
    ],
    unlockBadge: 'Unlocks: ✓ $0/Mo Employer Explorer Sandbox & Live Professional Match Previews',
  },
  {
    step: 'Step 2 • Trust Gate Pillar 1',
    title: '2. Verify Corporate Domain & 90-Day Age',
    bullets: [
      'Confirm domain ownership via work-email match or DNS TXT verification.',
      'Automated DNS MX and IANA/RDAP registry lookup verifies domain age.',
      'Blocks newly registered burner domains (<90 days old) and free webmail accounts from harvesting talent.',
    ],
    unlockBadge: 'Unlocks: ✓ Domain & 90-Day RDAP Verified Distinction',
  },
  {
    step: 'Step 3 • Trust Gate Pillars 2 & 3',
    title: '3. Attest IRS EIN & Representative Stripe ID',
    bullets: [
      'Submit your 9-digit IRS Federal Tax ID (EIN) and State of Incorporation (Pillar 2).',
      'Complete a 1-time 60-second Stripe Identity biometric check for the Account Admin (Pillar 3).',
      'Proves to professionals that every protected role belongs to a real, accountable organization.',
    ],
    unlockBadge: 'Unlocks: ✓ 3-Pillar Verified Organization Shield',
  },
  {
    step: 'Step 4 • Founding Rate Plans & Invitations',
    title: '4. Activate Founding Plan, Publish Roles & Invite Pros',
    bullets: [
      'Lock in 12-Month Founding Partner Rates when ready to hire: Starter ($149/mo), Growth ($499/mo), or Enterprise ($1,250/mo).',
      'Post company-shielded roles showing salary bands and industry; unlocking inbound 40%+ TrueFit™ applicants is 100% free (0 credits).',
      'Outbound Professional Invitations are 100% auto-refunded if a professional declines, and Rollover Credit Top-Up Packs never expire while active.',
    ],
    unlockBadge: 'Unlocks: ✓ 12-Mo Rate Lock, Protected Roles & Refund-Protected Invitations',
  },
  {
    step: 'Step 5 • Handshake & ATS Sync',
    title: '5. The Introduction Chat, The Conversation Vault & HR Sync',
    bullets: [
      'Message accepted or unlocked professionals directly in The Introduction encrypted chat.',
      'Receive 1-hour cryptographically signed PDF resumes and direct contact details upon The Conversation release.',
      'Collaborate across team/recruiter seats (2 Starter / 5 Growth / Unlimited Enterprise), export via CSV, or auto-sync to Workday & Greenhouse (Enterprise).',
    ],
    unlockBadge: 'Unlocks: ✓ Conversation Resume Access, Team Seats & Enterprise ATS Sync',
  },
]

export default function PlatformWorkflowsView({
  isDashboard = false,
}: {
  isDashboard?: boolean
}) {
  const [activeTab, setActiveTab] = useState<'candidate' | 'employer'>('candidate')
  const isCandidate = activeTab === 'candidate'
  const activeSteps = isCandidate ? CANDIDATE_WORKFLOW_STEPS : EMPLOYER_WORKFLOW_STEPS

  return (
    <div className="space-y-8">
      {/* Top Hero Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-700 shadow-lg">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
            $5 Professional &amp; $25 Employer One-Time Verify • $0/Mo Explorer Sandbox
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            How Special Sauce Works{' '}
            <span className={isCandidate ? 'text-indigo-400' : 'text-emerald-400'}>
              {isCandidate ? 'for Professionals' : 'for Employers'}
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-200 max-w-3xl leading-relaxed">
            Use the toggle below to explore how Professionals and Employers complete one-time identity verification, protect their privacy in the $0/mo Explorer Sandbox, and connect without bot spam or resume harvesting.
          </p>
        </div>

        <div className="shrink-0 flex flex-wrap items-center gap-3">
          <Link
            href={isDashboard ? '/dashboard/security' : '/security'}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-bold transition-colors"
          >
            🛡️ View Intro/Convo Vault &amp; Security →
          </Link>
        </div>
      </div>

      {/* Interactive Segmented Toggle (Professional vs Employer) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 p-3 rounded-2xl border border-slate-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          <button
            type="button"
            onClick={() => setActiveTab('candidate')}
            className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-base sm:text-lg font-extrabold transition-all cursor-pointer ${
              isCandidate
                ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400'
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-sm font-black">
              P
            </span>
            <span>Professional Workflow (5 Steps)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('employer')}
            className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-base sm:text-lg font-extrabold transition-all cursor-pointer ${
              !isCandidate
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-sm font-black">
              E
            </span>
            <span>Employer Workflow (5 Steps)</span>
          </button>
        </div>
      </div>

      {/* Active Workflow Section Header + Spacious Landing-Page Card Grid */}
      <div
        className={`rounded-2xl border-2 p-6 sm:p-8 space-y-6 bg-slate-950 ${
          isCandidate ? 'border-indigo-500/60' : 'border-emerald-500/60'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl text-white flex items-center justify-center shrink-0 font-black text-xl shadow-md ${
                isCandidate ? 'bg-indigo-600' : 'bg-emerald-600'
              }`}
            >
              {isCandidate ? 'P' : 'E'}
            </div>
            <div>
              <span
                className={`text-xs sm:text-sm font-extrabold uppercase tracking-wider block ${
                  isCandidate ? 'text-indigo-400' : 'text-emerald-400'
                }`}
              >
                {isCandidate
                  ? '$5 One-Time ID Verify • $0/Mo Explorer Forever • Weekly 1-Yr Prestige Drawing'
                  : '$25 One-Time Org Verify • 3-Pillar Anti-Harvesting Gate • Accepted-Only Credits'}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                {isCandidate
                  ? 'Professional Workflow: Verified Onboarding to Protected Offers'
                  : 'Employer Workflow: Verified Sandbox to Protected Hiring'}
              </h2>
            </div>
          </div>

          {!isDashboard && (
            <Link
              href={isCandidate ? '/signup/candidate' : '/signup/employer'}
              className={`px-5 py-3 rounded-xl text-white text-sm font-extrabold transition-colors shrink-0 text-center ${
                isCandidate
                  ? 'bg-indigo-600 hover:bg-indigo-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {isCandidate ? 'Start Professional Verification ($5) →' : 'Start Employer Verification ($25) →'}
            </Link>
          )}
        </div>

        {/* 3-Column Card Grid matching Landing Page Typography & Contrast */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeSteps.map((item, i) => (
            <div
              key={i}
              className="bg-slate-900 p-6 rounded-2xl border border-slate-700/90 flex flex-col justify-between space-y-5 shadow-md"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider border ${
                      isCandidate
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    }`}
                  >
                    {item.step}
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-white leading-snug">
                  {item.title}
                </h3>

                <ul className="space-y-2.5 text-base text-slate-100 leading-relaxed">
                  {item.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span
                        className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                          isCandidate ? 'bg-indigo-400' : 'bg-emerald-400'
                        }`}
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <span className="text-xs sm:text-sm font-bold text-emerald-300 block">
                  {item.unlockBadge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Handshake Convergence Banner */}
      <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-700 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-emerald-400 block">
              Where Both Workflows Meet • The Intro/Convo Privacy Handshake
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              Zero Unsolicited Spam, Zero Burner-Domain Harvesting &amp; 100% Professional-Controlled Disclosure
            </h3>
          </div>
          {!isDashboard && (
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/signup/candidate"
                className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-extrabold transition-colors"
              >
                Start Professional Workflow ($5) →
              </Link>
              <Link
                href="/signup/employer"
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-extrabold transition-colors"
              >
                Start Employer Workflow ($25) →
              </Link>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="text-lg font-extrabold text-white">
              1. Pre-Match (Mutual Identity Protection)
            </div>
            <p className="text-base text-slate-100 leading-relaxed">
              Professionals appear as <code className="text-emerald-300 font-bold">Professional #ID</code> with structured skills and TrueFit Score™s. Employers appear by Industry Vertical, Company Stage, and upfront salary bands.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="text-lg font-extrabold text-white">
              2. The Introduction (Encrypted Chat)
            </div>
            <p className="text-base text-slate-100 leading-relaxed">
              When a professional accepts an outbound invitation or an employer unlocks an inbound application, the verified company identity is revealed and live chat opens using <code className="text-emerald-300 font-bold">First Name + Last Initial</code>.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="text-lg font-extrabold text-white">
              3. The Conversation (Full Resume &amp; ATS)
            </div>
            <p className="text-base text-slate-100 leading-relaxed">
              Only when the professional clicks <strong className="text-white">Release Resume &amp; Contact Vault</strong> does the employer receive the 1-hour cryptographically signed PDF resume link and direct contact credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
