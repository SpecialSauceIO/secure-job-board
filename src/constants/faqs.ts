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
  title: 'Data Security, Privacy & Stripe Vault Architecture',
  subtitle:
    'Special Sauce is engineered on a Zero-Sensitive-PII-Storage principle. Biometric identity documents and payment credentials are never stored on our servers.',
  stripeVaultItems: [
    {
      title: 'Government IDs & Passports (Stripe Identity)',
      detail:
        'Photos of driver’s licenses, passports, and national ID cards uploaded during candidate verification are transmitted directly to Stripe Identity over TLS 1.3 and encrypted using AES-256 inside Stripe’s isolated biometric vault.',
    },
    {
      title: 'Biometric Selfie & Liveness Checks',
      detail:
        'Facial recognition vectors and selfie verification captures are processed exclusively by Stripe Identity. Special Sauce only receives a boolean verification status ("verified" or "requires_input") and a session reference token.',
    },
    {
      title: 'Credit Cards, ACH & Banking Details (PCI-DSS Level 1)',
      detail:
        'All Employer subscription payments ($99 / $299 / $899) and Candidate Pro Pass ($9/mo) transactions are processed on Stripe-hosted Checkout pages. Raw card numbers, CVV codes, and banking details never touch Special Sauce servers.',
    },
  ],
  platformStoredItems: [
    {
      title: 'Anonymous Candidate Profile & Skill Matrix',
      detail:
        'Extracted technical skills, years of experience, third-person bio, target US State/Metro location, work model preferences, and minimum salary expectations.',
    },
    {
      title: 'Encrypted Contact Identity & Resume PDF (Locked by Default)',
      detail:
        'Your Full Name, email address, and uploaded PDF resume are stored in Row-Level Security (RLS) protected Supabase storage. They remain hidden from employers until you explicitly accept a pitch or an employer unlocks your blind application.',
    },
    {
      title: 'Organization Profile, Domain Verification & Seat Roster',
      detail:
        'Company name, verified corporate domain status, active blind job postings, connection credit balances, and authorized Hiring Manager / W-2 BPO Partner seat assignments.',
    },
    {
      title: 'AI Match Radar Scores & Shared Reference IDs (SS-XXXXXXXX)',
      detail:
        '5-Point AI fit scores and transaction reference IDs linking unlocked applications and accepted outbound pitches.',
    },
  ],
  copyPasteSecurityBrief: `====================================================================
SPECIAL SAUCE — DATA SECURITY & STRIPE VAULT COMPLIANCE BRIEF
====================================================================

1. ZERO BIOMETRIC OR PAYMENT CARD STORAGE ON PLATFORM SERVERS:
Special Sauce does NOT store government ID images, biometric selfies, credit card numbers, or bank account details in our application database.

2. WHAT IS STORED EXCLUSIVELY INSIDE STRIPE (PCI-DSS LEVEL 1 & SOC 2):
• Candidate Identity Verification (Stripe Identity): Government IDs and biometric liveness checks are captured and encrypted (AES-256) directly inside Stripe's isolated vault. Special Sauce only stores a boolean "Identity Verified" status token.
• Subscription & Billing Data (Stripe Checkout): All payment methods for Employer Tiers ($99/$299/$899) and Candidate Pro ($9/mo) are tokenized and vaulted by Stripe.

3. WHAT IS STORED INSIDE SPECIAL SAUCE (SUPABASE RLS VAULT):
• Candidate Data: Extracted skill matrix, years of experience, anonymous bio, target US State/Metro location, and match dealbreakers. Full Name, email, and uploaded PDF resumes are locked behind Row-Level Security (RLS) and only revealed upon mutual connection unlock.
• Employer & BPO Data: Organization profile, corporate domain verification status, active blind job listings, connection credit balances, and authorized Team / W-2 BPO Partner seat assignments.
• AI Processing: Resume and job description PDFs are parsed in-memory for structured skill extraction and 5-Point Radar scoring without training public foundation models on your private data.
====================================================================`,
}

