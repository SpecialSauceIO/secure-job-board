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
        'All Employer subscription payments ($149 / $499 / $1,250 Founding Partner Rates; $299 / $799 / $1,999 Retail) and Candidate Pro Pass ($9/mo) transactions are processed on Stripe-hosted Checkout pages. Raw card numbers, CVV codes, and banking details never touch Special Sauce servers.',
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
- Subscription & Billing Data (Stripe Checkout): All payment methods for Employer Tiers ($149/$499/$1,250 Founding) and Candidate Pro ($9/mo) are tokenized and vaulted by Stripe.

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
        title: 'Free Corporate Domain Verification (Explorer Mode)',
        description:
          'Create your Company Profile and verify your corporate domain via work email match or DNS TXT record. Once verified, you unlock Free Explorer Mode to browse the anonymous talent pool, save candidates to your Shortlist, and run 5-Point AI Match Radar previews.',
      },
      {
        step: 'Step 2',
        title: 'Activate Your Tier & Assign Team / BPO Partner Seats',
        description:
          'Choose Starter ($149/mo Founding ($299 Retail): 5 Roles, 10 Credits, 1 Seat), Growth ($499/mo Founding ($799 Retail): 15 Roles, 30 Credits, 3 Seats), or Enterprise ($1,250/mo Founding ($1,999 Retail): 50 Roles, 100 Credits, 10 Seats + ATS Sync). Invite internal hiring managers or W-2 BPO delivery leads on your Company Profile.',
      },
      {
        step: 'Step 3',
        title: 'Publish Blind Roles (30-Day Freshness Window)',
        description:
          'Upload a job description PDF for AI auto-extraction or select your US State & Metro area, Work Model, Employment Type (W-2, 1099/C2C, Contract-to-Hire, Part-Time), and Annual (/yr) or Hourly (/hr) pay band. To prevent ghost jobs, roles automatically expire after 30 days and can be manually renewed in 1 click.',
      },
      {
        step: 'Step 4',
        title: 'Stage 1 Unlock: Open Encrypted In-Platform Threads',
        description:
          'Unlocking inbound applicants (40%+ AI Match) is 100% free; pitching passive candidates from your search or Shortlist costs 1 Credit. Stage 1 opens a real-time encrypted message thread and reveals the candidate’s First Name + Last Initial. (To prevent bulk scraping, you can hold up to 5 unmessaged unlocks at a time).',
      },
      {
        step: 'Step 5',
        title: 'Stage 2 Unlock: Candidate Releases Full Resume & Contact Vault',
        description:
          'Send an introductory message in the thread to discuss the role or schedule an interview. Once the candidate clicks "Release Resume & Contact Vault", their Full Name, direct email, and signed PDF resume unlock permanently.',
      },
    ],
    copyPasteText: `====================================================================
SPECIAL SAUCE — HIRING TEAM & BPO PARTNER QUICK-START GUIDE
====================================================================

1. WHAT IS SPECIAL SAUCE?
Special Sauce is a verified, double-blind technical & professional recruitment marketplace protected by a 2-Stage Identity Vault. Candidates are Stripe Identity-Verified and evaluated by a 5-Point AI Match Radar before any contact information is exchanged.

2. HOW OUR TEAM USES THE PLATFORM (5 STEPS):
- Step 1 — Domain Verification & Shortlisting: Verify our corporate domain to search the anonymous talent pool, filter by employment type (W-2, 1099/C2C, Contract-to-Hire), and bookmark candidates into our Shortlist.
- Step 2 — Shared Team & BPO Partner Seats: Collaborators (Hiring Managers & authorized W-2 BPO delivery partners) share our organization's active role slots and monthly pitch credit pool.
- Step 3 — Publishing Blind Roles (30-Day Auto-Expiry): Every role displays transparent pay ($/yr or $/hr), standardized US State & Metro location, and employment type while keeping our company name blind. Roles auto-expire after 30 days to guarantee freshness and can be renewed in 1 click.
- Step 4 — Stage 1 Unlock (Encrypted Messaging): Inbound applications (40%+ AI Match) are 100% FREE to unlock; outbound pitches to passive talent cost 1 Credit. Stage 1 opens a live encrypted chat thread (Ref: SS-XXXXXXXX) and reveals the candidate's First Name + Last Initial. (Note: Up to 5 unlocked threads can await an initial message at one time).
- Step 5 — Stage 2 Unlock (Full Resume & Email Release): Once we message the candidate in the thread, they click "Release Resume & Contact Vault" to unlock their Full Name, direct email, and downloadable PDF resume.

3. PLAN TIERS & SEAT CAPACITY (2:1 CREDIT RATIO):
- Starter ($149/mo Founding ($299 Retail)): Up to 5 Active Roles | 10 Pitch Credits/mo | 1 Seat (Owner)
- Growth ($499/mo Founding ($799 Retail)): Up to 15 Active Roles | 30 Pitch Credits/mo | Up to 3 Team/BPO Seats
- Enterprise ($1,250/mo Founding ($1,999 Retail)): Up to 50 Active Roles | 120 Pitch Credits/mo | Up to 10 Seats + ATS Webhook Sync
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
        title: 'AI Resume Extraction & Vaulted Profile Setup',
        description:
          'Upload your PDF resume on your Profile page. Our AI extracts your skills, years of experience, and a third-person bio while locking your Full Name, email, and original PDF inside the Special Sauce Vault.',
      },
      {
        step: 'Step 2',
        title: 'Set Your Dealbreaker Firewall (Pay, Work Model & Employment Type)',
        description:
          'Configure your minimum annual salary expectation, preferred work model (Remote, Hybrid, On-site), target US State & Metro area, and accepted Employment Types (Full-Time W-2, Contract 1099/C2C, Contract-to-Hire, Part-Time). Employers who fail your dealbreakers are automatically blocked from pitching you.',
      },
      {
        step: 'Step 3',
        title: '1-Time Identity Verification & 7-Day Early Adopter Trial',
        description:
          'Complete Stripe Identity verification once to earn your "Identity Verified" badge. This immediately activates your 7-Day Early Adopter Trial with 3 Free Blind Applications.',
      },
      {
        step: 'Step 4',
        title: 'Save Roles, Run Free 5-Point AI Match Checks & Apply Blind',
        description:
          'Browse active roles (all verified fresh within 30 days), bookmark favorites into Saved Roles, and run unlimited 5-Point AI Match Radar checks for free. When you score 40%+, submit a 1-click Blind Application.',
      },
      {
        step: 'Step 5',
        title: '2-Stage Unlock: Chat Safely First, Release Your Resume Vault When Ready',
        description:
          'When an employer unlocks your application—or when you accept an incoming Employer Pitch (always 100% free)—Stage 1 opens an encrypted in-platform chat and reveals the employer’s company name while keeping your email and PDF resume vaulted. Only when you click "Release Resume & Contact Vault" (Stage 2) does the employer receive your direct email and PDF resume!',
      },
    ],
    copyPasteText: `====================================================================
