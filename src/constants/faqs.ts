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
  title: 'Data Security, Intro/Convo Identity Vault & Stripe Architecture',
  subtitle:
    'Special Sauce is engineered on a Zero-ID-Storage and Anti-Harvesting architecture. Biometric identity documents and payment credentials for both Candidates and Employer Admins are vaulted exclusively by Stripe, while candidate resumes and direct contact details remain locked behind our Intro/Convo Identity Vault until the candidate explicitly releases them.',
  stripeVaultItems: [
    {
      title: 'Government IDs & Passports (Candidate & Employer Admin Stripe Identity)',
      detail:
        'Photos of driver’s licenses, passports, and national ID cards uploaded during Candidate onboarding and Employer Account Admin verification are transmitted directly to Stripe Identity over TLS 1.3 and encrypted using AES-256 inside Stripe’s isolated biometric vault.',
    },
    {
      title: 'Biometric Selfie Checks & Zero-Knowledge Tokens',
      detail:
        'Live facial recognition vectors and selfie verification captures are processed exclusively by Stripe Identity. Special Sauce never touches raw biometric images and only receives a boolean verification status ("verified" or "requires_input") and a session reference token.',
    },
    {
      title: 'Credit Cards, ACH & Banking Details (PCI-DSS Level 1)',
      detail:
        'All Employer subscription payments ($149 / $499 / $1,250 Founding Partner Rates locked for 12 months; $299 / $799 / $1,999 Retail), Rollover Invitation Credit Top-Up Packs ($150 / $350 / $900), and Candidate Explorer ($3/mo), Professional ($9/mo), or Prestige ($15/mo) transactions are processed on Stripe-hosted Checkout pages. Raw card numbers, CVV codes, and banking details never touch Special Sauce servers.',
    },
  ],
  platformStoredItems: [
    {
      title: 'Intro/Convo Candidate Identity & Resume Vault (Anti-Harvesting)',
      detail:
        'The Introduction (Initial Unlock / Invitation Acceptance) opens an encrypted in-platform message thread and reveals only the candidate’s First Name + Last Initial alongside the employer’s verified company identity. The Conversation requires the candidate’s explicit 1-click consent ("Release Resume & Contact Vault") before their full name, direct email, and 1-hour signed PDF resume URL are revealed.',
    },
    {
      title: '3-Pillar Employer Anti-Harvesting Trust Gate',
      detail:
        'Every employer organization must pass three mandatory trust checks before publishing roles or searching talent: Pillar 1 (Corporate Domain DNS MX/TXT validation + automated 90-Day RDAP registry age check blocking burner domains), Pillar 2 (9-digit IRS Federal EIN & State of Incorporation officer attestation), and Pillar 3 (1-time Stripe Identity biometric check for the Account Admin).',
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
  ],
  copyPasteSecurityBrief: `====================================================================
SPECIAL SAUCE — DATA SECURITY, 2-STAGE VAULT & STRIPE COMPLIANCE BRIEF
====================================================================

1. ZERO BIOMETRIC OR PAYMENT CARD STORAGE ON PLATFORM SERVERS:
Special Sauce does NOT store government ID images, verification selfies, credit card numbers, or bank account details in our application database.

2. WHAT IS STORED EXCLUSIVELY INSIDE STRIPE (PCI-DSS LEVEL 1 & SOC 2):
- Biometric Identity Verification (Stripe Identity): Government IDs and live selfie checks for both Candidates and Employer Account Admins are captured and encrypted (AES-256) directly inside Stripe's isolated vault. Special Sauce only stores a boolean "Identity Verified" status token.
- Subscription & Billing Data (Stripe Checkout): All payment methods for Employer Tiers ($149/$499/$1,250 Founding Partner Rates locked for 12 months; $299/$799/$1,999 Retail), Rollover Top-Up Packs ($150 / $350 / $900), and Candidate Explorer ($3/mo), Professional ($9/mo) & Prestige ($15/mo) plans are tokenized and vaulted by Stripe.

3. 3-PILLAR EMPLOYER ANTI-HARVESTING GATE:
- Pillar 1 (Domain & 90-Day RDAP Age Check): Work-email or DNS TXT verification paired with live DNS MX validation and an automated IANA/RDAP lookup blocking burner domains (<90 days old).
- Pillar 2 (US Tax Entity Attestation): 9-digit IRS Federal Tax ID (EIN) and State of Incorporation officer attestation.
- Pillar 3 (Admin Biometric ID): 1-time Stripe Identity photo ID & live selfie verification for the Employer Account Admin.

4. INTRO/CONVO ANTI-HARVESTING IDENTITY VAULT & IN-PLATFORM MESSAGING:
- The Introduction (Encrypted Thread Unlock): When an employer unlocks an inbound application or a candidate accepts a Professional Invitation, an encrypted in-platform chat thread opens (Ref: SS-XXXXXXXX). The employer's verified company name/domain and the candidate's First Name + Last Initial are revealed, while the candidate's raw email and PDF resume remain strictly vaulted.
- The Conversation (Candidate-Controlled Vault Release): Only after the employer engages in the thread and the candidate clicks "Release Resume & Contact Vault" are the candidate's Full Name, direct email, and 1-hour signed PDF resume URL unlocked.
- Anti-Scraping & Phishing Guardrails: Employers cannot hold more than 5 unlocked threads without sending an introductory message. All job postings automatically expire after 30 days unless manually renewed, and in-platform messages are scanned in real time to block SSN/banking requests and off-platform phishing links.
====================================================================`,
}

