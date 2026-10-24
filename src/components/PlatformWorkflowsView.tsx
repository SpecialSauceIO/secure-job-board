import Link from 'next/link'

const CANDIDATE_WORKFLOW_STEPS = [
  {
    step: 'Step 1 • Account & Plan Activation',
    title: '1. Create Account & Claim Founding Member Status',
    detail:
      'Register as a Candidate and activate Explorer ($3/mo), Professional ($9/mo), or Prestige ($15/mo). Joining during our launch window permanently awards the ★ Founding Member Charter distinction on your profile.',
    unlockBadge: 'Unlocks: ★ Founding Member Charter Badge & Billing Access',
  },
  {
    step: 'Step 2 • Biometric Trust Gate',
    title: '2. Complete 1-Time Stripe Identity Verification',
    detail:
      'Complete a 60-second government photo ID and live biometric selfie check powered directly by Stripe Identity. Zero raw ID images or biometrics ever touch Special Sauce servers—only a verified boolean token is stored.',
    unlockBadge: 'Unlocks: ✓ Identity Verified Badge & Marketplace Discoverability',
  },
  {
    step: 'Step 3 • Vault & AI Structuring',
    title: '3. Upload PDF Resume to Your Stage 2 Vault & Auto-Fill',
    detail:
      'Upload your PDF resume once. Our AI parser automatically extracts your core skills, tenure, certifications, and languages into an anonymized profile (Candidate #ID) while locking your raw PDF, full name, phone, and email inside your private Stage 2 Vault.',
    unlockBadge: 'Unlocks: ✓ Resume Vault Ready Badge & Hard Dealbreaker Firewall',
  },
  {
    step: 'Step 4 • Active Search & Passive Discovery',
    title: '4. Search Protected Jobs & Receive Direct Employer Pitches',
    detail:
      'Actively search and filter verified open roles with instant 5-Point AI Fit Radar scores and 1-click blind applications—or sit back passively while verified hiring managers discover your anonymous profile and send direct pitches.',
    unlockBadge: 'Unlocks: Live Job Search, 5-Point AI Fit Radar & Inbound Pitch Inbox',
  },
  {
    step: 'Step 5 • The 2-Stage Handshake',
    title: '5. Stage 1 Safe Chat → Stage 2 Voluntary Vault Release',
    detail:
      'When you accept an employer pitch (or an employer unlocks your application), Stage 1 opens an encrypted chat revealing the company name while showing only your First Name + Last Initial. You remain in 100% control and click "Release Resume & Contact Vault" (Stage 2) only when ready.',
    unlockBadge: 'Unlocks: Full Mutual Introduction & Time-Limited Signed Resume Access',
  },
]

const EMPLOYER_WORKFLOW_STEPS = [
  {
    step: 'Step 1 • Organization & Plan Setup',
    title: '1. Register Organization & Lock In Founding Partner Rate',
    detail:
      'Create your Employer account, select your Primary Industry Vertical and Company Size, and activate Starter ($149/mo Founding), Growth ($499/mo Founding), or Enterprise ($1,250/mo Founding) with a 12-Month Founding Partner Rate Lock.',
    unlockBadge: 'Unlocks: ★ Founding Partner Charter Badge & Seat Allocation',
  },
  {
    step: 'Step 2 • Trust Gate Pillar 1',
    title: '2. Verify Corporate Domain & Pass 90-Day RDAP Age Check',
    detail:
      'Verify corporate domain ownership via work-email match or DNS TXT token alongside live DNS MX validation and an automated IANA/RDAP registry check that blocks newly registered burner domains (<90 days old) from harvesting talent.',
    unlockBadge: 'Unlocks: ✓ Domain & 90-Day RDAP Verified Distinction',
  },
  {
    step: 'Step 3 • Trust Gate Pillars 2 & 3',
    title: '3. Attest IRS Federal EIN & Verify Admin Stripe Identity',
    detail:
      'Enter your 9-digit IRS Federal Tax ID (EIN) and State of Incorporation with formal corporate officer attestation, then complete a 1-time 60-second Stripe Identity biometric check for the Employer Account Admin.',
    unlockBadge: 'Unlocks: ✓ Verified US Tax Entity (EIN) & ✓ ID-Verified Hiring Leader',
  },
  {
    step: 'Step 4 • Role Publishing & Passive Talent Search',
    title: '4. Post Protected Roles & Passively Search Verified Candidates',
    detail:
      'Publish protected job listings (displaying your Industry Vertical, Company Stage, and upfront salary bands while keeping your company name hidden) and passively search/filter the ID-verified candidate pool using 100% Accepted-Only Protected Pitch Credits.',
    unlockBadge: 'Unlocks: Active Job Publishing, Passive Talent Search & Outbound Pitching',
  },
  {
    step: 'Step 5 • Mutual Handshake & ATS Sync',
    title: '5. Stage 1 Chat, Stage 2 Vault Release & HR Sync',
    detail:
      'Chat with accepted or unlocked candidates in Stage 1. Once the candidate clicks "Release Resume & Contact Vault" (Stage 2), access their 1-hour cryptographically signed PDF resume, full contact details, and 1-click export/sync to Workday or Greenhouse.',
    unlockBadge: 'Unlocks: ✓ Trusted Stage 2 Vault Partner & Enterprise ATS Sync',
  },
]

