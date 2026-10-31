export interface FAQ {
  id: string
  target: 'candidate' | 'employer' | 'all'
  category: string
  question: string
  answer: string
}

export interface PlaybookGuide {
  id: 'employer' | 'candidate'
  title: string
  subtitle: string
  badge: string
  steps: Array<{
    step: string
    title: string
    description: string
  }>
  copyPasteText: string
}

export const SECURITY_ARCHITECTURE_DATA = {
  title: 'Data Security, Private Resume Vault & Stripe Protection',
  subtitle:
    'Special Sauce never stores your government ID or payment card numbers on our servers. Identity checks and payments are handled directly by Stripe, and your full resume and contact details stay locked in your private vault until you choose to share them.',
  stripeVaultItems: [
    {
      title: 'Government IDs & Passports (Handled by Stripe Identity)',
      detail:
        'ID photos uploaded during Professional and Employer Admin verification are encrypted and processed directly inside Stripe Identity.',
    },
    {
      title: 'Selfie Verification',
      detail:
        'Live selfie checks are processed exclusively by Stripe. Special Sauce never sees or stores your ID photos—we only receive a simple verified confirmation.',
    },
    {
      title: 'Payment Cards & Billing (PCI-DSS Level 1)',
      detail:
        'All payments for Professional plans ($5 one-time Explorer, $12/mo Professional, $19/mo Prestige) and Employer plans ($25 Organization Verification, $149 / $499 / $1,250 monthly plans, and $150 / $350 / $900 credit packs) are processed securely by Stripe Checkout.',
    },
  ],
  platformStoredItems: [
    {
      title: 'Private Resume & Contact Vault',
      detail:
        'In The Introduction (when an employer unlocks your application or you accept an invitation), private chat opens showing only your First Name + Last Initial alongside the verified company name. In The Conversation, your full name, direct email, and PDF resume are shared only when you click "Release Resume & Contact Vault."',
    },
    {
      title: '3-Step Employer Verification',
      detail:
        'Every employer must verify their business domain, confirm their 9-digit Federal Tax ID (EIN) and state registration, and complete a 1-time Stripe ID check for their account admin before posting roles or searching talent.',
    },
    {
      title: 'Private In-Platform Messaging',
      detail:
        'All initial conversations happen inside secure threads on the platform, keeping your personal email and phone number private until you are ready to share them.',
    },
    {
      title: '30-Day Fresh Job Listings',
      detail:
        'To prevent ghost jobs and bulk resume scraping, every job listing automatically closes after 30 days unless renewed, and employers must message the professionals they unlock before unlocking more profiles.',
    },
  ],
  copyPasteSecurityBrief: `====================================================================
SPECIAL SAUCE — DATA SECURITY & PRIVACY SUMMARY
====================================================================

1. NO ID PHOTOS OR CARD NUMBERS ON OUR SERVERS:
Special Sauce never stores government ID images, verification selfies, credit card numbers, or bank details on our servers.

2. PROTECTED BY STRIPE (PCI-DSS LEVEL 1 & SOC 2):
- Identity Verification: Photo ID and selfie checks for Professionals and Employer Admins are handled directly inside Stripe Identity.
- Billing & Subscriptions: All payments are processed directly by Stripe Checkout.

3. 3-STEP EMPLOYER VERIFICATION:
- Step 1 (Business Domain): Work-email or DNS domain verification.
- Step 2 (Business Tax ID): 9-digit Federal EIN and state registration confirmation.
- Step 3 (Admin ID Check): 1-time Stripe ID check for the Employer Account Admin.

4. PRIVATE RESUME VAULT & MESSAGING:
- The Introduction (Private Chat): Reveals the verified company name and opens chat showing only the professional's First Name + Last Initial.
- The Conversation (One-Click Resume Release): Shares the professional's full name, email, and PDF resume only after they click "Release Resume & Contact Vault."
- Fresh Roles Only: Job listings close automatically after 30 days unless renewed.
====================================================================`,
}

