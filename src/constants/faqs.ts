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
  title: 'Data Security, 2-Stage Identity Vault & Stripe Architecture',
  subtitle:
    'Special Sauce is engineered on a Zero-Sensitive-PII-Storage and Anti-Harvesting architecture. Biometric identity documents and payment credentials are vaulted exclusively by Stripe, while candidate resumes and direct contact details remain locked behind our 2-Stage Identity Vault until the candidate explicitly releases them.',
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
        'All Employer subscription payments ($149 / $499 / $1,250 Founding Partner Rates locked for 12 months; $299 / $799 / $1,999 Retail), Rollover Pitch Credit Top-Up Packs ($150 / $325 / $825), and Candidate Professional ($9/mo) or Prestige ($15/mo) transactions are processed on Stripe-hosted Checkout pages. Raw card numbers, CVV codes, and banking details never touch Special Sauce servers.',
    },
  ],
  platformStoredItems: [
    {
      title: '2-Stage Candidate Identity & Resume Vault (Anti-Harvesting)',
      detail:
        'Stage 1 (Initial Unlock / Pitch Acceptance) opens an encrypted in-platform message thread and reveals only the candidate’s First Name + Last Initial alongside the employer’s verified company identity. Stage 2 requires the candidate’s explicit 1-click consent ("Release Resume & Contact Vault") before their full name, direct email, and 1-hour signed PDF resume URL are revealed.',
    },
    {
      title: 'In-Platform Encrypted Messaging & AI Phishing Firewall',
      detail:
        'All initial candidate-employer conversations occur inside real-time threads tied to a shared Reference ID (SS-XXXXXXXX). Every message passes through an automated AI/heuristic safety scanner that blocks requests for SSNs, banking details, off-platform chat lures (WhatsApp/Telegram), or external harvesting forms.',
    },
    {
      title: '30-Day Job Auto-Expiration & 5-Unlock Anti-Scraping Ceiling',
      detail:
        'To eliminate ghost roles and bulk resume scraping, all job listings automatically close after 30 days unless manually renewed by the employer. Employers are also capped at a maximum of 5 unmessaged unlocked threads at a time.',
    },
    {
      title: 'Anonymous Skill Matrix, Bookmarks & Organization Seats',
      detail:
        'Extracted technical skills, years of experience, third-person bio, US State/Metro location, employment type dealbreakers (W-2, 1099/C2C, Contract-to-Hire, Part-Time), saved bookmarks, and authorized Hiring Manager / W-2 BPO Partner seats.',
    },
  ],
  copyPasteSecurityBrief: `====================================================================
SPECIAL SAUCE — DATA SECURITY, 2-STAGE VAULT & STRIPE COMPLIANCE BRIEF
====================================================================

1. ZERO BIOMETRIC OR PAYMENT CARD STORAGE ON PLATFORM SERVERS:
Special Sauce does NOT store government ID images, biometric selfies, credit card numbers, or bank account details in our application database.

2. WHAT IS STORED EXCLUSIVELY INSIDE STRIPE (PCI-DSS LEVEL 1 & SOC 2):
- Candidate Identity Verification (Stripe Identity): Government IDs and biometric liveness checks are captured and encrypted (AES-256) directly inside Stripe's isolated vault. Special Sauce only stores a boolean "Identity Verified" status token.
- Subscription & Billing Data (Stripe Checkout): All payment methods for Employer Tiers ($149/$499/$1,250 Founding Partner Rates; $299/$799/$1,999 Retail), Rollover Top-Up Packs ($150/$325/$825), and Candidate Professional ($9/mo) & Prestige ($15/mo) plans are tokenized and vaulted by Stripe.

3. 2-STAGE ANTI-HARVESTING IDENTITY VAULT & IN-PLATFORM MESSAGING:
- Stage 1 (Encrypted Thread Unlock): When an employer unlocks an inbound application or a candidate accepts an outbound pitch, an encrypted in-platform chat thread opens (Ref: SS-XXXXXXXX). The employer's verified company name/domain and the candidate's First Name + Last Initial are revealed, while the candidate's raw email and PDF resume remain strictly vaulted.
- Stage 2 (Candidate-Controlled Vault Release): Only after the employer engages in the thread and the candidate clicks "Release Resume & Contact Vault" are the candidate's Full Name, direct email, and 1-hour signed PDF resume URL unlocked.
- Anti-Scraping & Phishing Guardrails: Employers cannot hold more than 5 unlocked threads without sending an introductory message. All job postings automatically expire after 30 days unless manually renewed, and in-platform messages are scanned in real time to block SSN/banking requests and off-platform phishing links.
====================================================================`,
}

