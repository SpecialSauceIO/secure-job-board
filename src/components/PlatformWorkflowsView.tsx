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
    step: 'Step 1 • Account & Plan',
    title: '1. Create Account & Claim Founding Status',
    bullets: [
      'Start with Explorer ($5 One-Time Verification · $0/mo Forever), or upgrade to Professional ($12/mo) or Prestige ($19/mo) when applying outbound.',
      'Earn the permanent ★ Founding Member Charter distinction on your profile and enter our Weekly 1-Year Prestige Drawing.',
      'Zero bots or fake accounts—every member is a verified professional.',
    ],
    unlockBadge: 'Unlocks: ★ Founding Member Badge & Vault Access',
  },
  {
    step: 'Step 2 • Biometric Trust Gate',
    title: '2. Pass 1-Time Stripe Photo ID Check',
    bullets: [
      'Complete a 60-second government photo ID and live selfie check via Stripe.',
      'Zero raw ID photos or biometrics ever touch Special Sauce servers.',
      'Stores only a verified security token to prove you are a real human.',
    ],
    unlockBadge: 'Unlocks: ✓ Identity Verified Badge & Search Visibility',
  },
  {
    step: 'Step 3 • Conversation Resume Vault',
    title: '3. Upload Resume & Set Dealbreakers',
    bullets: [
      'Upload your PDF resume once to auto-extract skills, tenure, and certifications.',
      'Your name, email, phone, and raw PDF stay locked inside your Conversation Vault.',
      'Set minimum pay bands and hard dealbreakers upfront.',
    ],
    unlockBadge: 'Unlocks: ✓ Anonymized Candidate #ID & Dealbreaker Firewall',
  },
  {
    step: 'Step 4 • Search & Professional Invitations',
    title: '4. Check TrueFit Score™ & Field Offers',
    bullets: [
      'See upfront salary bands and your instant TrueFit Score™ (40%+ minimum).',
      'Every job post expires after 30 days—zero 6-month-old ghost jobs.',
      'Accept inbound Professional Invitations free in Explorer ($0/mo), or upgrade to Professional ($12/mo) / Prestige ($19/mo) to apply outbound.',
    ],
    unlockBadge: 'Unlocks: Live Job Search, TrueFit Score™ & Invitation Inbox',
  },
  {
    step: 'Step 5 • Intro/Convo Handshake',
    title: '5. Chat First, Release Your Resume Later',
    bullets: [
      'The Introduction reveals the verified company name and opens encrypted live chat.',
      'Employers only see your First Name + Last Initial during The Introduction chat.',
      'Click "Release Resume & Contact Vault" (The Conversation) only when you are ready, and downgrade back to $0/mo Explorer anytime once hired.',
    ],
    unlockBadge: 'Unlocks: Full Mutual Intro & 1-Hour Signed Resume Link',
  },
]

