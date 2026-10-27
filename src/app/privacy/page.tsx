import Link from 'next/link'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { LEGAL_CONFIG } from '@/constants/legal'

export const metadata = {
  title: 'Privacy Policy | specialsauce.io',
  description:
    'How Special Sauce collects, uses, and protects your data through our 2-Stage Identity Vault and Stripe Stripe ID protection.',
}

export default function PrivacyPolicyPage() {
  const lastUpdated = LEGAL_CONFIG.lastUpdated

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-between">
      <PublicHeader />
      <main className="py-8 sm:py-14 px-4 sm:px-6 md:px-12">
      <div className="max-w-4xl mx-auto bg-white p-5 sm:p-8 md:p-12 rounded-3xl shadow-sm border-2 border-slate-300">
        {/* Header */}
        <div className="mb-12 border-b border-slate-300 pb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-slate prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-indigo-600 max-w-none space-y-8">
          <section>
            <h2 className="text-xl">1. Introduction</h2>
            <p className="text-slate-600 leading-relaxed mt-2">
              At specialsauce.io, operated by <strong>{LEGAL_CONFIG.legalEntityName}</strong> (&ldquo;Special Sauce,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), trust and anti-harvesting protection are the foundation of our identity-protected hiring marketplace. This Privacy Policy explains how we collect, use, vault, disclose, and safeguard your information when you visit our platform or use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl">2. Information We Collect &amp; Vault</h2>
            <p className="text-slate-600 leading-relaxed mt-2">
              We collect information that identifies, relates to, or could reasonably be linked with you (&ldquo;Personal Information&rdquo;), separated strictly between our operational database and our third-party payment and biometric vault provider (Stripe):
            </p>
            <ul className="list-disc pl-5 mt-4 space-y-2 text-slate-600">
              <li>
                <strong className="text-slate-800">Account &amp; Vaulted Contact Data:</strong> Full name, email address, and authentication credentials, which remain hidden from public or employer search views by default.
              </li>
              <li>
                <strong className="text-slate-800">Professional &amp; Preference Data:</strong> Uploaded PDF resumes, extracted skill matrices, years of experience, third-person bios, US State/Metro locations, saved bookmarks/shortlists, and candidate dealbreakers (minimum salary expectations, work models, and accepted W-2/1099 employment types).
              </li>
              <li>
                <strong className="text-slate-800">Biometric Identity &amp; Payment Data (Vaulted Exclusively by Stripe):</strong> When Candidates complete identity verification via Stripe Identity or when Users purchase subscriptions via Stripe Checkout, government ID images, verification selfies, and payment credentials are transmitted directly to Stripe over TLS 1.3 and encrypted (AES-256) inside Stripe’s PCI-DSS Level 1 infrastructure.{' '}
                <span className="font-semibold text-slate-800">
                  Special Sauce never stores your raw government ID documents, facial scans, credit card numbers, or bank account details on our servers.
                </span>{' '}
                We only receive and store a cryptographic verification status token. Biometric verification is performed strictly with your explicit consent for identity verification and anti-fraud/sybil protection in compliance with applicable state and federal privacy laws (including the Texas Capture or Use of Biometric Identifier Act). Stripe retains and purges biometric verification data in accordance with the Stripe Privacy Policy and statutory retention limits (no longer than 1 year after the purpose for collection expires, or immediately upon your deletion request to privacy@specialsauce.io).
              </li>
              <li>
                <strong className="text-slate-800">In-Platform Messaging &amp; Telemetry Data:</strong> Encrypted thread messages associated with connection Reference IDs (<code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">SS-XXXXXXXX</code>), read-receipt timestamps, IP addresses, and usage velocity required to enforce anti-harvesting guardrails and prevent automated scraping.
              </li>
            </ul>
          </section>

          <section className="bg-emerald-50/60 p-6 rounded-2xl border border-emerald-300">
            <h2 className="text-xl text-slate-900 mb-3">
              3. How Our 2-Stage Identity Vault Works (Anti-Harvesting Architecture)
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Unlike traditional job boards where uploading a resume exposes your contact details to mass scraping, Special Sauce enforces a strict <strong>2-Stage Identity Vault</strong>:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-2 text-slate-700">
              <li>
                <strong>Default Protected Discovery:</strong> While browsing or evaluating AI Match Radar scores, Employers only see <code className="text-xs font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300">Anonymous Candidate #ID</code>, extracted skills, experience years, target US Metro location, and a third-person bio. Candidates only see <code className="text-xs font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300">Protected Role • Verified Employer</code> alongside transparent pay bands, employment type, and core skill requirements.
              </li>
              <li>
                <strong>Stage 1 (Encrypted Thread Unlock):</strong> When an Employer unlocks an inbound protected application—or when a Candidate accepts an outbound Employer Pitch—an encrypted in-platform message thread opens under a shared Reference ID (<code className="text-xs font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300">SS-XXXXXXXX</code>). At Stage 1, the Employer’s verified company name and domain are revealed to the Candidate, and only the Candidate’s <strong>First Name and Last Initial</strong> (e.g., <em>Alex M.</em>) are revealed to the Employer. <strong>The Candidate’s raw email address and original PDF resume remain locked inside the Special Sauce Vault.</strong>
              </li>
              <li>
                <strong>Stage 2 (Candidate-Controlled Full Vault Release):</strong> The Candidate retains 100% control over when to click the <strong>&ldquo;Release Resume &amp; Contact Vault&rdquo;</strong> button inside the message thread. Only after the Candidate explicitly approves Stage 2 release does the platform reveal their Full Name, direct email address, and a time-limited (1-hour expiring) signed URL to view their original PDF resume.
              </li>
            </ul>
          </section>

          <section className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-300">
            <h2 className="text-xl text-slate-900 mb-3">
              4. In-Platform Messaging, Email Relay &amp; AI Safety Scanning
            </h2>
            <p className="text-slate-700 leading-relaxed">
              To protect Users from phishing, off-platform data harvesting, and algorithmic manipulation:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-2 text-slate-700">
              <li>
                <strong>Automated Safety &amp; Anti-Phishing Firewall:</strong> Messages sent within in-platform threads are scanned automatically by heuristic and AI safety rules to block requests for Social Security Numbers (SSNs), banking/routing details, advance fees, off-platform encrypted chat lures (e.g., WhatsApp/Telegram), or external survey forms prior to Stage 2 release.
              </li>
              <li>
                <strong>Transactional Email Relay:</strong> When a new message or connection event occurs, we dispatch transactional email alerts (via Resend) containing your <code className="text-xs font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-300">SS-XXXXXXXX</code> Reference ID without exposing the Candidate’s raw email address to the Employer until Stage 2 Vault Release is approved.
              </li>
              <li>
                <strong>Zero Public AI Model Training:</strong> Uploaded resumes and job descriptions are transmitted via secure APIs to our LLM providers strictly for structured skill extraction and 5-Point AI Match Radar scoring. Your private documents are <span className="font-bold underline">never</span> used to train public foundation models.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl">5. 30-Day Job Expiration &amp; Data Freshness</h2>
            <p className="text-slate-600 leading-relaxed mt-2">
              To prevent &ldquo;evergreen&rdquo; ghost listings designed to passively harvest applicant profiles, all active job postings on Special Sauce automatically expire <strong>30 days</strong> after publication unless manually renewed by the verified Employer. Expired listings are immediately removed from Candidate job feeds and blocked from receiving new applications.
            </p>
          </section>

          <section>
            <h2 className="text-xl">6. How We Share Your Information</h2>
            <p className="text-slate-600 leading-relaxed mt-2">
              We do not sell, rent, or broker your Personal Information to third-party data aggregators or lead-generation lists. We share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-5 mt-4 space-y-2 text-slate-600">
              <li>
                <strong className="text-slate-800">With Verified Employers (Staged Consent):</strong> Stage 1 thread access occurs only when you submit a protected application to an Employer’s role or accept their Professional Invitation; Stage 2 disclosure (Full Name, direct email, and signed PDF resume link) occurs strictly when you click &ldquo;Release Resume &amp; Contact Vault.&rdquo;
              </li>
              <li>
                <strong className="text-slate-800">With Infrastructure &amp; Security Providers:</strong> Trusted enterprise infrastructure providers who power our global edge cloud hosting, encrypted Row-Level Security (RLS) databases and isolated private storage buckets, payment and biometric identity vaulting (Stripe), transactional email delivery, and multi-tier AI matching inference.
              </li>
              <li>
                <strong className="text-slate-800">For Legal &amp; Security Compliance:</strong> To comply with lawful requests, enforce our Terms of Service, or investigate suspected data harvesting or security violations.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl">7. Your Data Rights &amp; Account Deletion</h2>
            <p className="text-slate-600 leading-relaxed mt-2">
              You have the right to access, update, or delete your Personal Information and vaulted PDF resume at any time through your dashboard settings or by submitting a request through our Help Center. Upon account deletion, your profile and stored resume files are permanently purged from our active encrypted databases and isolated cloud storage buckets.
            </p>
          </section>

          <section>
            <h2 className="text-xl">8. Contact Us</h2>
            <p className="text-slate-600 leading-relaxed mt-2">
              If you have any questions, concerns, or requests regarding this Privacy Policy, our 2-Stage Identity Vault, or how we handle your data, please contact our privacy team at{' '}
              <a
                href="mailto:privacy@specialsauce.io"
                className="text-indigo-600 font-bold hover:underline"
              >
                privacy@specialsauce.io
              </a>{' '}
              or{' '}
              <a
                href="mailto:info@specialsauce.io"
                className="text-indigo-600 font-bold hover:underline"
              >
                info@specialsauce.io
              </a>
              .
            </p>
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-900">{LEGAL_CONFIG.legalEntityName}</p>
              <p>Attn: Privacy &amp; Data Protection Officer</p>
              <p>{LEGAL_CONFIG.legalEntityAddress}</p>
              <p>Email: {LEGAL_CONFIG.privacyEmail} • {LEGAL_CONFIG.supportEmail}</p>
            </div>
          </section>
        </div>
      </div>
      </main>
      <PublicFooter />
    </div>
  )
}