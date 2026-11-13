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
      title: 'Payment Cards & Plan Billing (Handled by Stripe)',
      detail:
        'All payments for Professional plans ($5 one-time Explorer, $12/mo Professional, $19/mo Prestige) and Employer plans ($25 Employer Verification Pass, $149 / $499 / $1,250 monthly plans, and $150 / $350 / $900 credit packs) are processed securely by Stripe Checkout.',
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

export const TECHNICAL_SECURITY_ARCHITECTURE_DATA = {
  title: "Data Security, Intro/Convo Identity Vault & Stripe Architecture (Technical Specs)",
  subtitle:
    "Special Sauce is engineered on a Zero-ID-Storage and Anti-Harvesting architecture. Biometric identity documents and payment credentials for both Professionals and Employer Admins are vaulted exclusively by Stripe (PCI-DSS Level 1 / SOC 2 Type II), while professional resumes and direct contact details remain locked behind our PostgreSQL RLS Intro/Convo Identity Vault until explicitly released.",
  stripeVaultItems: [
    {
      title: "Government IDs & Passports (Stripe Identity TLS 1.3 + AES-256)",
      detail:
        "Photos of driver\u2019s licenses, passports, and national ID cards uploaded during Professional onboarding and Employer Account Admin verification are transmitted directly to Stripe Identity over TLS 1.3 and encrypted using AES-256 inside Stripe\u2019s isolated biometric vault.",
    },
    {
      title: "Biometric Selfie Checks & Zero-Knowledge Webhook Tokens",
      detail:
        "Live facial recognition vectors and selfie verification captures are processed exclusively by Stripe Identity. Special Sauce never ingests raw biometric images and only receives an HMAC-SHA256 signed webhook persisting a boolean verification status (\u201cverified\u201d or \u201crequires_input\u201d) and session reference token.",
    },
    {
      title: "Payment Cards, ACH & Billing Details (PCI-DSS Level 1)",
      detail:
        "All Employer subscription payments ($149 / $499 / $1,250 Founding Partner Rates locked for 12 months; $299 / $799 / $1,999 Retail), Rollover Invitation Credit Top-Up Packs ($150 / $350 / $900), Employer Organization Verification ($25 one-time), and Professional Explorer ($5 one-time \u00b7 $0/mo forever), Professional ($12/mo), or Prestige ($19/mo) plans are tokenized directly inside Stripe Checkout.",
    },
  ],
  platformStoredItems: [
    {
      title: "Staged Intro/Convo Vault & 1-Hour Signed Resume URLs (RLS + AES-256)",
      detail:
        "Uploaded PDF resumes reside in a non-public, AES-256 encrypted Supabase Storage bucket governed by strict PostgreSQL Row-Level Security (RLS). In The Introduction, private chat opens showing only First Name + Last Initial. In The Conversation, clicking \u201cRelease Resume & Contact Vault\u201d generates a 1-hour (3,600s TTL) cryptographically signed PDF URL.",
    },
    {
      title: "3-Pillar Employer Anti-Harvesting Trust Gate (RDAP + DNS + EIN)",
      detail:
        "Every employer organization must pass three mandatory trust checks before publishing roles or searching talent: Pillar 1 (Corporate Domain DNS MX/TXT validation + automated 90-Day RDAP registry age check blocking burner domains), Pillar 2 (9-digit IRS Federal EIN & State of Incorporation officer attestation), and Pillar 3 (1-time Stripe Identity biometric check for the Account Admin).",
    },
    {
      title: "In-Platform Encrypted Messaging & Automated Phishing Firewall",
      detail:
        "All initial professional-employer conversations occur inside real-time threads tied to a shared Reference ID (SS-XXXXXXXX). Application-layer session secrets use AES-256-GCM authenticated encryption and HMAC-SHA256 signing, and every message passes through an automated heuristic scanner blocking off-platform lures or SSN/financial harvesting.",
    },
    {
      title: "30-Day Job Auto-Expiration & 5-Unlock Anti-Scraping Ceiling",
      detail:
        "To eliminate ghost roles and bulk resume scraping, all job listings enforce a hard 30-day TTL unless manually renewed by the employer. Employer accounts are also rate-limited at a maximum of 5 unmessaged unlocked threads at a time.",
    },
  ],
  copyPasteSecurityBrief: `====================================================================
SPECIAL SAUCE \u2014 TECHNICAL SECURITY, CRYPTOGRAPHY & STRIPE COMPLIANCE BRIEF
====================================================================

1. ENCRYPTION STANDARDS (IN TRANSIT, AT REST & APPLICATION LAYER):
- Transport Layer: TLS 1.3 / HTTPS Strict Transport Security (HSTS) across all edge and API routes.
- Storage at Rest: AES-256 encryption across all PostgreSQL database volumes, backups, and private PDF resume buckets.
- Application & Token Layer: AES-256-GCM authenticated encryption and HMAC-SHA256 signature verification.
- Zero External AI Training: Private resumes, compensation floors, and chat transcripts are strictly isolated and never sold or used to train public AI models.

2. ISOLATED INSIDE STRIPE (PCI-DSS LEVEL 1 & SOC 2 TYPE II):
- Biometric Identity Verification (Stripe Identity): Government IDs and live selfie checks for Professionals and Employer Account Admins are captured over TLS 1.3 and encrypted (AES-256) directly inside Stripe\u2019s isolated vault. Special Sauce stores only a boolean identity_verified flag.
- Subscription & Billing Data (Stripe Checkout): All payment methods for Starter, Growth & Enterprise ($149/$499/$1,250 Founding Partner Rates; $299/$799/$1,999 Retail), Rollover Top-Up Packs ($150/$350/$900), Employer Verification ($25 one-time), and Explorer ($5 one-time \u00b7 $0/mo forever), Professional ($12/mo) & Prestige ($19/mo) plans are tokenized and vaulted exclusively by Stripe.

3. 3-PILLAR EMPLOYER ANTI-HARVESTING GATE:
- Pillar 1 (Domain & 90-Day RDAP Age Check): Work-email or DNS TXT verification paired with live DNS MX validation and automated IANA/RDAP lookup blocking domains registered <90 days ago.
- Pillar 2 (US Tax Entity Attestation): 9-digit IRS Federal Tax ID (EIN) and State of Incorporation officer attestation.
- Pillar 3 (Admin Biometric ID): 1-time Stripe Identity photo ID & live selfie verification for the Employer Account Admin.

4. INTRO/CONVO IDENTITY VAULT, RLS & ANTI-SCRAPING GUARDRAILS:
- The Introduction (Encrypted Thread Unlock): Reveals the employer\u2019s verified company name/domain and the professional\u2019s First Name + Last Initial inside an encrypted thread (Ref: SS-XXXXXXXX) while keeping raw email, phone, and PDF resume locked behind PostgreSQL Row-Level Security (RLS).
- The Conversation (Professional-Controlled Release): Generates a 1-hour (3,600s TTL) cryptographically signed PDF resume link only when the professional clicks Release Resume & Contact Vault.
- Anti-Scraping Guardrails: 30-day automatic job listing TTL and a hard 5-unlock anti-scraping ceiling on unmessaged threads.
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
        title: 'Unlock Practice Mode ($25 Once · $0/Mo)',
        description:
          'Complete the $25 Employer Verification Pass to set up your company profile, draft roles, and preview verified talent matches in Practice Mode at $0/mo.',
      },
      {
        step: 'Step 2',
        title: 'Verify Your Business (3 Quick Steps)',
        description:
          'Confirm your business domain, enter your 9-digit Federal EIN and state of registration, and complete a 60-second Stripe ID check for your account admin. Full technical verification details are available anytime in the Security & Vault tab.',
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
- Step 1 ($25 Practice Mode Pass): Complete your one-time verification to draft roles and preview matches in Practice Mode at $0/mo.
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
          'Verify your identity once via Stripe to earn your Verified Professional Shield. Your ID photo is never stored on Special Sauce servers. (For full AES-256, TLS 1.3, and SOC 2 architectural details, switch to the Technical Specs view on specialsauce.io/security?view=technical.)',
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
(Downgrade to Professional ($12/mo) or Explorer ($0/mo) anytime.)
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
      'A one-time ID check keeps bots, fake profiles, and scammers off the platform so every connection is human-to-human. Your photo ID and selfie are processed directly by Stripe Identity and are never stored on Special Sauce servers. (For full technical security specifications, open the Intro/Convo Vault & Stripe Security tab and select Technical Specs & Cryptography.)',
  },
  {
    id: 'c2',
    target: 'candidate',
    category: 'Verification & Privacy',
    question:
      'How does the Private Resume Vault protect my contact info?',
    answer:
      'In employer search, you appear only as "Professional #ID." When you accept an invitation or an employer unlocks your application (The Introduction), private chat opens showing only your First Name + Last Initial while revealing the employer’s verified company name. Your email, phone number, and PDF resume stay hidden until you click "Release Resume & Contact Vault" (The Conversation). You can review our full PostgreSQL Row-Level Security (RLS) and 1-hour signed URL specifications at specialsauce.io/security?view=technical.',
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
      'Explorer ($5 one-time ID verification · $0/mo forever) lets you get discovered by employers, run free TrueFit Score™ checks, accept unlimited employer invitations, and enter our Weekly 1-Year Prestige Drawing at $0/mo. Professional ($12/mo) adds 15 outbound applications per month and Founding Member status. Prestige ($19/mo) unlocks unlimited outbound applications, top-priority placement in Employer Search, and priority US support. You can downgrade to Professional ($12/mo) or Explorer ($0/mo) anytime.',
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
  {
    id: 'c9',
    target: 'candidate',
    category: 'Verification & Privacy',
    question:
      'My Stripe photo ID check says processing—how long does it take to update?',
    answer:
      'Stripe Identity checks usually finish within 15 to 60 seconds. If your Dashboard still shows "ID Check Pending," click the "Refresh Status" button on your Dashboard banner or reload the page to sync your Verified Professional Shield.',
  },
  {
    id: 'c10',
    target: 'candidate',
    category: 'Applications & Roles',
    question:
      'How is my TrueFit Score™ calculated, and why do outbound applications require 40%+?',
    answer:
      'Your TrueFit Score™ compares your verified skills, experience, and preferences against the role requirements. You can run TrueFit Score™ checks for free in Explorer ($0/mo). Active Professional ($12/mo) and Prestige ($19/mo) members can submit outbound applications on any role where their TrueFit Score™ is 40% or higher, ensuring hiring teams review strong, relevant matches.',
  },
  {
    id: 'e8',
    target: 'employer',
    category: 'Organization Verification',
    question:
      'Our corporate domain or DNS TXT record is not verifying yet—what should we check?',
    answer:
      'If you are verifying via DNS TXT record (e.g., on Cloudflare, GoDaddy, AWS Route 53, or Namecheap), ensure the record is placed on your root domain (@) without extra quotes and allow 1 to 5 minutes for DNS propagation before clicking Verify Domain again.',
  },
  {
    id: 'all1',
    target: 'all',
    category: 'Membership Plans ($5 / $12 / $19)',
    question:
      'How do I downgrade to Explorer ($0/mo) when hired or manage my billing?',
    answer:
      'You can switch plans or downgrade back to Explorer ($0/mo forever) anytime from your Billing & Plans page. Downgrading to Explorer stops monthly billing while keeping your Verified Professional profile active in the passive talent pool for free inbound employer invitations.',
  },
]