const EMPLOYER_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    step: 'Step 1 • Organization Setup',
    title: '1. Verify Organization ($25) & Lock In Founding Rate',
    bullets: [
      'Complete your $25 One-Time Organization Verification Pass to unlock the $0/mo Explorer Sandbox and preview verified candidate matches.',
      'Activate Starter ($149/mo), Growth ($499/mo), or Enterprise ($1,250/mo) when ready to publish live roles or invite candidates.',
      'Locks in your Founding Partner rate for a full 12 months.',
    ],
    unlockBadge: 'Unlocks: ★ Founding Partner Badge & Recruiter Seats',
  },
  {
    step: 'Step 2 • Trust Gate Pillar 1',
    title: '2. Verify Corporate Domain & 90-Day Age',
    bullets: [
      'Confirm domain ownership via work-email match or DNS TXT verification.',
      'Automated DNS MX and IANA/RDAP registry lookup verifies domain age.',
      'Blocks newly registered burner domains (<90 days old) from harvesting talent.',
    ],
    unlockBadge: 'Unlocks: ✓ Domain & 90-Day RDAP Verified Distinction',
  },
  {
    step: 'Step 3 • Trust Gate Pillars 2 & 3',
    title: '3. Attest IRS EIN & Admin Stripe ID',
    bullets: [
      'Submit your 9-digit IRS Federal Tax ID (EIN) and State of Incorporation.',
      'Complete a 60-second Stripe Identity biometric check for the Account Admin.',
      'Proves to candidates that every role belongs to a real, accountable company.',
    ],
    unlockBadge: 'Unlocks: ✓ Verified US Tax Entity & ID-Verified Leader',
  },
  {
    step: 'Step 4 • Roles & Talent Search',
    title: '4. Publish Blind Roles & Invite Verified Pros',
    bullets: [
      'Post protected roles showing salary bands and industry while hiding company name.',
      'Unlocking inbound 40%+ TrueFit™ applicants is 100% free (0 credits).',
      'Outbound Professional Invitations are 100% refunded if a candidate declines.',
    ],
    unlockBadge: 'Unlocks: Role Publishing & Refund-Protected Invitations',
  },
  {
    step: 'Step 5 • Handshake & ATS Sync',
    title: '5. The Introduction Chat, The Conversation Vault & HR Sync',
    bullets: [
      'Message accepted or unlocked candidates directly in The Introduction encrypted chat.',
      'Receive 1-hour cryptographically signed PDF resumes upon The Conversation release.',
      'Export unlocked candidates via CSV (all plans) or sync directly to Workday & Greenhouse (Enterprise plan only).',
    ],
    unlockBadge: 'Unlocks: ✓ Conversation Resume Access & Enterprise ATS Sync',
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
            Privacy, Transparency &amp; Verified Signal
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            How Special Sauce Works{' '}
            <span className={isCandidate ? 'text-indigo-400' : 'text-emerald-400'}>
              {isCandidate ? 'for Candidates' : 'for Employers'}
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-200 max-w-3xl leading-relaxed">
            Use the toggle below to explore how Candidates and Employers verify their identity, protect their privacy, and connect without bot spam or resume harvesting.
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

      {/* Interactive Segmented Toggle (Candidate vs Employer) */}
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
              C
            </span>
            <span>Candidate Workflow (5 Steps)</span>
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
              {isCandidate ? 'C' : 'E'}
            </div>
            <div>
              <span
                className={`text-xs sm:text-sm font-extrabold uppercase tracking-wider block ${
                  isCandidate ? 'text-indigo-400' : 'text-emerald-400'
                }`}
              >
                {isCandidate
                  ? 'Stripe Biometric ID • Conversation Resume Vault • TrueFit Score™'
                  : '3-Pillar Anti-Harvesting Gate • Protected Invitation Credits'}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                {isCandidate
                  ? 'Candidate Workflow: Enroll to Job Search'
                  : 'Employer Workflow: Enroll to Talent Search'}
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
              {isCandidate ? 'Start Candidate Signup ($5 ID Pass) →' : 'Start Employer Signup ($25 Org Verify) →'}
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
              Where Both Workflows Meet • The Double-Blind Handshake
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              Zero Unsolicited Spam, Zero Burner-Domain Harvesting &amp; 100% Candidate-Controlled Disclosure
            </h3>
          </div>
          {!isDashboard && (
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/signup/candidate"
                className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-extrabold transition-colors"
              >
                Start Candidate Workflow ($5) →
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
              1. Pre-Match (100% Double-Blind)
            </div>
            <p className="text-base text-slate-100 leading-relaxed">
              Candidates appear as <code className="text-emerald-300 font-bold">Candidate #ID</code> with structured skills and TrueFit Scores™. Employers appear by Industry Vertical, Company Stage, and upfront salary bands.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="text-lg font-extrabold text-white">
              2. The Introduction (Encrypted Chat)
            </div>
            <p className="text-base text-slate-100 leading-relaxed">
              When a candidate accepts a pitch or an employer unlocks an inbound application, the company identity is revealed and live chat opens using <code className="text-emerald-300 font-bold">First Name + Last Initial</code>.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="text-lg font-extrabold text-white">
              3. The Conversation (Full Resume &amp; ATS)
            </div>
            <p className="text-base text-slate-100 leading-relaxed">
              Only when the candidate clicks <strong className="text-white">Release Resume &amp; Contact Vault</strong> does the employer receive the 1-hour signed PDF resume link and direct contact credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