export const PLAYBOOK_GUIDES: Record<'employer' | 'candidate', PlaybookGuide> = {
  employer: {
    id: 'employer',
    title: 'Employer & BPO Partner Playbook',
    subtitle:
      'How Special Sauce works for Hiring Managers, Talent Acquisition Teams, and Delegated W-2 BPO Partners.',
    badge: 'Hiring Team & BPO Guide',
    steps: [
      {
        step: 'Step 1',
        title: 'Corporate Domain Verification & 12-Month Founding Rate Lock',
        description:
          'Create your Company Profile and verify your corporate domain via work email match or DNS TXT record. Verifying your domain during our launch window locks in Founding Partner Rates (up to 50% off standard retail pricing for your first 12 full months) and Permanent Founding Partner trust badges.',
      },
      {
        step: 'Step 2',
        title: 'Activate Your Tier & Assign Team / BPO Partner Seats',
        description:
          'Choose Starter ($149/mo Founding / $299 Retail: 5 Active Roles, 10 Monthly Pitch Credits, 2 Collaborator Seats), Growth ($499/mo Founding / $799 Retail: 15 Active Roles, 35 Monthly Pitch Credits, up to 5 Team/BPO Seats), or Enterprise ($1,250/mo Founding / $1,999 Retail: Unlimited Active Roles, 120 Monthly Pitch Credits, Unlimited Seats + Workday/Greenhouse ATS Sync).',
      },
      {
        step: 'Step 3',
        title: 'Publish Blind Roles (30-Day Freshness Window)',
        description:
          'Upload a job description PDF for AI auto-extraction or select your US State & Metro area, Work Model, Employment Type (W-2, 1099/C2C, Contract-to-Hire, Part-Time), and Annual (/yr) or Hourly (/hr) pay band. To prevent ghost jobs, roles automatically expire after 30 days and can be manually renewed in 1 click.',
      },
      {
        step: 'Step 4',
        title: 'Stage 1 Unlock & 100% Accepted-Only Credit Protection',
        description:
          'Unlocking inbound applicants (70%+ AI Fit) is 100% free (0 credits). Pitching passive candidates from your search or Shortlist uses 1 Pitch Credit backed by our 100% Accepted-Only Guarantee—if a candidate declines your pitch, the credit is automatically refunded to the exact bucket it came from. Stage 1 opens a real-time encrypted message thread and reveals the candidate’s First Name + Last Initial.',
      },
      {
        step: 'Step 5',
        title: 'Stage 2 Unlock: Candidate Releases Full Resume & Contact Vault',
        description:
          'Send an introductory message in the thread to discuss the role or schedule an interview. Once the candidate clicks "Release Resume & Contact Vault", their Full Name, direct email, and signed PDF resume unlock permanently (and auto-sync to Workday or Greenhouse on Enterprise).',
      },
    ],
    copyPasteText: `====================================================================
SPECIAL SAUCE — HIRING TEAM & BPO PARTNER QUICK-START GUIDE
====================================================================

1. WHAT IS SPECIAL SAUCE?
Special Sauce is a verified, double-blind technical & professional recruitment marketplace protected by a 2-Stage Identity Vault. Active candidates are Stripe Biometric Identity-Verified and evaluated by a 5-Point AI Fit Radar before any contact information is exchanged.

2. HOW OUR TEAM USES THE PLATFORM (5 STEPS):
- Step 1 — Domain Verification & 12-Month Rate Lock: Verify our corporate domain to lock in 12-Month Founding Partner Rates, search the anonymous talent pool, filter by employment type (W-2, 1099/C2C, Contract-to-Hire), and bookmark candidates into our Shortlist.
- Step 2 — Shared Team & BPO Partner Seats: Collaborators (Hiring Managers & authorized W-2 BPO delivery partners) share our organization's active role slots and Two-Bucket pitch credit pool.
- Step 3 — Publishing Blind Roles (30-Day Auto-Expiry): Every role displays transparent pay ($/yr or $/hr), standardized US State & Metro location, and employment type while keeping our company name blind. Roles auto-expire after 30 days to guarantee freshness and can be renewed in 1 click.
- Step 4 — Stage 1 Unlock & Accepted-Only Credit Protection: Inbound applications (70%+ AI Fit) are 100% FREE to unlock; outbound pitches to passive talent use 1 Pitch Credit and are auto-refunded if declined. Stage 1 opens a live encrypted chat thread (Ref: SS-XXXXXXXX) and reveals the candidate's First Name + Last Initial.
- Step 5 — Stage 2 Unlock (Full Resume & Email Release): Once we message the candidate in the thread, they click "Release Resume & Contact Vault" to unlock their Full Name, direct email, and downloadable PDF resume.

3. EMPLOYER PLANS (12-MONTH FOUNDING PARTNER RATE LOCK) & TOP-UPS:
- Starter ($149/mo Founding · $299/mo Retail after Mo 12): Up to 5 Active Roles | 10 Pitch Credits/mo | 2 Team/BPO Seats
- Growth ($499/mo Founding · $799/mo Retail after Mo 12): Up to 15 Active Roles | 35 Pitch Credits/mo | Up to 5 Team/BPO Seats
- Enterprise ($1,250/mo Founding · $1,999/mo Retail after Mo 12): Unlimited Active Roles | 120 Pitch Credits/mo | Unlimited Seats + Workday/Greenhouse ATS Sync
- Non-Expiring Rollover Top-Up Packs (Bucket 2): Boost (+10 Credits for $150), Surge (+25 Credits for $325), Scale (+75 Credits for $825)
====================================================================`,
  },
  candidate: {
    id: 'candidate',
    title: 'Candidate Process & 2-Stage Vault Guide',
    subtitle:
      'How Special Sauce protects your anonymity, eliminates resume harvesting, and gives you 100% control over when your resume and email are released.',
    badge: 'Candidate Guide',
    steps: [
      {
        step: 'Step 1',
        title: 'Free Explorer Career Vault ($0/Forever) & AI Resume Extraction',
        description:
          'Upload your PDF resume on your Profile page for $0 forever on the Explorer plan. Our AI extracts your skills, years of experience, and a third-person bio while locking your Full Name, email, and original PDF inside the Special Sauce Vault.',
      },
      {
        step: 'Step 2',
        title: 'Set Your Dealbreaker Firewall (Pay, Work Model & Employment Type)',
        description:
          'Configure your minimum annual salary expectation, preferred work model (Remote, Hybrid, On-site), target US State & Metro area, and accepted Employment Types (Full-Time W-2, Contract 1099/C2C, Contract-to-Hire, Part-Time). Employers who fail your dealbreakers are automatically blocked from pitching you.',
      },
      {
        step: 'Step 3',
        title: 'Run Free 5-Point AI Fit Checks & Receive Pitch Alerts',
        description:
          'Browse active blind roles (all verified fresh within 30 days), bookmark favorites into Saved Roles, run unlimited 5-Point AI Fit Radar checks, and receive real-time alerts whenever a verified employer pitches you.',
      },
      {
        step: 'Step 4',
        title: 'Upgrade & Complete 1-Time Biometric ID Verification When Ready',
        description:
          'When you spot a role you want to apply for (70%+ AI Fit) or want to unlock an incoming employer pitch, upgrade to Professional ($9/mo for 15 monthly blind applications + unlimited pitch unlocks) or Prestige ($15/mo for unlimited blind applications + Top-Priority Employer Search placement) and complete your 1-time Stripe Biometric ID Verification.',
      },
      {
        step: 'Step 5',
        title: '2-Stage Unlock: Chat Safely First, Release Your Resume Vault When Ready',
        description:
          'When an employer unlocks your application—or when you accept an incoming Employer Pitch—Stage 1 opens an encrypted in-platform chat and reveals the employer’s verified company name while keeping your email and PDF resume vaulted. Only when you click "Release Resume & Contact Vault" (Stage 2) does the employer receive your direct email and PDF resume!',
      },
    ],
    copyPasteText: `====================================================================
SPECIAL SAUCE — CANDIDATE HOW-IT-WORKS & 2-STAGE VAULT REFERENCE GUIDE
====================================================================

1. ZERO RESUME HARVESTING (2-STAGE IDENTITY VAULT):
- While browsing, employers only see "Anonymous Candidate #ID" with your extracted skills, experience level, US Metro location, and third-person bio.
- Stage 1 (Encrypted Thread): When an employer unlocks your application or you accept an employer pitch, an encrypted in-platform chat opens. You see the employer's verified company name and domain, and they see only your First Name + Last Initial. Your raw email and PDF resume stay LOCKED in the vault.
- Stage 2 (You Control the Vault Key): After chatting with the employer in the thread to confirm genuine interview interest, click "Release Resume & Contact Vault" in 1 click to share your Full Name, direct email, and PDF resume.

2. YOUR DEALBREAKER FIREWALL & SAVED ROLES:
- Set your Minimum Salary ($/yr), Work Model (Remote, Hybrid, On-site), Accepted Employment Types (W-2, 1099/C2C, Contract-to-Hire, Part-Time), and US State/Metro on your Preferences page.
- Bookmark interesting listings using "Save Role" to compare 5-Point AI Fit Radar scores side-by-side before applying.
- All job listings automatically close after 30 days unless manually renewed by the employer—so you never waste applications on stale "ghost jobs."

3. CANDIDATE MEMBERSHIP TIERS ($0 / $9 / $15):
- Explorer ($0/forever): Live anonymous profile in Employer Search, unlimited 5-Point AI Fit Radar checks, and real-time Inbound Employer Pitch alerts.
- Professional ($9/mo): Includes 1-time Stripe Biometric ID Verification, unlimited Inbound Employer Pitch unlocks, 15 Outbound Blind Applications/month (70%+ AI Fit), and Permanent Founding Member status.
- Prestige ($15/mo): Includes 1-time Stripe Biometric ID Verification, Unlimited Outbound Blind Applications (70%+ AI Fit), unlimited pitch unlocks, and Top-Priority Spotlight placement in Employer Talent Search.
====================================================================`,
  },
}