export const PLAYBOOK_GUIDES: Record<'employer' | 'candidate', PlaybookGuide> = {
  employer: {
    id: 'employer',
    title: 'Employer & BPO Partner Playbook',
    subtitle: 'How Special Sauce works for Hiring Managers, Talent Acquisition Teams, and Delegated W-2 BPO Partners.',
    badge: 'Hiring Team & BPO Guide',
    steps: [
      {
        step: 'Step 1',
        title: 'Free Corporate Domain Verification (Explorer Mode)',
        description:
          'Create your Company Profile and verify your corporate domain via work email match or DNS TXT record. Once verified, you unlock Free Explorer Mode to browse the anonymous talent pool and run 5-Point AI Match Radar previews.'
      },
      {
        step: 'Step 2',
        title: 'Activate Your Tier & Assign Team / BPO Partner Seats',
        description:
          'Choose Starter ($99/mo: 5 Roles, 10 Credits, 1 Seat), Growth ($299/mo: 15 Roles, 30 Credits, 3 Seats), or Enterprise ($899/mo: 50 Roles, 100 Credits, 10 Seats + ATS Sync). Invite internal hiring managers or W-2 BPO delivery leads on your Company Profile.'
      },
      {
        step: 'Step 3',
        title: 'Publish Blind Roles with Standardized Pay & US Metro Locations',
        description:
          'Upload a job description PDF for AI auto-extraction or select your US State & Metro area, Work Model, and Annual (/yr) or Hourly (/hr) pay band. Your company name and domain remain hidden until mutual unlock.'
      },
      {
        step: 'Step 4',
        title: 'Unlock Inbound Applicants (Free) & Pitch Passive Talent (1 Credit)',
        description:
          'Candidates who score 40%+ on the AI Match Radar can submit blind applications—unlocking and shortlisting inbound applicants is 100% free. To proactively pitch passive candidates in the search pool, spend 1 Connection Credit.'
      },
      {
        step: 'Step 5',
        title: 'Full Identity, Direct Email & PDF Resume Unlock',
        description:
          'When you unlock an inbound applicant or a passive candidate accepts your outbound pitch, both parties receive an email with a shared SS-XXXXXXXX Reference ID, and the candidate’s Full Name, direct email, and PDF resume unlock permanently.'
      }
    ],
    copyPasteText: `====================================================================
SPECIAL SAUCE — HIRING TEAM & BPO PARTNER QUICK-START GUIDE
====================================================================

1. WHAT IS SPECIAL SAUCE?
Special Sauce is a verified, blind technical & professional recruitment marketplace. Candidates are Stripe Identity-Verified and evaluated by a 5-Point AI Match Radar before any contact information is exchanged.

2. HOW OUR TEAM USES THE PLATFORM (5 STEPS):
• Step 1 — Domain Verification: Our corporate domain is verified, unlocking access to the anonymous passive talent pool and AI Job/Candidate Fit scoring.
• Step 2 — Shared Team & BPO Partner Seats: Collaborators (Hiring Managers & authorized W-2 BPO delivery partners) share our organization's active role slots and monthly pitch credit pool.
• Step 3 — Publishing Blind Roles: Every role displays transparent compensation (Annual $/yr or Hourly $/hr), standardized US State & Metro location, seniority, and core skill matrix—while keeping our company name blind until unlock.
• Step 4 — Inbound Applications (0 Credits): Candidates must pass a 40%+ AI Match firewall to apply. Reviewing, unlocking, and shortlisting inbound applicants in our pipeline is 100% FREE.
• Step 5 — Outbound Passive Pitches (1 Credit): When searching passive talent, our dealbreaker firewall automatically checks candidate salary expectations, work model, and 40%+ AI skill fit before we spend 1 Connection Credit to send a pitch. When accepted, their Full Name, email, and original PDF resume unlock immediately.

3. PLAN TIERS & SEAT CAPACITY (2:1 CREDIT RATIO):
• Starter ($99/mo): Up to 5 Active Roles | 10 Pitch Credits/mo | 1 Seat (Owner)
• Growth ($299/mo): Up to 15 Active Roles | 30 Pitch Credits/mo | Up to 3 Team/BPO Seats
• Enterprise ($899/mo): Up to 50 Active Roles | 100 Pitch Credits/mo | Up to 10 Seats + ATS Webhook Sync

4. REFERENCE ID TRACKING:
Every unlocked application and accepted pitch generates a shared Reference ID (e.g., SS-8F42A1B9) sent to both the hiring team and the candidate for audit and ATS tracking.
====================================================================`
  },
  candidate: {
    id: 'candidate',
    title: 'Candidate Process & Privacy Guide',
    subtitle: 'How Special Sauce protects your anonymity, eliminates recruiter spam, and puts you in control of who sees your identity.',
    badge: 'Candidate Guide',
    steps: [
      {
        step: 'Step 1',
        title: 'AI Resume Extraction & Anonymous Profile Setup',
        description:
          'Upload your PDF resume on your Profile page. Our AI extracts your skills, years of experience, and a third-person bio while keeping your Full Name, email, and original PDF hidden behind an encrypted lock.'
      },
      {
        step: 'Step 2',
        title: 'Set Your Dealbreaker Firewall (Salary, Work Model & US Metro)',
        description:
          'Configure your minimum annual salary expectation, preferred work model (Remote, Hybrid, On-site), and target US State & Metro area. Employers whose roles fall below your minimum pay or conflict with your work model are automatically blocked from pitching you.'
      },
      {
        step: 'Step 3',
        title: '1-Time Identity Verification & 7-Day Early Adopter Trial',
        description:
          'Complete Stripe Identity verification once to earn your "Identity Verified" badge. This immediately activates your 7-Day Early Adopter Trial with 3 Free Blind Applications.'
      },
      {
        step: 'Step 4',
        title: 'Run Free 5-Point AI Match Checks & Apply Blind',
        description:
          'Browse blind roles with transparent annual (/yr) or hourly (/hr) pay bands. Run unlimited 5-Point AI Match Radar checks for free. When you score 40%+, submit a 1-click Blind Application.'
      },
      {
        step: 'Step 5',
        title: 'Accept Inbound Employer Pitches (Always 100% Free)',
        description:
          'Domain-verified employers can spend a credit to pitch you open roles that match your dealbreakers. Reviewing and accepting incoming Employer Pitches is always 100% free—even after your initial 7-day trial ends. Upgrade to Candidate Pro ($9/mo) anytime for unlimited outbound applications.'
      }
    ],
    copyPasteText: `====================================================================
SPECIAL SAUCE — CANDIDATE HOW-IT-WORKS & PRIVACY CHEAT SHEET
====================================================================

1. 100% BLIND BY DEFAULT (ZERO RECRUITER SPAM):
• Your profile appears to employers only as "Anonymous Candidate #ID" with your extracted skills, experience level, target US Metro location, and anonymous third-person bio.
• Your Full Name, direct email address, and PDF resume remain locked until an employer unlocks your blind application OR you explicitly click "Accept" on an incoming Employer Pitch.

2. YOUR DEALBREAKER FIREWALL:
• Set your Minimum Salary Expectation ($/yr), Preferred Work Model (Remote, Hybrid, On-site), and US State/Metro Location on your Match Preferences page.
• Employers cannot send you a pitch if their role's maximum pay (including hourly roles converted at 2,080 hrs/yr) is below your minimum requirement.

3. HOW APPLYING & INBOUND PITCHES WORK:
• Free AI Fit Previews: Run unlimited 5-Point AI Match Radar checks on any open role.
• 40%+ Relevance Gate: Any role where you score 40% or higher can be applied to in one click.
• 7-Day Early Adopter Trial: Includes 3 free outbound blind applications upon Identity Verification.
• Inbound Employer Pitches (Always Free): Receiving, reviewing, and accepting connection pitches from verified employers is 100% free forever.
• Candidate Pro Pass ($9/mo): Optional upgrade for unlimited outbound blind applications and priority search placement.

4. SHARED REFERENCE IDs:
Whenever a connection is unlocked, both you and the employer receive an email confirmation with a shared Reference ID (SS-XXXXXXXX) and direct contact details.
====================================================================`
  }
}