export const PLAYBOOK_GUIDES: Record<'employer' | 'candidate', PlaybookGuide> = {
  employer: {
    id: 'employer',
    title: 'Employer & Hiring Team Guide',
    subtitle:
      'How Special Sauce works for Hiring Managers, Talent Acquisition Teams, and Recruiting Partners.',
    badge: 'Hiring Team Guide',
    steps: [
      {
        step: 'Step 1',
        title: 'Unlock Your $0/Mo Sandbox ($25 Once)',
        description:
          'Complete the $25 Organization Verification Pass to set up your company profile, draft roles, and preview verified talent matches at $0/mo.',
      },
      {
        step: 'Step 2',
        title: 'Verify Your Business (3 Quick Steps)',
        description:
          'Confirm your business domain, enter your 9-digit Federal EIN and state of registration, and complete a 60-second Stripe ID check for your account admin.',
      },
      {
        step: 'Step 3',
        title: 'Publish Protected Roles with Upfront Pay',
        description:
          'Post roles showing upfront salary or hourly pay ranges, location, and work model while keeping your company name private until you connect. Roles stay fresh with a 30-day window.',
      },
      {
        step: 'Step 4',
        title: 'Free Inbound Applicants & Refund-Protected Invitations',
        description:
          'Unlocking professionals who apply to your roles is 100% free. Sending an invitation from Talent Search uses 1 credit—and if a professional declines, your credit is automatically refunded.',
      },
      {
        step: 'Step 5',
        title: 'Chat Directly & Download Released Resumes',
        description:
          'Chat with matched professionals in The Introduction. Once they click "Release Resume & Contact Vault," download their full PDF resume or auto-sync to Workday and Greenhouse (Enterprise).',
      },
    ],
    copyPasteText: `====================================================================
SPECIAL SAUCE — HIRING TEAM QUICK-START GUIDE
====================================================================

1. HOW IT WORKS (5 STEPS):
- Step 1 ($25 Verification Sandbox): Complete your one-time verification to draft roles and preview matches at $0/mo.
- Step 2 (Business Verification): Confirm your company domain, EIN, and admin ID via Stripe.
- Step 3 (Post Roles): Publish roles with upfront pay bands. Every role expires after 30 days unless renewed.
- Step 4 (Connect): Inbound applicants are 100% free to unlock. Outbound invitations use 1 credit and are auto-refunded if declined.
- Step 5 (Hire): Chat directly in The Introduction, then receive the full PDF resume and contact details when released by the professional.

2. EMPLOYER PLANS (12-MONTH FOUNDING PARTNER RATE LOCK):
- Starter ($149/mo Locked 12 Mos · $299/mo Month 13+): Up to 5 Active Roles | 10 Invitation Credits/mo | 2 Team Seats
- Growth ($499/mo Locked 12 Mos · $799/mo Month 13+): Up to 15 Active Roles | 35 Invitation Credits/mo | Up to 5 Team Seats
- Enterprise ($1,250/mo Locked 12 Mos · $1,999/mo Month 13+): Unlimited Active Roles | 120 Invitation Credits/mo | Unlimited Seats + Workday/Greenhouse Sync
- Rollover Credit Top-Up Packs: Boost (+10 Credits for $150), Surge (+25 Credits for $350), Scale (+75 Credits for $900). Never expire while active.
====================================================================`,
  },
  candidate: {
    id: 'candidate',
    title: 'Professional Guide',
    subtitle:
      'How Special Sauce protects your privacy and gives you complete control over your resume and career search.',
    badge: 'Professional Guide',
    steps: [
      {
        step: 'Step 1',
        title: 'Start in Explorer ($5 Once, $0/Mo Forever)',
        description:
          'Complete your $5 one-time verification to unlock Explorer at $0/mo forever—including unlimited employer invitations and automatic entry into our Weekly 1-Year Prestige Drawing.',
      },
      {
        step: 'Step 2',
        title: 'Complete Your 60-Second Stripe ID Check',
        description:
          'Verify your identity once via Stripe to earn your Verified Professional Shield. Your ID photo is never stored on Special Sauce servers.',
      },
      {
        step: 'Step 3',
        title: 'Upload Your Resume & Set Preferences',
        description:
          'Upload your PDF resume once to organize your skills, experience, and certifications while keeping your name and contact info locked in your private vault.',
      },
      {
        step: 'Step 4',
        title: 'Check Your Fit & Connect',
        description:
          'Browse active roles with upfront pay, check your TrueFit Score™ for free, and accept employer invitations at $0/mo—or upgrade to Professional ($12/mo) or Prestige ($19/mo) to apply outbound.',
      },
      {
        step: 'Step 5',
        title: 'Chat First, Share Your Resume When Ready',
        description:
          'Chat with employers using only your First Name + Last Initial during The Introduction. Click "Release Resume & Contact Vault" only when you are ready to share your full resume.',
      },
    ],
    copyPasteText: `====================================================================
SPECIAL SAUCE — PROFESSIONAL QUICK-START GUIDE
====================================================================

1. YOU CONTROL YOUR PRIVACY:
- While browsing, employers only see "Professional #ID" along with your skills, experience, and general location.
- The Introduction (Private Chat): When you connect with an employer, you see their verified company name while they see only your First Name + Last Initial.
- The Conversation (One-Click Release): Your full name, email, and PDF resume remain private until you click "Release Resume & Contact Vault."

2. PROFESSIONAL PLANS:
- Explorer ($5 one-time · $0/mo forever): Lifetime ID verification, live anonymous profile, free TrueFit Score™ checks, unlimited employer invitations, and Weekly 1-Year Prestige Drawing entry.
- Professional ($12/mo): Everything in Explorer + 15 outbound applications/mo and Permanent Founding Member badge.
- Prestige ($19/mo): Everything in Professional + unlimited outbound applications, top-priority search placement, and priority support.
(Switch or downgrade back to $0/mo Explorer anytime once hired.)
====================================================================`,
  },
}