export const PLAYBOOK_GUIDES: Record<'employer' | 'candidate', PlaybookGuide> = {
  employer: {
    id: 'employer',
    title: 'Employer & Recruiter Playbook',
    subtitle:
      'How Special Sauce works for Hiring Managers, Talent Acquisition Teams, and External Recruiting Partners.',
    badge: 'Hiring Team Guide',
    steps: [
      {
        step: 'Step 1',
        title: 'Register Organization & Lock In 12-Month Founding Partner Rate',
        description:
          'Create your Employer account, select your Primary Industry Vertical and Company Size, and activate Starter ($149/mo Founding / $299 Retail), Growth ($499/mo Founding / $799 Retail), or Enterprise ($1,250/mo Founding / $1,999 Retail) with a 12-Month Founding Partner Rate Lock.',
      },
      {
        step: 'Step 2',
        title: 'Complete the 3-Pillar Anti-Harvesting Trust Gate',
        description:
          'Verify your corporate domain (via work-email match or DNS TXT token + automated 90-day RDAP domain age check), attest your 9-digit IRS Federal Tax ID (EIN) and State of Incorporation, and complete a 60-second Stripe Identity biometric check for the Account Admin.',
      },
      {
        step: 'Step 3',
        title: 'Publish Protected Roles (30-Day Freshness Window)',
        description:
          'Upload a job description PDF for AI auto-extraction or select your US State & Metro area, Work Model, Employment Type (W-2, 1099/C2C, Contract-to-Hire, Part-Time), and Annual (/yr) or Hourly (/hr) pay band. Roles automatically expire after 30 days and can be renewed in 1 click.',
      },
      {
        step: 'Step 4',
        title: 'The Introduction Unlock & 100% Accepted-Only Invitation Credit Protection',
        description:
          'Unlocking inbound applicants (40%+ AI Fit) is 100% free (0 credits). Sending a Professional Invitation to passive candidates uses 1 Invitation Credit backed by our 100% Accepted-Only Guarantee—declined invitations are automatically refunded. The Introduction opens a live encrypted chat thread and reveals the candidate’s First Name + Last Initial.',
      },
      {
        step: 'Step 5',
        title: 'The Conversation Unlock: Candidate Releases Full Resume & Contact Vault',
        description:
          'Message the candidate in The Introduction chat to discuss the role. Once the candidate clicks "Release Resume & Contact Vault", their Full Name, direct email, and 1-hour cryptographically signed PDF resume unlock (and auto-sync to Workday or Greenhouse on Enterprise).',
      },
    ],
    copyPasteText: `====================================================================
SPECIAL SAUCE — HIRING TEAM QUICK-START GUIDE
====================================================================

1. WHAT IS SPECIAL SAUCE?
Special Sauce is a 100% ID-verified, double-blind recruitment marketplace protected by a Intro/Convo Identity Vault. Every candidate is Stripe Biometric Identity-Verified and evaluated by a 5-Point AI Fit Radar before any contact information is exchanged.

2. HOW OUR TEAM USES THE PLATFORM (5 STEPS):
- Step 1 — Organization Setup & 12-Month Rate Lock: Activate Starter ($149/mo), Growth ($499/mo), or Enterprise ($1,250/mo) to lock in Founding Partner Rates for a full 12 months.
- Step 2 — 3-Pillar Anti-Harvesting Trust Gate: Complete corporate domain verification (including automated 90-day RDAP domain age verification), IRS 9-digit Federal EIN attestation, and a 1-time 60-second Stripe Identity check for the Account Admin.
- Step 3 — Publishing Protected Roles (30-Day Auto-Expiry): Every role displays transparent pay ($/yr or $/hr), US State & Metro location, and employment type while keeping our company name protected until The Introduction. Roles auto-expire after 30 days to guarantee freshness.
- Step 4 — The Introduction Unlock & Accepted-Only Invitation Credit Protection: Inbound applications (40%+ AI Fit) are 100% FREE to unlock (0 credits); Professional Invitations to passive talent use 1 Invitation Credit and are 100% auto-refunded if declined. The Introduction opens live encrypted chat (Ref: SS-XXXXXXXX) and reveals the candidate's First Name + Last Initial.
- Step 5 — The Conversation Unlock (Full Resume & Email Release): Once we chat with the candidate, they click "Release Resume & Contact Vault" to unlock their Full Name, direct email, and 1-hour signed PDF resume link.

3. EMPLOYER PLANS (12-MONTH FOUNDING PARTNER RATE LOCK) & TOP-UPS:
- Starter ($149/mo Founding · $299/mo Retail starting Mo 13): Up to 5 Active Roles | 10 Invitation Credits/mo | 2 Team/Recruiter Seats
- Growth ($499/mo Founding · $799/mo Retail starting Mo 13): Up to 15 Active Roles | 35 Invitation Credits/mo | Up to 5 Team/Recruiter Seats
- Enterprise ($1,250/mo Founding · $1,999/mo Retail starting Mo 13): Unlimited Active Roles | 120 Invitation Credits/mo | Unlimited Seats + Workday/Greenhouse HR Software Sync
- Non-Expiring Rollover Top-Up Packs (Bucket 2): Boost (+10 Credits for $150), Surge (+25 Credits for $350), Scale (+75 Credits for $900)
====================================================================`,
  },
  candidate: {
    id: 'candidate',
    title: 'Candidate Process & Intro/Convo Vault Guide',
    subtitle:
      'How Special Sauce protects your anonymity, eliminates resume harvesting, and gives you 100% control over when your resume and email are released.',
    badge: 'Candidate Guide',
    steps: [
      {
        step: 'Step 1',
        title: 'Create Account & Activate Your Candidate Plan ($3 / $9 / $15)',
        description:
          'Register and activate Explorer ($3/mo for passive inbound discovery), Professional ($9/mo for 15 monthly protected applications), or Prestige ($15/mo for unlimited protected applications & Top-Priority Spotlight). Joining during launch awards the permanent ★ Founding Member Charter badge.',
      },
      {
        step: 'Step 2',
        title: 'Complete 1-Time Stripe Biometric Identity Verification',
        description:
          'Complete a 60-second government photo ID and live selfie check powered by Stripe Identity. Zero raw ID photos or biometrics ever touch Special Sauce servers—only a verified token is stored to prove you are a real human.',
      },
      {
        step: 'Step 3',
        title: 'Upload PDF Resume to Your Conversation Vault & Set Dealbreakers',
        description:
          'Upload your PDF resume once. Our AI parser extracts your skills, tenure, certifications, and languages into an anonymized profile (Candidate #ID) while locking your name, email, phone, and raw PDF inside your Conversation Vault. Set your minimum pay and dealbreakers upfront.',
      },
      {
        step: 'Step 4',
        title: 'Check 5-Point AI Fit & Field Professional Invitations',
        description:
          'Browse active roles (all verified fresh within 30 days with upfront pay bands), check your instant 5-Point AI Fit score (40%+ minimum to apply), and receive direct Professional Invitations from verified hiring managers who pass your Dealbreaker Firewall.',
      },
      {
        step: 'Step 5',
        title: 'Intro/Convo Handshake: Chat Safely First, Release Resume Later',
        description:
          'When you accept a Professional Invitation or an employer unlocks your application, The Introduction opens an encrypted chat revealing their verified company name while showing only your First Name + Last Initial. Click "Release Resume & Contact Vault" (The Conversation) only when you are ready!',
      },
    ],
    copyPasteText: `====================================================================
SPECIAL SAUCE — CANDIDATE HOW-IT-WORKS & 2-STAGE VAULT REFERENCE GUIDE
====================================================================

1. ZERO RESUME HARVESTING (2-STAGE IDENTITY VAULT):
- While browsing, employers only see "Anonymous Candidate #ID" with your extracted skills, experience level, US Metro location, and third-person bio.
- The Introduction (Encrypted Thread): When an employer unlocks your application or you accept a Professional Invitation, an encrypted in-platform chat opens. You see the employer's verified company name and domain, and they see only your First Name + Last Initial. Your raw email and PDF resume stay LOCKED in the vault.
- The Conversation (You Control the Vault Key): After chatting with the employer in the thread to confirm genuine interview interest, click "Release Resume & Contact Vault" in 1 click to share your Full Name, direct email, and 1-hour signed PDF resume link.

2. 100% VERIFIED EMPLOYERS & YOUR DEALBREAKER FIREWALL:
- Every employer on Special Sauce must pass a 3-Pillar Anti-Harvesting Gate: Corporate Domain + 90-Day RDAP Age Check, IRS Federal EIN Attestation, and a 1-time Stripe Identity biometric check for their Account Admin.
- Set your Minimum Salary ($/yr), Work Model (Remote, Hybrid, On-site), Accepted Employment Types (W-2, 1099/C2C, Contract-to-Hire, Part-Time), and US State/Metro on your Preferences page.
- All job listings automatically close after 30 days unless manually renewed by the employer—eliminating stale "ghost jobs."

3. CANDIDATE MEMBERSHIP TIERS ($3 / $9 / $15):
- Explorer ($3/mo): Includes 1-time Stripe Real-Person ID Verification, live anonymous profile in Employer Search, unlimited Inbound Professional Invitation unlocks, and unlimited 5-Point AI Fit Radar checks.
- Professional ($9/mo): Includes 1-time Stripe Real-Person ID Verification, unlimited Inbound Professional Invitation unlocks, 15 Outbound Protected Applications/month (40%+ AI Fit), and Permanent Founding Member status.
- Prestige ($15/mo): Includes 1-time Stripe Real-Person ID Verification, Unlimited Outbound Protected Applications (40%+ AI Fit), unlimited invitation unlocks, and Top-Priority Spotlight placement in Employer Talent Search.
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
    category: 'Verification & Intro/Convo Vault Privacy',
    question:
      'Why do I need to verify my identity, and is my government ID stored by Special Sauce?',
    answer:
      'Identity verification protects the integrity of the Special Sauce marketplace, eliminating AI spam bots and fake profiles. Every candidate plan—Explorer ($3/mo), Professional ($9/mo), and Prestige ($15/mo)—includes 1-time Stripe Real-Person ID Verification (a 60-second photo ID and live selfie check) so 100% of candidates in Employer Search are real professionals. Your government ID and biometric selfie are NEVER stored on Special Sauce servers—they are vaulted exclusively by Stripe Identity using AES-256 encryption.',
  },
  {
    id: 'c2',
    target: 'candidate',
    category: 'Verification & Intro/Convo Vault Privacy',
    question:
      'How does the Intro/Convo Identity Vault protect me from resume harvesters?',
    answer:
      'Unlike traditional job boards that expose your resume, phone number, and email to anyone with a recruiter login, Special Sauce enforces a strict Intro/Convo Unlock. During discovery, you appear only as "Candidate #ID". In The Introduction (when an employer unlocks your application or you accept their invitation), an encrypted chat thread opens: you see the employer’s verified company name, and they see only your First Name + Last Initial. Your raw email, phone, and PDF resume remain locked inside your Conversation Vault until you decide to click "Release Resume & Contact Vault" (which generates a 1-hour cryptographically signed resume link).',
  },
  {
    id: 'c8',
    target: 'candidate',
    category: 'Verification & Intro/Convo Vault Privacy',
    question:
      'How do I know the Employers on Special Sauce are legitimate companies and not data harvesters?',
    answer:
      'Every Employer organization must pass our 3-Pillar Anti-Harvesting Trust Gate before they can publish a role or search the candidate pool: 1) Corporate Domain & 90-Day RDAP Age Check (work-email or DNS TXT verification plus an automated registry check that blocks newly registered burner domains under 90 days old), 2) IRS Federal Tax ID (EIN) & State of Incorporation corporate officer attestation, and 3) A mandatory 1-time Stripe Identity biometric photo ID check for the Employer Account Admin.',
  },
  {
    id: 'c3',
    target: 'candidate',
    category: 'Verification & Intro/Convo Vault Privacy',
    question:
      'How do I know if an employer has sent me a Professional Invitation or messaged me in an encrypted thread?',
    answer:
      'Whenever a verified employer sends you a Professional Invitation or sends a Introduction chat message, three things happen automatically: 1) We send an instant email alert to your inbox with a direct link to the thread, 2) Your Candidate Dashboard displays a pulsing "New Msg" badge on your Applications or Professional Invitations card in real time, and 3) If you have the dashboard open in your browser, a gentle audio chime plays automatically (which you can mute anytime).',
  },
  {
    id: 'c4',
    target: 'candidate',
    category: 'Applications, Bookmarks & Freshness',
    question:
      'How does Special Sauce eliminate stale "ghost jobs" and low-fit resume black holes?',
    answer:
      'First, every job listing on Special Sauce is governed by a strict 30-Day Auto-Expiration policy—each card displays a live "Closes in Xd" countdown and automatically closes after 30 days unless manually renewed by the hiring team. Second, every listing shows transparent Annual (/yr) or Hourly (/hr) pay bands upfront and calculates your instant 5-Point AI Fit Radar score before you apply. A minimum 40%+ AI Fit score is required to submit a protected application, ensuring hiring managers review high-signal matches instead of drowning in spam.',
  },
  {
    id: 'c5',
    target: 'candidate',
    category: 'Applications, Bookmarks & Freshness',
    question:
      'Can I bookmark or save roles to compare before using my protected applications?',
    answer:
      'Yes! Click the "Save Role" button on any job card to bookmark it. You can filter by your bookmarked listings at any time using the "Saved Roles" view on your Candidate Dashboard or the Discover Protected Roles page.',
  },
  {
    id: 'c6',
    target: 'candidate',
    category: 'Dealbreakers & Compensation',
    question:
      'How do my Hard Dealbreaker Firewall (W-2 vs. 1099, Remote/Hybrid, and Minimum Pay) rules work?',
    answer:
      'On your Match Preferences page, you set your Minimum Annual Salary, preferred Work Models (Remote, Hybrid, On-site), target US State & Metro area, and accepted Employment Types (Full-Time W-2, Contract 1099/Corp-to-Corp, Contract-to-Hire, or Part-Time). Our Hard Dealbreaker Firewall automatically blocks employers from sending Professional Invitations you if their role violates your minimum pay band (hourly roles are annualized at 2,080 hrs/yr), work model, or employment type preferences.',
  },
  {
    id: 'c7',
    target: 'candidate',
    category: 'Plans, Biometric ID & Candidate Tiers ($3 / $9 / $15)',
    question:
      'What is the difference between Explorer ($3/mo), Professional ($9/mo), and Prestige ($15/mo)?',
    answer:
      'All three candidate tiers include 1-time Stripe Real-Person ID Verification, your private Conversation Resume Vault, and the permanent ★ Founding Member Charter badge during our launch window. Explorer ($3/mo) is built for passive discovery: your verified anonymous profile is live in Employer Search, you can run unlimited 5-Point AI Fit checks, and you can unlock and accept unlimited Inbound Professional Invitations. Professional ($9/mo) adds 15 proactive Outbound Protected Applications/month (for roles where you score 40%+ AI Fit) plus Verified Profile Distinctions. Prestige ($15/mo) unlocks Unlimited Outbound Protected Applications (40%+ AI Fit) and Top-Priority Spotlight placement at the top of Employer Talent Search. You can upgrade, switch, or downgrade plans anytime.',
  },

  // ------------------------------------------------------------------
  // EMPLOYER & BPO PARTNER FAQS
  // ------------------------------------------------------------------
  {
    id: 'e1',
    target: 'employer',
    category: '3-Pillar Trust Gate & Anti-Harvesting Security',
    question:
      'How does the 3-Pillar Employer Anti-Harvesting Trust Gate work during onboarding?',
    answer:
      'To protect candidates from burner-domain scrapers and fake job postings, every Employer organization completes three verification pillars on the Organization & Trust Gate page: 1) Corporate Domain & 90-Day RDAP Age Check (verify ownership via work-email match or DNS TXT token alongside live DNS MX validation and an automated IANA/RDAP registry lookup that blocks burner domains registered less than 90 days ago), 2) IRS Federal Tax ID (EIN) & State of Incorporation corporate officer attestation, and 3) Admin Stripe Identity Verification (a 1-time 60-second photo ID and live biometric selfie check for the Employer Account Admin). Completing verification during our launch window locks in your 12-Month Founding Partner Rate.',
  },
  {
    id: 'e1b',
    target: 'employer',
    category: '3-Pillar Trust Gate & Anti-Harvesting Security',
    question:
      'Why does the Employer Account Admin complete a 1-time Stripe Identity check and IRS EIN attestation?',
    answer:
      'Senior passive candidates refuse to upload resumes to traditional job boards because anonymous third-party harvesters set up $10 burner domains to scrape contact data. Requiring every Employer Account Admin to complete a 1-time Stripe Identity biometric check alongside IRS Federal EIN attestation proves that a real, accountable hiring leader stands behind the organization—which is why candidates trust Special Sauce enough to make their skills discoverable and accept your Professional Invitations.',
  },
  {
    id: 'e2',
    target: 'employer',
    category: '3-Pillar Trust Gate & Anti-Harvesting Security',
    question:
      'How does the Intro/Convo Unlock & 5-Unmessaged-Unlock cap work for Employers?',
    answer:
      'When you unlock an inbound applicant (100% free / 0 credits) or a passive candidate accepts your Professional Invitation (1 Invitation Credit), The Introduction opens an encrypted in-platform message thread and reveals the candidate’s First Name + Last Initial alongside your verified company identity. Send a quick message in the thread to discuss the role—once the candidate clicks "Release Resume & Contact Vault" (The Conversation), their Full Name, direct email, phone, and 1-hour cryptographically signed PDF resume unlock immediately. To prevent bulk scraping, an organization can hold at most 5 unlocked Introduction threads awaiting an initial introductory message at a time.',
  },
  {
    id: 'e3',
    target: 'employer',
    category: '3-Pillar Trust Gate & Anti-Harvesting Security',
    question:
      'Why do job postings expire after 30 days, and how do we renew them?',
    answer:
      'To guarantee candidates that every role on Special Sauce is actively hiring (zero 6-month-old ghost jobs), listings automatically expire 30 days after publication. You can see the exact days remaining on your Job Management page (/dashboard/employer/jobs) and click "Renew +30d" (or "Reopen & Renew (+30d)") in 1 click at any time to reset the 30-day clock.',
  },
  {
    id: 'e4',
    target: 'employer',
    category: 'Billing, 12-Month Rate Lock & Invitation Credits',
    question:
      'How do the 12-Month Founding Partner Rate Lock, Two-Bucket Rollover Credits, and 100% Accepted-Only Protection work?',
    answer:
      'Employers who enroll during our launch window lock in Founding Partner Rates for their first 12 full months before standard retail pricing applies in Month 13: Starter ($149/mo Founding · $299/mo Retail: up to 5 Active Roles, 10 Monthly Invitation Credits, 2 Seats), Growth ($499/mo Founding · $799/mo Retail: up to 15 Active Roles, 35 Monthly Invitation Credits, up to 5 Seats), and Enterprise ($1,250/mo Founding · $1,999/mo Retail: Unlimited Active Roles, 120 Monthly Invitation Credits, Unlimited Seats + Workday/Greenhouse HR Software Sync). Your Monthly Plan Credits (Bucket 1) are always spent first; if you need extra outbound reach, you can add non-expiring Rollover Top-Up Packs (Bucket 2: Boost +10 Credits for $150, Surge +25 Credits for $350, or Scale +75 Credits for $900). Every Professional Invitation is backed by our 100% Accepted-Only Guarantee—if a candidate declines your pitch, the credit is automatically refunded to the exact bucket it came from.',
  },
  {
    id: 'e5',
    target: 'employer',
    category: 'Billing, 12-Month Rate Lock & Invitation Credits',
    question:
      'Does unlocking an Inbound Protected Application cost a Invitation Credit?',
    answer:
      'No! Reviewing, unlocking Introduction chat threads, messaging, and shortlisting candidates who proactively submit an inbound protected application (40%+ AI Fit) to your roles is 100% FREE (0 credits) on all active Employer plans. Invitation Credits are only used (1 credit per invitation) when you proactively send a Professional Invitation to a passive candidate from the Candidate Search pool.',
  },
  {
    id: 'e6',
    target: 'employer',
    category: 'Team Seats, BPO Partners & ATS Sync',
    question:
      'How do we invite Hiring Managers or W-2 BPO / RPO Partners, and how does Workday / Greenhouse sync work?',
    answer:
      'Every Employer plan includes collaborator seats: Starter ($149/mo) includes 2 seats, Growth ($499/mo) includes up to 5 seats, and Enterprise ($1,250/mo) includes Unlimited Team & External Recruiter seats. Open your Organization page (/dashboard/employer/organization) to assign seats. On Enterprise, whenever a candidate clicks "Release Resume & Contact Vault" (The Conversation), Special Sauce can automatically push a cryptographically signed HMAC-SHA256 webhook payload (candidate.vault_released) to Workday/MuleSoft or sync the candidate’s PDF resume and 5-Point AI Fit scorecard directly into Greenhouse.',
  },
  {
    id: 'e7',
    target: 'employer',
    category: 'Team Seats, BPO Partners & ATS Sync',
    question:
      'How do we know when a candidate accepts our Professional Invitation, replies, or releases their Resume Vault?',
    answer:
      'Whenever a candidate accepts a Professional Invitation, replies in an Introduction thread, or triggers The Conversation Vault Release, your team receives an instant email notification with the SS-XXXXXXXX Reference ID, a pulsing "New Msg" badge appears on your Employer Dashboard in real time, and an audio chime plays if your browser tab is open.',
  },
]
