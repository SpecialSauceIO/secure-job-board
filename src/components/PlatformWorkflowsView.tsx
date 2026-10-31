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
    step: 'Step 1 • Get Started',
    title: '1. Unlock Explorer Mode ($5 Once)',
    bullets: [
      'Pay $5 once for lifetime verification and $0/mo Explorer access forever.',
      'Automatically enter our Weekly Drawing for a free 1-year Prestige membership.',
    ],
    unlockBadge: 'Unlocks: ✓ $0/Mo Explorer Access & Weekly Drawing',
  },
  {
    step: 'Step 2 • Identity Check',
    title: '2. Quick Stripe Photo ID Check',
    bullets: [
      'Complete a 60-second photo ID check powered securely by Stripe.',
      'Earns your permanent 🛡️ Verified Professional Shield in Employer Search.',
    ],
    unlockBadge: 'Unlocks: ✓ Verified Professional Shield',
  },
  {
    step: 'Step 3 • Private Profile',
    title: '3. Upload Resume & Set Preferences',
    bullets: [
      'Upload your PDF resume once to organize your skills, experience, and certifications automatically.',
      'Set your minimum pay and work model while keeping your name and contact info private.',
    ],
    unlockBadge: 'Unlocks: ✓ Anonymous Skill Profile & Pay Filter',
  },
  {
    step: 'Step 4 • Match & Apply',
    title: '4. Check Your Fit & Connect',
    bullets: [
      'Check your TrueFit Score™ on roles with upfront pay and accept employer invitations free at $0/mo.',
      'Upgrade to Professional ($12/mo) or Prestige ($19/mo) anytime to submit outbound applications.',
    ],
    unlockBadge: 'Unlocks: ✓ Free Invitations & Outbound Applications',
  },
  {
    step: 'Step 5 • Privacy Handshake',
    title: '5. Chat First, Share Your Resume Later',
    bullets: [
      'The Introduction reveals the verified company name and opens private chat showing only your First Name + Last Initial.',
      'Click "Release Resume & Contact Vault" only when you are ready to share your full PDF resume and contact details.',
    ],
    unlockBadge: 'Unlocks: ✓ Direct Chat & One-Click Resume Release',
  },
]

const EMPLOYER_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    step: 'Step 1 • Sandbox Access',
    title: '1. Unlock Your $0/Mo Sandbox ($25 Once)',
    bullets: [
      'Complete the $25 Organization Verification Pass to access your $0/mo Sandbox.',
      'Draft roles and preview verified talent matches before starting a monthly plan.',
    ],
    unlockBadge: 'Unlocks: ✓ $0/Mo Sandbox & Live Match Previews',
  },
  {
    step: 'Step 2 • Domain Check',
    title: '2. Confirm Your Business Domain',
    bullets: [
      'Verify your company domain automatically using your work email.',
      'Keeps free webmail and fake accounts out of the marketplace.',
    ],
    unlockBadge: 'Unlocks: ✓ Verified Business Domain Badge',
  },
  {
    step: 'Step 3 • Business & Admin Check',
    title: '3. Confirm EIN & Admin ID',
    bullets: [
      'Enter your business tax ID (EIN) and complete a 60-second Stripe ID check for your account admin.',
      'Shows professionals that every role belongs to a real, trusted company.',
    ],
    unlockBadge: 'Unlocks: ✓ Verified Organization Shield',
  },
  {
    step: 'Step 4 • Post & Invite',
    title: '4. Publish Roles & Invite Talent',
    bullets: [
      'Activate Starter ($149/mo), Growth ($499/mo), or Enterprise ($1,250/mo) when ready to hire.',
      'Inbound applicants are 100% free to unlock, and declined outbound invitations are automatically refunded.',
    ],
    unlockBadge: 'Unlocks: ✓ Live Roles & Refund-Protected Invitations',
  },
  {
    step: 'Step 5 • Chat & Hire',
    title: '5. Direct Chat, Resume Download & Team Sync',
    bullets: [
      'Chat directly with matched professionals and download their full PDF resume once released.',
      'Collaborate with your team seats, export via CSV, or auto-sync with Workday & Greenhouse (Enterprise).',
    ],
    unlockBadge: 'Unlocks: ✓ Full Resume Access, Team Seats & HR Sync',
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
            Simple, Step-by-Step Guide • Built for Real People
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            How Special Sauce Works{' '}
            <span className={isCandidate ? 'text-indigo-400' : 'text-emerald-400'}>
              {isCandidate ? 'for Professionals' : 'for Employers'}
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-200 max-w-3xl leading-relaxed">
            Get verified once, explore matches at $0/mo, and connect on your terms with complete privacy.
          </p>
        </div>

        <div className="shrink-0 flex flex-wrap items-center gap-3">
          <Link
            href={isDashboard ? '/dashboard/security' : '/security'}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-bold transition-colors"
          >
            🛡️ Security &amp; Privacy →
          </Link>
        </div>
      </div>

      {/* Interactive Segmented Toggle */}
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

      {/* Active Workflow Section Header + Card Grid */}
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
                  ? '$5 One-Time Verification • $0/Mo Explorer Mode'
                  : '$25 One-Time Verification • $0/Mo Sandbox • Refund-Protected Invitations'}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                {isCandidate
                  ? 'Professional Workflow: Private Profile to Direct Offers'
                  : 'Employer Workflow: Verified Sandbox to Great Hires'}
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
              {isCandidate ? 'Get Started ($5) →' : 'Verify Organization ($25) →'}
            </Link>
          )}
        </div>

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

      {/* Bottom Handshake Banner */}
      <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-700 space-y-6">
        <div className="flex flex-col gap-5 border-b border-slate-800 pb-5">
          <div className="max-w-4xl">
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-emerald-400 block">
              Where Both Sides Meet • The Privacy Handshake
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              Mutual Respect, Upfront Pay &amp; Complete Privacy Control
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="text-lg font-extrabold text-white">
              1. Anonymous Discovery
            </div>
            <p className="text-base text-slate-100 leading-relaxed">
              Professionals appear as <code className="text-emerald-300 font-bold">Professional #ID</code> showing skills and experience. Employers show industry, company size, and upfront pay bands.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="text-lg font-extrabold text-white">
              2. The Introduction (Private Chat)
            </div>
            <p className="text-base text-slate-100 leading-relaxed">
              When an invitation is accepted or an application is unlocked, the verified company name is revealed and chat opens using <code className="text-emerald-300 font-bold">First Name + Last Initial</code>.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="text-lg font-extrabold text-white">
              3. The Conversation (Resume Shared)
            </div>
            <p className="text-base text-slate-100 leading-relaxed">
              When ready to move forward, the professional clicks <strong className="text-white">Release Resume &amp; Contact Vault</strong> to share their full PDF resume and direct email.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
