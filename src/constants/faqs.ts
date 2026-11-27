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
        'All payments for Professional plans ($5 one-time Explorer, $12/mo Professional, $19/mo Prestige) and Employer plans ($25 Employer Verification Pass, $299 / $599 / $999 Base Memberships with 2 / 5 / 15 Active Protected Roles included, $199 Extra Protected Role Slots, and $150 / $350 / $900 credit packs) are processed securely by Stripe Checkout.',
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
        "All Employer Base Membership payments ($299 Starter / $599 Growth / $999 Enterprise with 2 / 5 / 15 Active Protected Roles included), Extra Protected Role Slots ($199 flat add-on), Rollover Invitation Credit Top-Up Packs ($150 / $350 / $900), Employer Organization Verification ($25 one-time), and Professional Explorer ($5 one-time \u00b7 $0/mo forever), Professional ($12/mo), or Prestige ($19/mo) plans are tokenized directly inside Stripe Checkout.",
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
- Subscription & Billing Data (Stripe Checkout): All payment methods for Starter, Growth & Enterprise Base Memberships ($299/$599/$999 with 2/5/15 Active Protected Roles), Extra Protected Role Slots ($199), Rollover Top-Up Packs ($150/$350/$900), Employer Verification ($25 one-time), and Explorer ($5 one-time \u00b7 $0/mo forever), Professional ($12/mo) & Prestige ($19/mo) plans are tokenized and vaulted exclusively by Stripe.

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
      'How Special Sauce works for Employers, Hiring Managers, and Internal Hiring Teams.',
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
        title: 'Publish Direct Hire or W-2 Contract-to-Hire Roles',
        description:
          'Publish up to 2, 5, or 15 concurrent Active Protected Roles included in your Base Membership (+$199 Extra Protected Role Slots anytime) across Direct Hire, W-2 Contract, or Contract-to-Hire ($0 conversion fee) with upfront pay bands and verified brand trust.',
      },
      {
        step: 'Step 4',
        title: 'Free Inbound Unlocks, Verified Hiring Bridge & Refund-Protected Invites',
        description:
          'Unlocking inbound applicants is 100% free, one-time Verified Hiring Bridge links screen external leads on LinkedIn or email with ID and 40%+ TrueFit™ checks, and declined invitations auto-refund.',
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
- Step 4 (Connect): Inbound applicants are 100% free to unlock. Talent Search invitations use 1 credit and are auto-refunded if declined.
- Step 5 (Hire): Chat directly in The Introduction, then receive the full PDF resume and contact details when released by the professional.

2. EMPLOYER BASE MEMBERSHIPS + EXTRA PROTECTED ROLE SLOTS:
- Starter ($299/mo): 2 Active Protected Roles (up to 25 sponsored Bridge checks/role) | 10 Invitation Credits/mo | 2 Team Seats
- Growth ($599/mo): 5 Active Protected Roles (up to 50 sponsored Bridge checks/role) | 35 Invitation Credits/mo | -1% W-2 Markup | Up to 5 Team Seats
- Enterprise ($999/mo): 15 Active Protected Roles (up to 100 sponsored Bridge checks/role) | 120 Invitation Credits/mo | -2% W-2 Markup | Unlimited Seats + Workday/Greenhouse Sync
- Extra Protected Role Slot ($199 flat add-on): Adds +1 concurrent Active Protected Role (up to 25 pre-gated Bridge checks) whenever all plan slots are active. Verified Ecosystem Professionals always apply unlimited at $0.
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
          'Check your TrueFit Score™ on roles with upfront pay and accept unlimited employer invitations free at $0/mo—or upgrade to Professional ($12/mo) or Prestige ($19/mo) anytime to submit applications.',
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
- Professional ($12/mo): Everything in Explorer + 15 applications/mo and Permanent Founding Member badge ($7 Month 1 when upgrading with your one-time $5 Explorer credit).
- Prestige ($19/mo): Everything in Professional + unlimited applications, top-priority search placement, and priority support ($14 Month 1 when upgrading with your one-time $5 Explorer credit).
(Includes Real-Person ID Verification at no extra fee. Downgrade to Professional ($12/mo) or Explorer ($0/mo) anytime.)
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
      'Explorer ($5 one-time ID verification · $0/mo forever) lets you get discovered by employers, run free TrueFit Score™ checks, accept unlimited employer invitations, and enter our Weekly 1-Year Prestige Drawing at $0/mo. If you ever upgrade from Explorer, your $5 verification is credited toward Month 1 ($7 today for Professional or $14 today for Prestige). Professional ($12/mo) adds 15 applications per month and Founding Member status, while Prestige ($19/mo) unlocks unlimited applications, top-priority search placement, and priority US support. Starting directly on Professional or Prestige includes ID verification at no extra fee, and you can downgrade to Explorer ($0/mo) anytime.',
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
    category: 'Plans, Role Slots & Credits',
    question:
      'How do Employer Base Memberships, included Active Protected Roles, $199 Extra Role Slots, and credit refunds work?',
    answer:
      'Base Ecosystem Memberships include reusable concurrent Active Protected Roles—closing or pausing a filled role frees its plan slot right away: Starter ($299/mo: 2 Active Roles with up to 25 sponsored Bridge verifications/role, 2 seats, 10 credits/mo), Growth ($599/mo: 5 Active Roles with up to 50/role, 5 seats, 35 credits/mo, -1% W-2 markup), and Enterprise ($999/mo: 15 Active Roles with up to 100/role, unlimited seats, 120 credits/mo, -2% W-2 markup, HR sync). Whenever all included slots are active at once, add a flat $199 Extra Protected Role Slot (+1 concurrent role with up to 25 pre-gated Bridge verifications) without changing your monthly tier—while already-verified Ecosystem Professionals always apply unlimited at $0. Optional Top-Up Credit Packs (+10/$150, +25/$350, +75/$900) never expire while active, and declined invitations auto-refund.',
  },
  {
    id: 'e5',
    target: 'employer',
    category: 'Plans, Role Slots & Credits',
    question:
      'Does unlocking an inbound applicant cost an Invitation Credit?',
    answer:
      'No. Reviewing, unlocking, and messaging professionals who apply to your roles is 100% free (0 credits) on every active Employer plan. Credits are only used when you send an invitation from Talent Search.',
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
      'How is my TrueFit Score™ calculated, and why do applications require 40%+?',
    answer:
      'Your TrueFit Score™ compares your verified skills, experience, and preferences against the role requirements. You can run TrueFit Score™ checks for free in Explorer ($0/mo). Active Professional ($12/mo) and Prestige ($19/mo) members can submit applications on any role where their TrueFit Score™ is 40% or higher, ensuring hiring teams review strong, relevant matches.',
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
      'How do I switch plans, downgrade to Explorer ($0/mo), or manage my Membership & Plan Settings?',
    answer:
      'You can switch plans or downgrade back to Explorer ($0/mo forever) anytime from your Membership & Plan Settings page. Downgrading to Explorer stops monthly charges while keeping your Verified Professional profile and unlimited inbound Employer invitations active.',
  },
  {
    id: 'c12',
    target: '\u0063andidate',
    category: 'Applications & Roles',
    question:
      'How do Direct Hire, W-2 Contract, and Contract-to-Hire roles work for Professionals?',
    answer:
      'Every Protected Role supports full-time Direct Hire onto the hiring company\u0027s payroll alongside optional W-2 Contract (3–12 months or open-ended) and Contract-to-Hire tracks with upfront pay bands. On W-2 tracks, you receive compliant I-9 and W-4 onboarding, scheduled W-2 direct-deposit paychecks, and employer payroll tax contributions from day one—and employers pay a $0 conversion fee across 90-day, 180-day, or custom timelines to bring you onto full-time staff.',
  },
  {
    id: 'e9',
    target: 'employer',
    category: 'Connecting with Professionals',
    question:
      'How does Verified Hiring Bridge work for external sourcing and inbound leads?',
    answer:
      'Verified Hiring Bridge lets active Employer members generate Protected Role links to share on LinkedIn, GitHub, careers pages, or email—displaying your verified company brand while gating bots and spam. External applicants first confirm pay, location, and minimum experience alignment, then complete a $0 Employer-Sponsored Stripe ID check (up to your role\u0027s 25, 50, or 100 sponsored allowance) and clear your 40%+ TrueFit Score™ floor before reaching your inbox, while already-verified Ecosystem Professionals apply unlimited at $0 without using your sponsored allowance.',
  },
  {
    id: 'e10',
    target: 'employer',
    category: 'Job Listings',
    question:
      'How do Full-Time Direct Hire and our 3 built-in W-2 Employer of Record paths work for Employers?',
    answer:
      'Every Protected Role supports 4 hiring methodologies: (1) Full-Time Direct Hire onto your internal company payroll ($0 placement commission), (2) W-2 Contract-to-Hire ($0 conversion fee across 1–12 month ramps), (3) Limited W-2 Contract (fixed-term project or seasonal coverage, extendable anytime), and (4) Indefinite W-2 Contract (open-ended ongoing assignment). All three W-2 tracks include built-in U.S. Employer of Record digital onboarding, statutory payroll taxes, Workers\u0027 Comp, 100% funded Net-30 consolidated billing, and tracked hardware return gates.',
  },
  {
    id: 'all2',
    target: 'all',
    category: 'Account Access & Self-Service',
    question: 'How do I change or reset my password?',
    answer:
      'Visit the Sign In page (/login), click "Forgot password?" above the password field, and enter your account email address. We will send a single-use password recovery link straight to your inbox. Click that link to open the "New password" screen (minimum 6 characters). If your recovery link expires or was already opened, simply request a fresh link on /login.',
  },
  {
    id: 'all3',
    target: 'all',
    category: 'Account Access & Self-Service',
    question:
      'What should I do if I cannot log in or did not receive my 6-digit sign-in code?',
    answer:
      'Every sign-in uses "Sign In Securely (2-Step OTP) →"—first verifying your email and password, then sending a one-time 6-digit verification code to your email. If the code has not arrived after 60 seconds, check your Spam, Junk, or Quarantine folder for Special Sauce emails and verify there are no typos in your email address. Note that unchecking "Keep me signed in" applies a 12-hour security timeout, whereas checking "Keep me signed in" keeps your browser session active for 30 days.',
  },
  {
    id: 'all4',
    target: 'all',
    category: 'Account Access & Self-Service',
    question: 'What if I forgot which email address I used for my account?',
    answer:
      'On the Sign In page (/login), use the "Forgot which email you used? →" lookup option. Select Professional or Employer and search by your name or organization to view a masked Account Hint (for example, j***@company.com) without exposing full email addresses publicly, then click "Sign In with This →" to return to the login form.',
  },
  {
    id: 'all5',
    target: 'all',
    category: 'Account Access & Self-Service',
    question:
      'How do I update my payment card, billing address, or download past invoices and receipts?',
    answer:
      'Open the account menu in the top-right corner of your Dashboard and select "Membership & Plan Settings." Professionals can click "Manage Subscription & Invoices ↗" and Employers can click "Invoices & Payment Portal ↗" to launch the encrypted Stripe Billing Portal—where you can swap payment cards, update billing details, and download itemized PDF receipts anytime.',
  },
  {
    id: 'all6',
    target: 'all',
    category: 'Account Access & Self-Service',
    question:
      'How do I update my login email address or pause my account without losing verification?',
    answer:
      'Because your login email is tied to your Verified Professional Shield or verified corporate domain, email changes are handled carefully so your verification history stays intact. Professionals who want to step back from outreach never need to delete their account—simply downgrade to Explorer ($0/mo forever) in Membership & Plan Settings and pause inbound invitations in Match Preferences. Active monthly members needing an email update or permanent closure can open a 1-on-1 ticket under Support.',
  },
  {
    id: 'all7',
    target: 'all',
    category: 'Account Access & Self-Service',
    question:
      'What support is included on Explorer ($0/mo) and Employer Verification Pass ($0/mo) vs. active monthly plans?',
    answer:
      'Members on $0/mo tiers (Explorer and Employer Verification Pass Practice Mode) have 24/7 access to our searchable FAQs, security architecture docs, and 1-way product feedback stream inside Support. Active monthly members (Professional, Prestige, Starter, Growth, and Enterprise) unlock 2-way 1-on-1 U.S. human support tickets directly inside the Support center with live reply notifications.',
  },
  {
    id: 'all8',
    target: 'all',
    category: 'W-2 Payroll & Contract-to-Hire',
    question:
      'How are responsibilities divided on a W-2 Contract or Contract-to-Hire role?',
    answer:
      'Responsibilities are cleanly separated: (1) Special Sauce operates the secured workforce ecosystem—handling identity and company verification, TrueFit Score™ matching, the 2-Stage Privacy Vault, and in-thread lifecycle safeguards; (2) licensed U.S. W-2 employer-of-record infrastructure administers legal W-2 employment—managing digital Form I-9 and W-4 onboarding, direct-deposit W-2 paychecks, federal/state/local payroll tax withholding, workers\u0027 compensation, unemployment insurance, statutory benefit administration, and year-end W-2 tax forms (disclosed directly on statutory onboarding documents); and (3) the Hiring Company directs day-to-day work, project milestones, and timesheet approvals.',
  },
  {
    id: 'c13',
    target: '\u0063andidate',
    category: 'W-2 Payroll & Contract-to-Hire',
    question:
      'What happens step-by-step after I accept a W-2 Contract or Contract-to-Hire offer?',
    answer:
      'Once you release your Resume Vault in the private thread and accept the employer\u0027s W-2 proposal, you receive a secure digital W-2 onboarding packet. You complete your federal Form W-4, Form I-9 employment eligibility verification, direct deposit setup, and any role-specific background or drug screening disclosed upfront on the listing. As soon as onboarding clears, both you and the hiring team receive confirmation to begin work on your scheduled start date.',
  },
  {
    id: 'c14',
    target: '\u0063andidate',
    category: 'W-2 Payroll & Contract-to-Hire',
    question:
      'How do timesheets, W-2 paychecks, taxes, and benefits work for Professionals on W-2 roles?',
    answer:
      'You log your hours in the W-2 payroll portal, the hiring manager approves your timesheet, and you are paid via scheduled W-2 direct deposit at the exact hourly rate agreed to in your offer. Unlike 1099 contracting, employer-side Social Security and Medicare (FICA) taxes, unemployment insurance, and workers\u0027 compensation are paid on your behalf, taxes are withheld automatically on every paycheck, eligible full-time W-2 contractors gain access to statutory benefit options, and you receive a single W-2 at year-end.',
  },
  {
    id: 'c15',
    target: '\u0063andidate',
    category: 'W-2 Payroll & Contract-to-Hire',
    question:
      'How does converting from Contract-to-Hire to full-time internal staff work for Professionals?',
    answer:
      'Traditional staffing agencies charge employers $20,000+ buyout fees that discourage companies from hiring contractors full-time. On Special Sauce, employers pay a $0 conversion fee across 90-day, 180-day, custom, or early timelines—so there are zero agency buyout blocks or restrictive non-compete lock-ins standing in your way. When you accept the company\u0027s direct full-time offer, the employer marks the engagement converted, W-2 contract billing closes cleanly on your transition date, and you move onto the company\u0027s internal payroll and benefits.',
  },
  {
    id: 'e11',
    target: 'employer',
    category: 'W-2 Payroll & Contract-to-Hire',
    question:
      'How does Commission-Free W-2 Employer of Record billing work, and why does our rate beat traditional agencies?',
    answer:
      'Traditional staffing agencies charge 50%+ markups because roughly half of every bill funds headhunter commissions. Special Sauce saves you money by eliminating the need for recruiter middlemen. Our Secured Workforce Ecosystem puts you in complete control of qualifying your future workforce in a fraction of the time it takes you today—something impossible with unverified resume piles and agency gatekeepers. On W-2 Contract-to-Hire, Limited W-2, and Indefinite W-2 roles, you pay one consolidated Net-30 invoice covering the Professional\u0027s approved hourly pay, full statutory W-2 coverage (employer FICA, FUTA/SUTA, Workers\u0027 Comp, digital I-9/W-4 onboarding, and multi-state W-2 filings), 100% payroll funding, and a transparent, commission-free rate—with automatic 1% and 2% W-2 markup reductions on Growth and Enterprise.',
  },
  {
    id: 'e12',
    target: 'employer',
    category: 'W-2 Payroll & Contract-to-Hire',
    question:
      'Can we convert a W-2 contractor to full-time early, extend a contract, or customize the conversion window?',
    answer:
      'Yes. Whether you choose a 90-day, 180-day, or custom Contract-to-Hire window, a Fixed-Term W-2 Contract (3–12 months), or an Open-Ended W-2 Contract, your conversion fee is always $0. You can convert a consenting Professional onto your internal full-time payroll early with zero buyout penalties, extend fixed-term engagements as project needs evolve, or wrap up an engagement cleanly inside the thread.',
  },
  {
    id: 'e13',
    target: 'employer',
    category: 'W-2 Payroll & Contract-to-Hire',
    question:
      'How do background checks, drug screening, and laptop/equipment policies work on W-2 roles?',
    answer:
      'When creating or proposing a W-2 role, you can toggle background check and drug screening requirements so compliant screening is coordinated during W-2 onboarding—and Professionals see those requirements upfront before applying. You also select one of four equipment policies: No Equipment Needed, Company-Shipped Hardware (Laptop / Security Key), Cloud VDI / BYOD (Virtual Desktop & Passkey Only), or Managed Laptop Add-On.',
  },
  {
    id: 'e14',
    target: 'employer',
    category: 'W-2 Payroll & Contract-to-Hire',
    question:
      'How do W-2 Lifecycle Safeguards and company hardware return controls work?',
    answer:
      'Every W-2 status change inside your private thread uses checkbox-gated safeguard modals to prevent accidental clicks. When you wrap up an engagement that includes company-shipped hardware, the thread stays visible in an Ended state and unlocks dedicated post-wrap-up controls—"Request Gear Return" to prompt tracked return of laptops or security keys, "Confirm Gear Returned" once IT verifies receipt, and "Reopen W-2" if both sides resume work.',
  },
  {
    id: 'c16',
    target: '\u0063andidate',
    category: 'Verification & Privacy',
    question:
      'How do I update my PDF resume or pause inbound employer invitations?',
    answer:
      'To replace your resume, open "My Profile" and upload your latest PDF into the "Private Resume Vault"—you can auto-fill updated skills or keep your edited anonymous profile summary intact, and previously locked threads still cannot see your PDF unless you click "Release Resume & Contact Vault." To take a break from new outreach without losing your Verified Shield, open "Match Preferences," set your availability to Paused, and click "Save Preferences."',
  },
  {
    id: 'e15',
    target: 'employer',
    category: 'Connecting with Professionals',
    question:
      'Do Verified Hiring Bridge links cost Invitation Credits upfront, and what happens if someone scores below 40% TrueFit™?',
    answer:
      'Generating and sharing Verified Hiring Bridge links for external sourcing, careers pages, or inbound message gating uses zero Invitation Credits upfront. Visitors see your verified company brand and confirm pay, location, and minimum experience before using a $0 Employer-Sponsored ID check (up to 25, 50, or 100 per role, while already-verified Ecosystem Professionals apply unlimited at $0). If someone scores below 40% TrueFit™, alignment protection blocks submission before reaching your inbox, and you can retire any link anytime.',
  },
  {
    id: 'e16',
    target: 'employer',
    category: 'Job Listings',
    question:
      'When can we permanently delete a role listing, and why are some roles locked from deletion?',
    answer:
      'From "Manage Roles," you can permanently delete draft or closed listings via the checkbox-gated "Delete Role" modal, which automatically retires any open Verified Hiring Bridge links tied to that role. To protect compliance and active Professionals, deletion is automatically locked whenever a role has an active W-2 engagement, unreturned company hardware, or inbound applicants still waiting for a response.',
  },
]