export const SUPPORT_FAQS: FAQ[] = [
  // ------------------------------------------------------------------
  // CANDIDATE FAQS
  // ------------------------------------------------------------------
  {
    id: 'c1',
    target: 'candidate',
    category: 'Verification & Privacy',
    question: 'Why do I need to verify my identity, and is my government ID stored by Special Sauce?',
    answer:
      'Identity verification ensures the integrity of the Special Sauce talent pool, eliminating bots and duplicate accounts. Your government ID and biometric selfie are NEVER stored on Special Sauce servers—they are processed and vaulted exclusively by Stripe Identity using bank-grade AES-256 encryption. Special Sauce only receives a "Verified" status token.'
  },
  {
    id: 'c2',
    target: 'candidate',
    category: 'Verification & Privacy',
    question: 'Can employers see my name, email, or current company while browsing?',
    answer:
      'No. Your profile is strictly anonymous ("Anonymous Candidate #ID"). Employers only see your extracted skills, years of experience, target US State/Metro location, and third-person bio. Your Full Name, direct email, and PDF resume are only revealed if an employer unlocks your inbound application OR if you click "Accept" on an outbound employer pitch.'
  },
  {
    id: 'c3',
    target: 'candidate',
    category: 'Verification & Privacy',
    question: 'What happens if I decline an incoming Employer Pitch?',
    answer:
      'If you click "Decline" on an employer pitch in your inbox, the request is closed immediately and your identity, name, email, and PDF resume remain 100% hidden.'
  },
  {
    id: 'c4',
    target: 'candidate',
    category: 'Applications & AI Matching',
    question: 'Why is a 40% AI Match Score required to submit a blind application?',
    answer:
      'To eliminate "spray-and-pray" spam and guarantee that hiring managers review every blind application, our 5-Point AI Match Radar requires a minimum 40% relevance score between your skill matrix and the role\'s core requirements. Running the AI Fit check is 100% free and unlimited.'
  },
  {
    id: 'c5',
    target: 'candidate',
    category: 'Applications & AI Matching',
    question: 'If I update my skills or upload a new resume, does it update my AI Match Score?',
    answer:
      'Yes! Whenever you add new skills or re-scan your resume on your Anonymous Profile page, you can click "Re-Run AI Match" on any open role or click "Recalculate AI Match" inside your Employer Pitches inbox to immediately score your updated profile.'
  },
  {
    id: 'c6',
    target: 'candidate',
    category: 'Dealbreakers & Compensation',
    question: 'How does my Minimum Salary dealbreaker work with Hourly (/hr) roles?',
    answer:
      'Job postings on Special Sauce display either an Annual Salary (/yr) or an Hourly Rate (/hr). When an employer pitches you an hourly role, our dealbreaker firewall automatically multiplies the maximum hourly rate by 2,080 standard work hours/year (e.g., $65/hr = $135,200/yr equivalent) to ensure it meets your minimum annual salary expectation.'
  },
  {
    id: 'c7',
    target: 'candidate',
    category: 'Trial & Candidate Pro ($9/mo)',
    question: 'How does the 7-Day Early Adopter Trial work, and what stays free afterward?',
    answer:
      'Once you verify your identity, your 7-Day Early Adopter Trial begins automatically with 3 Free Blind Applications. Even after your 7 days or 3 free applications are used, browsing open roles, running 5-Point AI Radar checks, and accepting incoming Employer Pitches remain 100% free forever. Upgrading to Candidate Pro ($9/mo) unlocks unlimited outbound blind applications.'
  },

  // ------------------------------------------------------------------
  // EMPLOYER & BPO PARTNER FAQS
  // ------------------------------------------------------------------
  {
    id: 'e1',
    target: 'employer',
    category: 'Verification & Security',
    question: 'How do I verify my Corporate Domain?',
    answer:
      'You can verify your domain in two ways on your Company Profile page: 1) Sign up with a corporate email address that matches your company domain for instant auto-verification, or 2) Add the unique "special-sauce-verification" TXT record to your domain\'s DNS settings and click Verify.'
  },
  {
    id: 'e2',
    target: 'employer',
    category: 'Verification & Security',
    question: 'What data does Special Sauce store vs. what is stored inside Stripe?',
    answer:
      'All payment credentials (credit cards, ACH) and candidate identity verification documents (driver’s licenses, passports, biometric selfies) are stored exclusively inside Stripe’s PCI-DSS Level 1 & SOC 2 certified vault. Special Sauce only stores your organization profile, job postings, candidate skill profiles, uploaded PDF resumes (protected by Row-Level Security), and match history.'
  },
  {
    id: 'e3',
    target: 'employer',
    category: 'Billing, Credits & Role Slots',
    question: 'How do Pitch Credits, Active Role Slots, and Team Seats scale across tiers?',
    answer:
      'Our SaaS tiers use a 2:1 ratio of monthly pitch credits to active job slots: Starter ($99/mo) includes 5 Active Roles, 10 Pitch Credits/mo, and 1 Owner Seat. Growth ($299/mo) includes 15 Active Roles, 30 Pitch Credits/mo, and up to 3 Team/BPO Partner Seats. Enterprise ($899/mo) includes 50 Active Roles, 100 Pitch Credits/mo, up to 10 Seats, and ATS Webhook Auto-Sync.'
  },
  {
    id: 'e4',
    target: 'employer',
    category: 'Billing, Credits & Role Slots',
    question: 'Does unlocking an Inbound Blind Application cost a Connection Credit?',
    answer:
      'No! Reviewing, unlocking, and shortlisting candidates who proactively submit an inbound blind application to your roles is 100% FREE on all active subscription plans. Connection Credits are only deducted (1 credit per pitch) when you proactively send an outbound pitch to a passive candidate from the Candidate Search pool.'
  },
  {
    id: 'e5',
    target: 'employer',
    category: 'Billing, Credits & Role Slots',
    question: 'How do I free up an Active Role Slot if all my slots are full?',
    answer:
      'Your plan limits the number of simultaneously active roles (5 on Starter, 15 on Growth, 50 on Enterprise). If your slots are full, go to Manage Roles (/dashboard/employer/jobs) and toggle any filled or paused role to Inactive/Closed to immediately free up a slot.'
  },
  {
    id: 'e6',
    target: 'employer',
    category: 'Team Seats & BPO Partners',
    question: 'How do we invite Hiring Managers or W-2 BPO / RPO Partners into our workspace?',
    answer:
      'On the Growth ($299/mo, up to 3 seats) and Enterprise ($899/mo, up to 10 seats) plans, open your Company Profile (/dashboard/employer/organization) and scroll to the "Team & Delegated BPO Partner Seats" panel. Enter their email, choose "Internal Hiring Manager" or "Delegated BPO / W-2 Partner", and click Assign Seat. They will receive an email invitation and share your verified organization, roles, and credit pool.'
  },
  {
    id: 'e7',
    target: 'employer',
    category: 'Team Seats & BPO Partners',
    question: 'What is Special Sauce’s policy on BPOs/Consultancies vs. Contingency Staffing Agencies?',
    answer:
      'W-2 Consultancies, Managed Service Providers, and BPOs (where the firm is the employer of record or an authorized delivery partner) are fully supported. To protect candidates from resume harvesting and duplicate blind listings, third-party contingency headhunters cannot post unauthorized duplicate roles—external recruiting partners must work inside the hiring client’s verified organization via a Delegated Partner Seat.'
  },
  {
    id: 'e8',
    target: 'employer',
    category: 'Pipeline & Integrations',
    question: 'What is the SS-XXXXXXXX Reference ID on unlocked candidates and emails?',
    answer:
      'Every application and outbound pitch is assigned a unique Reference ID (e.g., SS-8F42A1B9). When a connection is unlocked, both your hiring team and the candidate receive this Reference ID via email so you can cross-reference the exact match inside your ATS, internal Slack/Teams channels, or support inquiries.'
  }
]