SPECIAL SAUCE — CANDIDATE HOW-IT-WORKS & 2-STAGE VAULT CHEAT SHEET
====================================================================

1. ZERO RESUME HARVESTING (2-STAGE IDENTITY VAULT):
- While browsing, employers only see "Anonymous Candidate #ID" with your extracted skills, experience level, US Metro location, and third-person bio.
- Stage 1 (Encrypted Thread): When an employer unlocks your application or you accept an employer pitch, an encrypted in-platform chat opens. You see the employer's verified company name and domain, and they see only your First Name + Last Initial. Your raw email and PDF resume stay LOCKED in the vault.
- Stage 2 (You Control the Vault Key): After chatting with the employer in the thread to confirm genuine interview interest, click "Release Resume & Contact Vault" in 1 click to share your Full Name, direct email, and PDF resume.

2. YOUR DEALBREAKER FIREWALL & SAVED ROLES:
- Set your Minimum Salary ($/yr), Work Model (Remote, Hybrid, On-site), Accepted Employment Types (W-2, 1099/C2C, Contract-to-Hire, Part-Time), and US State/Metro on your Preferences page.
- Bookmark interesting listings using "Save Role" to compare AI Match Radar scores side-by-side before applying.
- All job listings automatically close after 30 days unless manually renewed by the employer—so you never waste applications on stale "ghost jobs."