export const SUPPORT_FAQS: FAQ[] = [
  // ------------------------------------------------------------------
  // CANDIDATE FAQS
  // ------------------------------------------------------------------
  {
    id: 'c1',
    target: 'candidate',
    category: 'Verification & 2-Stage Vault Privacy',
    question:
      'Why do I need to verify my identity, and is my government ID stored by Special Sauce?',
    answer:
      'Identity verification ensures the integrity of the Special Sauce talent pool, eliminating bots and duplicate accounts. You can build your anonymous Explorer vault and run 5-Point AI Fit checks for $0 without verifying upfront, and complete your 1-time Biometric ID Verification (included with Professional $9/mo and Prestige $15/mo) only when you are ready to apply or unlock a pitch. Your government ID and biometric selfie are NEVER stored on Special Sauce servers—they are vaulted exclusively by Stripe Identity using AES-256 encryption.',
  },
  {
    id: 'c2',
    target: 'candidate',
    category: 'Verification & 2-Stage Vault Privacy',
    question:
      'How does the 2-Stage Identity Vault protect me from resume harvesters?',
    answer:
      'Unlike traditional job boards that hand over your resume and email immediately, Special Sauce uses a 2-Stage Unlock. In Stage 1 (when an employer unlocks your application or you accept their pitch), an encrypted in-platform chat thread opens: you see the employer’s verified company name, and they see only your First Name + Last Initial. Your raw email address and PDF resume remain locked inside the vault until you chat with them and click the "Release Resume & Contact Vault" button (Stage 2).',
  },
  {
    id: 'c3',
    target: 'candidate',
    category: 'Verification & 2-Stage Vault Privacy',
    question:
      'How do I know if an employer has messaged me in an encrypted thread?',
    answer:
      'Whenever an employer sends you a message, three things happen automatically: 1) We send an email notification to your inbox with a direct link to the thread, 2) Your Candidate Dashboard displays a pulsing "New Msg" badge on your Applications or Employer Pitches card in real time, and 3) If you have the dashboard or thread open in your browser, a gentle two-note audio chime plays automatically (which you can mute anytime).',
  },
  {
    id: 'c4',
    target: 'candidate',
    category: 'Applications, Bookmarks & Freshness',
    question:
      'How does Special Sauce prevent stale "ghost jobs" on the job board?',
    answer:
      'Every job listing on Special Sauce is governed by a strict 30-Day Anti-Harvesting Expiration policy. Each job card displays a live "Closes in Xd" countdown badge. When a role reaches 30 days, it is automatically closed and removed from candidate feeds unless the employer manually renews it for a fresh 30-day cycle.',
  },
  {
    id: 'c5',
    target: 'candidate',
    category: 'Applications, Bookmarks & Freshness',
    question:
      'Can I bookmark or save roles to compare before using my blind applications?',
    answer:
      'Yes! Click the "Save Role" button on any job card to bookmark it. You can filter by your bookmarked listings at any time using the "Saved Roles" button at the top of your Candidate Dashboard or the Discover Blind Roles page.',
  },
  {
    id: 'c6',
    target: 'candidate',
    category: 'Dealbreakers & Compensation',
    question:
      'How do Employment Type dealbreakers (W-2 vs. 1099) and Hourly (/hr) pay conversions work?',
    answer:
      'On your Match Preferences page, you can select which Employment Types you accept (Full-Time W-2, Contract 1099/Corp-to-Corp, Contract-to-Hire, or Part-Time) in addition to your Minimum Annual Salary and Work Model. Employers are blocked from pitching you roles that don’t match your accepted employment types, and hourly roles are automatically annualized at 2,080 hours/year to verify they meet your minimum pay expectation.',
  },
  {
    id: 'c7',
    target: 'candidate',
    category: 'Plans, Biometric ID & Candidate Tiers ($0 / $9 / $15)',
    question:
      'What is the difference between Explorer ($0), Professional ($9/mo), and Prestige ($15/mo)?',
    answer:
      'Explorer ($0/forever) lets you keep your anonymous profile live in Employer Search, browse verified salary bands, run unlimited 5-Point AI Fit Radar checks, and receive real-time Inbound Employer Pitch alerts. When you are ready to engage, Professional ($9/mo) includes 1-time Biometric ID Verification, unlimited Inbound Employer Pitch unlocks, and 15 Outbound Blind Applications/month (for roles where you score 70%+ AI Fit). Prestige ($15/mo) includes everything in Professional plus Unlimited Outbound Blind Applications (70%+ AI Fit) and Top-Priority Spotlight placement in Employer Talent Search. You can switch or downgrade plans anytime.',
  },

  // ------------------------------------------------------------------
  // EMPLOYER & BPO PARTNER FAQS
  // ------------------------------------------------------------------
  {
    id: 'e1',
    target: 'employer',
    category: 'Verification & Anti-Harvesting Security',
    question: 'How do I verify my Corporate Domain and lock in Founding Partner Rates?',
    answer:
      'You can verify your domain in two ways on your Company Profile page: 1) Sign up with a corporate email address that matches your company domain for instant auto-verification, or 2) Add the unique "special-sauce-verification" TXT record to your domain’s DNS settings and click Verify. Verifying your domain during our launch window locks in Founding Partner Rates ($149 / $499 / $1,250 per month—up to 50% off retail) for your first 12 full months.',
  },
  {
    id: 'e2',
    target: 'employer',
    category: 'Verification & Anti-Harvesting Security',
    question:
      'How does the 2-Stage Unlock & 5-Unmessaged-Unlock cap work for Employers?',
    answer:
      'When you unlock an inbound applicant (100% free) or a passive candidate accepts your outbound pitch (1 Pitch Credit), Stage 1 opens an encrypted in-platform message thread and reveals the candidate’s First Name + Last Initial. Send a quick introductory message in the thread to invite them to interview—once they click "Release Resume & Contact Vault" (Stage 2), their Full Name, direct email, and signed PDF resume unlock immediately. To prevent automated scraping, an organization can hold at most 5 unlocked threads awaiting an initial employer message at a time.',
  },
  {
    id: 'e3',
    target: 'employer',
    category: 'Verification & Anti-Harvesting Security',
    question:
      'Why do job postings expire after 30 days, and how do we renew them?',
    answer:
      'To guarantee candidates that every role on Special Sauce is actively hiring, listings automatically expire 30 days after creation. You can see the exact days remaining on your Job Management page (/dashboard/employer/jobs) and click "Renew +30d" (or "Reopen & Renew (+30d)") at any time to reset the 30-day clock.',
  },
  {
    id: 'e4',
    target: 'employer',
    category: 'Billing, Credits & Shortlisting',
    question:
      'How do Employer Plans, Two-Bucket Rollover Credits, and 100% Accepted-Only Protection work?',
    answer:
      'Starter ($149/mo Founding · $299/mo Retail after Month 12) includes up to 5 Active Roles, 10 Monthly Pitch Credits, and 2 Team/BPO Seats. Growth ($499/mo Founding · $799/mo Retail) includes up to 15 Active Roles, 35 Monthly Pitch Credits, and up to 5 Team/BPO Seats. Enterprise ($1,250/mo Founding · $1,999/mo Retail) includes Unlimited Active Roles, 120 Monthly Pitch Credits, Unlimited Seats, and Workday/Greenhouse ATS Sync. Your Monthly Plan Credits (Bucket 1) are always spent first; if you need extra reach, you can add non-expiring Rollover Top-Up Packs (Bucket 2: +10 for $150, +25 for $325, or +75 for $825). Every outbound pitch is protected by our 100% Accepted-Only Guarantee—if a candidate declines your pitch, the credit is automatically refunded to the exact bucket it came from.',
  },
  {
    id: 'e5',
    target: 'employer',
    category: 'Billing, Credits & Shortlisting',
    question:
      'Does unlocking an Inbound Blind Application cost a Pitch Credit?',
    answer:
      'No! Reviewing, unlocking Stage 1 threads, messaging, and shortlisting candidates who proactively submit an inbound blind application to your roles is 100% FREE (0 credits) on all active subscription plans. Pitch Credits are only used (1 credit per pitch) when you proactively send an outbound pitch to a passive candidate from the Candidate Search pool.',
  },
  {
    id: 'e6',
    target: 'employer',
    category: 'Team Seats & BPO Partners',
    question:
      'How do we invite Hiring Managers or W-2 BPO / RPO Partners into our workspace?',
    answer:
      'Every paid Employer plan includes collaborator seats: Starter ($149/mo Founding) includes 2 seats, Growth ($499/mo Founding) includes up to 5 seats, and Enterprise ($1,250/mo Founding) includes Unlimited Team & Delegated W-2 BPO/RPO Partner seats. Open your Company Profile (/dashboard/employer/organization) and scroll to the "Team & Delegated BPO Partner Seats" panel. Enter their email, choose "Internal Hiring Manager" or "Delegated BPO / W-2 Partner", and click Assign Seat.',
  },
  {
    id: 'e7',
    target: 'employer',
    category: 'Pipeline & Real-Time Messaging',
    question:
      'How do we know when a candidate replies or releases their Resume Vault?',
    answer:
      'Whenever a candidate replies in an encrypted thread or approves Stage 2 Vault Release, your team receives an instant email notification with the SS-XXXXXXXX Reference ID, a pulsing "New Msg" badge appears on your Employer Dashboard cards in real time, and an audio chime plays if your browser tab is open.',
  },
]