export const SUPPORT_FAQS: FAQ[] = [
  // ------------------------------------------------------------------
  // PROFESSIONAL FAQS
  // ------------------------------------------------------------------
  {
    id: 'c1',
    target: 'candidate',
    category: 'Verification & Privacy',
    question:
      'Why do I verify my ID, and is my government ID stored on Special Sauce?',
    answer:
      'A one-time ID check keeps bots, fake profiles, and scammers off the platform so every connection is human-to-human. Your photo ID and selfie are processed directly by Stripe Identity and are never stored on Special Sauce servers.',
  },
  {
    id: 'c2',
    target: 'candidate',
    category: 'Verification & Privacy',
    question:
      'How does the Private Resume Vault protect my contact info?',
    answer:
      'In employer search, you appear only as "Professional #ID." When you accept an invitation or an employer unlocks your application (The Introduction), private chat opens showing only your First Name + Last Initial while revealing the employer’s verified company name. Your email, phone number, and PDF resume stay hidden until you click "Release Resume & Contact Vault" (The Conversation).',
  },
  {
    id: 'c8',
    target: 'candidate',
    category: 'Verification & Privacy',
    question:
      'How do I know employers on Special Sauce are real companies?',
    answer:
      'Every employer must verify their corporate domain, confirm their Federal Tax ID (EIN) and state registration, and complete a Stripe ID check for their account admin before posting jobs or inviting professionals.',
  },
  {
    id: 'c3',
    target: 'candidate',
    category: 'Verification & Privacy',
    question:
      'How am I notified when an employer invites or messages me?',
    answer:
      'We send an instant email alert to your inbox, display an unread badge on your Dashboard, and play a subtle notification chime if you have the site open.',
  },
  {
    id: 'c4',
    target: 'candidate',
    category: 'Applications & Roles',
    question:
      'How does Special Sauce prevent ghost jobs?',
    answer:
      'Every job listing shows upfront pay and automatically expires after 30 days unless actively renewed by the employer. In addition, employers must reply to waiting applicants before renewing a role or unlocking additional profiles.',
  },
  {
    id: 'c5',
    target: 'candidate',
    category: 'Applications & Roles',
    question:
      'Can I save roles to review later?',
    answer:
      'Yes. Click the bookmark icon on any role card to save it to your "Saved Roles" list on your Dashboard.',
  },
  {
    id: 'c6',
    target: 'candidate',
    category: 'Preferences & Pay',
    question:
      'How do my minimum pay and work model dealbreakers work?',
    answer:
      'On your Match Preferences page, set your minimum pay, preferred work model (Remote, Hybrid, On-site), location, and employment type (W-2, 1099, Part-Time). Employers offering below your minimum pay or outside your preferences are automatically blocked from sending you invitations.',
  },
  {
    id: 'c7',
    target: 'candidate',
    category: 'Membership Plans ($5 / $12 / $19)',
    question:
      'What is the difference between Explorer ($5 once), Professional ($12/mo), and Prestige ($19/mo)?',
    answer:
      'Explorer ($5 one-time ID verification · $0/mo forever) lets you get discovered by employers, run free TrueFit Score™ checks, accept unlimited employer invitations, and enter our Weekly 1-Year Prestige Drawing at $0/mo. Professional ($12/mo) adds 15 outbound applications per month and Founding Member status. Prestige ($19/mo) unlocks unlimited outbound applications, top-priority placement in Employer Search, and priority US support. You can downgrade back to $0/mo Explorer anytime once hired.',
  },

  // ------------------------------------------------------------------
  // EMPLOYER FAQS
  // ------------------------------------------------------------------
  {
    id: 'e1',
    target: 'employer',
    category: 'Organization Verification',
    question:
      'How does Organization Verification work?',
    answer:
      'On your Company Settings page, complete three quick steps: 1) Confirm your business domain via work email or DNS record, 2) Enter your 9-digit Federal EIN and state of registration, and 3) Complete a 60-second Stripe ID check for your account admin.',
  },
  {
    id: 'e1b',
    target: 'employer',
    category: 'Organization Verification',
    question:
      'Why do Employer Admins complete a Stripe ID check?',
    answer:
      'Professionals share their skills and respond to invitations at a much higher rate when they know a real, verified hiring leader is behind every role.',
  },
  {
    id: 'e2',
    target: 'employer',
    category: 'Connecting with Professionals',
    question:
      'How does the Introduction chat and Resume Release work?',
    answer:
      'When you unlock an inbound applicant (free) or a professional accepts your invitation, The Introduction opens a direct chat thread showing their First Name + Last Initial. Once you chat and confirm mutual interest, the professional clicks "Release Resume & Contact Vault" to share their full PDF resume and direct email.',
  },
  {
    id: 'e3',
    target: 'employer',
    category: 'Job Listings',
    question:
      'Why do job listings expire after 30 days, and how do we renew them?',
    answer:
      'A 30-day window proves to professionals that your role is actively hiring. You can renew any active role for another 30 days with one click during its final 5 days (up to 2 renewals) once waiting applicants have been messaged or declined.',
  },
  {
    id: 'e4',
    target: 'employer',
    category: 'Plans, Credits & Rate Lock',
    question:
      'How do Founding Partner rates, rollover credits, and credit refunds work?',
    answer:
      'Founding Partners lock in discounted monthly rates for their first 12 months: Starter ($149/mo for 5 roles & 10 credits), Growth ($499/mo for 15 roles & 35 credits), and Enterprise ($1,250/mo for unlimited roles, 120 credits & HR sync). Monthly plan credits are used first, and optional Top-Up Packs (+10 for $150, +25 for $350, +75 for $900) roll over and never expire while your plan is active. If a professional declines an outbound invitation, your credit is automatically refunded.',
  },
  {
    id: 'e5',
    target: 'employer',
    category: 'Plans, Credits & Rate Lock',
    question:
      'Does unlocking an inbound applicant cost an Invitation Credit?',
    answer:
      'No. Reviewing, unlocking, and messaging professionals who apply to your roles is 100% free (0 credits) on every active Employer plan. Credits are only used when you send an outbound invitation from Talent Search.',
  },
  {
    id: 'e6',
    target: 'employer',
    category: 'Team Seats & HR Sync',
    question:
      'How do team seats and Workday / Greenhouse sync work?',
    answer:
      'Starter includes 2 seats, Growth includes up to 5 seats, and Enterprise includes unlimited team and recruiter seats. On Enterprise, whenever a professional releases their resume, Special Sauce can automatically sync their PDF resume and TrueFit Score™ summary to Greenhouse or your Workday webhook, or you can export via CSV anytime.',
  },
  {
    id: 'e7',
    target: 'employer',
    category: 'Team Seats & HR Sync',
    question:
      'How are we notified when a professional replies or shares their resume?',
    answer:
      'Your team receives an instant email alert, an unread badge on your Employer Dashboard, and a subtle audio chime if your dashboard tab is open.',
  },
]