export default function PlatformWorkflowsView({
  isDashboard = false,
}: {
  isDashboard?: boolean
}) {
  return (
    <div className="space-y-8">
      {/* Dark Top Summary Banner matching 2-Stage Vault & Stripe */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 border-2 border-slate-800 shadow-2xs">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-slate-300/30 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
            End-to-End Double-Blind Onboarding • Verification • Marketplace Access
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Candidate &amp; Employer Platform Workflows
          </h2>
          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
            A side-by-side visual walkthrough of how Candidates and Employers enroll, complete biometric and corporate entity verification, and unlock active job search, role publishing, and passive talent discovery.
          </p>
        </div>

        <div className="shrink-0 flex flex-wrap items-center gap-2.5">
          <Link
            href={isDashboard ? '/dashboard/security' : '/security'}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-extrabold transition-colors"
          >
            🛡️ View 2-Stage Vault &amp; Stripe Architecture →
          </Link>
        </div>
      </div>

      {/* Two-Column Side-by-Side Workflow Grid matching SupportCenterClient security tab */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: CANDIDATE WORKFLOW (Indigo Theme) */}
        <div className="rounded-2xl border-2 border-indigo-300 bg-indigo-50/40 p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-indigo-300/80 pb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-black text-base shadow-xs">
              C
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 block">
                Stripe Biometric ID • Stage 2 Resume Vault • 5-Point AI Fit
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">
                Candidate Workflow: Enroll to Job Search
              </h3>
            </div>
          </div>

          <div className="space-y-3.5">
            {CANDIDATE_WORKFLOW_STEPS.map((item, i) => (
              <div
                key={i}
                className="bg-white p-4 sm:p-5 rounded-xl border border-indigo-300 shadow-sm space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-extrabold uppercase tracking-wider">
                    {item.step}
                  </span>
                  <span className="text-[11px] font-extrabold text-emerald-700">
                    {item.unlockBadge}
                  </span>
                </div>
                <div className="text-sm font-extrabold text-slate-900">
                  {item.title}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: EMPLOYER WORKFLOW (Emerald Theme) */}
        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-emerald-300/80 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-black text-base shadow-xs">
              E
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 block">
                3-Pillar Anti-Harvesting Gate • Protected Pitch Credits
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">
                Employer Workflow: Enroll to Talent Search
              </h3>
            </div>
          </div>

          <div className="space-y-3.5">
            {EMPLOYER_WORKFLOW_STEPS.map((item, i) => (
              <div
                key={i}
                className="bg-white p-4 sm:p-5 rounded-xl border border-emerald-300 shadow-sm space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wider">
                    {item.step}
                  </span>
                  <span className="text-[11px] font-extrabold text-indigo-700">
                    {item.unlockBadge}
                  </span>
                </div>
                <div className="text-sm font-extrabold text-slate-900">
                  {item.title}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Handshake Convergence Banner */}
      <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-8 border-2 border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 block">
              Where Both Workflows Meet • The Double-Blind Handshake
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
              Zero Unsolicited Spam, Zero Burner-Domain Harvesting &amp; 100% Candidate-Controlled Disclosure
            </h3>
          </div>
          {!isDashboard && (
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                href="/signup/candidate"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition-colors"
              >
                Start Candidate Workflow →
              </Link>
              <Link
                href="/signup/employer"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-colors"
              >
                Start Employer Workflow →
              </Link>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="font-extrabold text-white">
              1. Pre-Match (100% Double-Blind)
            </div>
            <p className="leading-relaxed">
              Candidates appear as <code className="text-emerald-300">Candidate #ID</code> with verified skills and AI Fit scores. Employers appear by Primary Industry Vertical, Company Stage, and upfront salary bands.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="font-extrabold text-white">
              2. Stage 1 Unlock (Encrypted Chat)
            </div>
            <p className="leading-relaxed">
              When a candidate accepts a pitch or an employer unlocks an inbound application, the employer&apos;s company identity is revealed and live chat opens using <code className="text-emerald-300">First Name + Last Initial</code>.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="font-extrabold text-white">
              3. Stage 2 Release (Full Resume &amp; ATS)
            </div>
            <p className="leading-relaxed">
              Only when the candidate clicks <strong className="text-white">Release Resume &amp; Contact Vault</strong> does the employer receive the 1-hour signed PDF resume URL and direct contact credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
