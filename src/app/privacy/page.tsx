import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | specialsauce.io',
  description:
    'How Special Sauce collects, uses, and protects your data through our 2-Stage Identity Vault and Stripe biometric isolation.',
}

export default function PrivacyPolicyPage() {
  const lastUpdated = 'October 16, 2026'

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6 md:px-12 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
        {/* Header */}
        <div className="mb-12 border-b border-slate-100 pb-8">
          <Link href="/" className="inline-flex items-center gap-2 group mb-8">
            <span className="text-2xl font-black tracking-tight text-slate-900 group-hover:opacity-80 transition-opacity">
              special<span className="text-orange-500">sauce</span>
              <span className="text-xs text-slate-400 font-bold ml-1">™</span>
            </span>
          </Link>
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
              At specialsauce.io (&ldquo;Special Sauce,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), trust and anti-harvesting protection are the foundation of our double-blind hiring marketplace. This Privacy Policy explains how we collect, use, vault, disclose, and safeguard your information when you visit our platform or use our services.
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
                <strong className="text-slate-800">Biometric Identity &amp; Payment Data (Vaulted Exclusively by Stripe):</strong> When Candidates complete identity verification via Stripe Identity or when Users purchase subscriptions via Stripe Checkout, government ID images, biometric selfies, and payment credentials are transmitted directly to Stripe over TLS 1.3 and encrypted (AES-256) inside Stripe’s PCI-DSS Level 1 infrastructure.{' '}
                <span className="font-semibold text-slate-800">
                  Special Sauce never stores your raw government ID documents, facial scans, credit card numbers, or bank account details on our servers.
                </span>{' '}
                We only receive and store a cryptographic verification status token.
              </li>
              <li>
                <strong className="text-slate-800">In-Platform Messaging &amp; Telemetry Data:</strong> Encrypted thread messages associated with connection Reference IDs (<code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">SS-XXXXXXXX</code>), read-receipt timestamps, IP addresses, and usage velocity required to enforce anti-harvesting guardrails and prevent automated scraping.
              </li>
            </ul>
          </section>

          <section className="bg-emerald-50/60 p-6 rounded-2xl border border-emerald-200">
            <h2 className="text-xl text-slate-900 mb-3">
              3. How Our 2-Stage Identity Vault Works (Anti-Harvesting Architecture)
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Unlike traditional job boards where uploading a resume exposes your contact details to mass scraping, Special Sauce enforces a strict <strong>2-Stage Identity Vault</strong>:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-2 text-slate-700">
              <li>
                <strong>Default Blind Discovery:</strong> While browsing or evaluating AI Match Radar scores, Employers only see <code className="text-xs font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200">Anonymous Candidate #ID</code>, extracted skills, experience years, target US Metro location, and a third-person bio. Candidates only see <code className="text-xs font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200">Blind Role • Verified Employer</code> alongside transparent pay bands, employment type, and core skill requirements.
              </li>
              <li>
                <strong>Stage 1 (Encrypted Thread Unlock):</strong> When an Employer unlocks an inbound blind application—or when a Candidate accepts an outbound Employer Pitch—an encrypted in-platform message thread opens under a shared Reference ID (<code className="text-xs font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200">SS-XXXXXXXX</code>). At Stage 1, the Employer’s verified company name and domain are revealed to the Candidate, and only the Candidate’s <strong>First Name and Last Initial</strong> (e.g., <em>Alex M.</em>) are revealed to the Employer. <strong>The Candidate’s raw email address and original PDF resume remain locked inside the Special Sauce Vault.</strong>
              </li>
              <li>
                <strong>Stage 2 (Candidate-Controlled Full Vault Release):</strong> The Candidate retains 100% control over when to click the <strong>&ldquo;Release Resume &amp; Contact Vault&rdquo;</strong> button inside the message thread. Only after the Candidate explicitly approves Stage 2 release does the platform reveal their Full Name, direct email address, and a time-limited (1-hour expiring) signed URL to view their original PDF resume.
              </li>
            </ul>
          </section>

          <section className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
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
                <strong>Transactional Email Relay:</strong> When a new message or connection event occurs, we dispatch transactional email alerts (via Resend) containing your <code className="text-xs font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200">SS-XXXXXXXX</code> Reference ID without exposing the Candidate’s raw email address to the Employer until Stage 2 Vault Release is approved.
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
                <strong className="text-slate-800">With Verified Employers (Staged Consent):</strong> Stage 1 thread access occurs only when you apply blindly to an Employer’s role or accept their outbound pitch; Stage 2 disclosure (Full Name, direct email, and signed PDF resume link) occurs strictly when you click &ldquo;Release Resume &amp; Contact Vault.&rdquo;
              </li>
              <li>
                <strong className="text-slate-800">With Infrastructure &amp; Security Providers:</strong> Trusted service providers who power our cloud hosting (Vercel), Row-Level Security database and private storage buckets (Supabase), payment and biometric identity vaulting (Stripe), transactional email delivery (Resend), and AI inference APIs.
              </li>
              <li>
                <strong className="text-slate-800">For Legal &amp; Security Compliance:</strong> To comply with lawful requests, enforce our Terms of Service, or investigate suspected data harvesting or security violations.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl">7. Your Data Rights &amp; Account Deletion</h2>
            <p className="text-slate-600 leading-relaxed mt-2">
              You have the right to access, update, or delete your Personal Information and vaulted PDF resume at any time through your dashboard settings or by submitting a request through our Help Center. Upon account deletion, your profile and stored resume files are permanently purged from our active Supabase databases and storage buckets.
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
          </section>
        </div>
      </div>
    </div>
  )
}