3. REAL-TIME NOTIFICATIONS & MEMBERSHIP:
- Receive instant email alerts, dashboard unread badges, and an optional browser audio chime whenever an employer messages you.
- Inbound Employer Pitches are 100% free forever. Upgrade to Candidate Pro ($9/mo) anytime for unlimited outbound blind applications.
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
      'Identity verification ensures the integrity of the Special Sauce talent pool, eliminating bots and duplicate accounts. Your government ID and biometric selfie are NEVER stored on Special Sauce servers—they are processed and vaulted exclusively by Stripe Identity using bank-grade AES-256 encryption. Special Sauce only receives a "Verified" status token.',
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
    category: 'Trial & Candidate Pro ($9/mo)',
    question:
      'How does the 7-Day Early Adopter Trial work, and what stays free afterward?',
    answer:
      'Once you verify your identity, your 7-Day Early Adopter Trial begins automatically with 3 Free Blind Applications. Even after your 7 days or 3 free applications are used, browsing open roles, saving bookmarks, running 5-Point AI Radar checks, messaging in unlocked threads, and accepting incoming Employer Pitches remain 100% free forever. Upgrading to Candidate Pro ($9/mo) unlocks unlimited outbound blind applications.',
  },

  // ------------------------------------------------------------------
  // EMPLOYER & BPO PARTNER FAQS
  // ------------------------------------------------------------------
  {
    id: 'e1',
    target: 'employer',
    category: 'Verification & Anti-Harvesting Security',
    question: 'How do I verify my Corporate Domain?',
    answer:
      'You can verify your domain in two ways on your Company Profile page: 1) Sign up with a corporate email address that matches your company domain for instant auto-verification, or 2) Add the unique "special-sauce-verification" TXT record to your domain\'s DNS settings and click Verify.',
  },
  {
    id: 'e2',
    target: 'employer',
    category: 'Verification & Anti-Harvesting Security',
    question:
      'How does the 2-Stage Unlock & 5-Unmessaged-Unlock cap work for Employers?',
    answer:
      'When you unlock an inbound applicant (free) or a passive candidate accepts your outbound pitch (1 credit), Stage 1 opens an encrypted in-platform message thread and reveals the candidate’s First Name + Last Initial. Send a quick introductory message in the thread to invite them to interview—once they click "Release Resume & Contact Vault" (Stage 2), their Full Name, direct email, and signed PDF resume unlock immediately. To prevent automated scraping, an organization can hold at most 5 unlocked threads awaiting an initial employer message at a time.',
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
      'How do Pitch Credits, Active Role Slots, and Candidate Shortlists work?',
    answer:
      'Starter ($149/mo Founding ($299 Retail)) includes 5 Active Roles, 10 Pitch Credits/mo, and 1 Seat. Growth ($499/mo Founding ($799 Retail)) includes 15 Active Roles, 30 Pitch Credits/mo, and 3 Seats. Enterprise ($1,250/mo Founding ($1,999 Retail)) includes 50 Active Roles, 120 Pitch Credits/mo, and 10 Seats. While browsing passive candidates, you can click "Save to Shortlist" for free to bookmark candidates and compare their 5-Point AI Match scores before spending a Connection Credit to pitch them.',
  },
  {
    id: 'e5',
    target: 'employer',
    category: 'Billing, Credits & Shortlisting',
    question:
      'Does unlocking an Inbound Blind Application cost a Connection Credit?',
    answer:
      'No! Reviewing, unlocking Stage 1 threads, messaging, and shortlisting candidates who proactively submit an inbound blind application to your roles is 100% FREE on all active subscription plans. Connection Credits are only deducted (1 credit per pitch) when you proactively send an outbound pitch to a passive candidate from the Candidate Search pool.',
  },
  {
    id: 'e6',
    target: 'employer',
    category: 'Team Seats & BPO Partners',
    question:
      'How do we invite Hiring Managers or W-2 BPO / RPO Partners into our workspace?',
    answer:
      'On the Growth ($499/mo Founding ($799 Retail), up to 3 seats) and Enterprise ($1,250/mo Founding ($1,999 Retail), up to 10 seats) plans, open your Company Profile (/dashboard/employer/organization) and scroll to the "Team & Delegated BPO Partner Seats" panel. Enter their email, choose "Internal Hiring Manager" or "Delegated BPO / W-2 Partner", and click Assign Seat. They will receive an email invitation and share your verified organization, roles, and credit pool.',
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