import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { LEGAL_CONFIG } from '@/constants/legal'

export const metadata = {
  alternates: { canonical: "/privacy" },
  title: 'Privacy Policy',
  description:
    'How Special Sauce collects, uses, and protects your data through our Private Resume Vault and Stripe ID protection.',
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
                At specialsauce.io, operated by <strong>{LEGAL_CONFIG.legalEntityName}</strong> (&ldquo;Special Sauce,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), privacy and trust are the foundation of our hiring marketplace. This Privacy Policy explains how we collect, use, store, and protect your information when you use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl">2. Information We Collect &amp; Store</h2>
              <p className="text-slate-600 leading-relaxed mt-2">
                We separate your information between our application database and our payment and identity verification partner (Stripe):
              </p>
              <ul className="list-disc pl-5 mt-4 space-y-2 text-slate-600">
                <li>
                  <strong className="text-slate-800">Account &amp; Authentication Data:</strong> Your full name, email address, login credentials, and 6-digit 2-step verification session logs. Your full name and email address remain hidden from public or Employer search views by default.
                </li>
                <li>
                  <strong className="text-slate-800">Professional &amp; Preference Data:</strong> Uploaded PDF resumes, extracted skills, years of experience, certifications, languages, general location, saved bookmarks, and match preferences (minimum pay, work model, and employment type).
                </li>
                <li>
                  <strong className="text-slate-800">Employer Organization Data:</strong> Verified corporate domain records, company profile details, Federal Tax ID (EIN) and state registration confirmation status, and published role specifications.
                </li>
                <li>
                  <strong className="text-slate-800">Identity &amp; Payment Data (Handled Exclusively by Stripe):</strong> When Professionals and Employer Admins verify their identity via Stripe Identity or complete purchases via Stripe Checkout, government ID images, selfies, and payment details are transmitted directly to Stripe over encrypted connections.{' '}
                  <span className="font-semibold text-slate-800">
                    Special Sauce never stores your government ID photos, selfies, credit card numbers, or bank account details on our servers.
                  </span>{' '}
                  We only receive a simple verification status confirmation. Identity verification is performed with your consent for fraud and bot prevention in compliance with applicable state and federal privacy laws (including the Texas Capture or Use of Biometric Identifier Act). Stripe retains and deletes verification data in accordance with the Stripe Privacy Policy and statutory retention limits.
                </li>
                <li>
                  <strong className="text-slate-800">In-Platform Messaging, Support Tickets &amp; Security Logs:</strong> Messages sent inside platform chat threads (<code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">SS-XXXXXXXX</code>), Help Center support requests or bug reports (including optional screenshot attachments), read timestamps, and velocity/security telemetry used to prevent spam, account takeovers, and unauthorized scraping.
                </li>
              </ul>
            </section>

            <section className="bg-emerald-50/60 p-6 rounded-2xl border border-emerald-300">
              <h2 className="text-xl text-slate-900 mb-3">
                3. How Your Private Resume Vault Works
              </h2>
              <p className="text-slate-700 leading-relaxed">
                Unlike traditional job boards that expose your resume and contact details publicly, Special Sauce gives you step-by-step control over your privacy:
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2 text-slate-700">
                <li>
                  <strong>Anonymous Discovery:</strong> While browsing or checking TrueFit Scores™, Employers only see <code className="text-xs font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300">Professional #ID</code> along with your skills, experience, general US Metro location, and summary. Professionals see <code className="text-xs font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300">Protected Role • Verified Employer</code> with upfront pay bands and role requirements.
                </li>
                <li>
                  <strong>The Introduction (Private Chat):</strong> When an Employer unlocks your application or you accept an Employer Invitation, a private chat thread opens under a shared Reference ID (<code className="text-xs font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300">SS-XXXXXXXX</code>). You see the Employer’s verified company name and domain, and the Employer sees only your <strong>First Name and Last Initial</strong>. Your email address and PDF resume stay locked in your private vault.
                </li>
                <li>
                  <strong>The Conversation (One-Click Resume Release):</strong> You decide when to click <strong>&ldquo;Release Resume &amp; Contact Vault&rdquo;</strong> inside the chat thread. Only when you click release does the platform share your Full Name, direct email address, and PDF resume with the Employer.
                </li>
              </ul>
            </section>

            <section className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-300">
              <h2 className="text-xl text-slate-900 mb-3">
                4. Messaging Safety, Payload Scanning &amp; Zero External AI Training
              </h2>
              <ul className="list-disc pl-5 mt-3 space-y-2 text-slate-700">
                <li>
                  <strong>Anti-Phishing &amp; Vault Guardrails:</strong> Platform messages and uploaded PDF files are automatically checked to block executable scripts, prompt-injection commands, requests for Social Security Numbers, bank details, wire transfers, or premature contact/off-platform chat links (such as WhatsApp, Telegram, or external links prior to vault release).
                </li>
                <li>
                  <strong>Private Email Notifications:</strong> When you receive a new invitation, message, or support update, we send an email alert with your reference number without exposing your personal email address to the other party.
                </li>
                <li>
                  <strong>Zero Public AI Model Training:</strong> Uploaded resumes and job descriptions are used solely to organize your profile and calculate your TrueFit Score™. Your private documents are <span className="font-bold underline">never</span> sold or used to train public AI models.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl">5. 30-Day Job Expiration</h2>
              <p className="text-slate-600 leading-relaxed mt-2">
                To prevent stale ghost jobs, all active job listings on Special Sauce automatically expire <strong>30 days</strong> after publication unless renewed by the Employer.
              </p>
            </section>

            <section>
              <h2 className="text-xl">6. How We Share Your Information</h2>
              <p className="text-slate-600 leading-relaxed mt-2">
                We do not sell, rent, or broker your Personal Information to third-party data brokers or marketing lists. We share your information only:
              </p>
              <ul className="list-disc pl-5 mt-4 space-y-2 text-slate-600">
                <li>
                  <strong className="text-slate-800">With Verified Employers (With Your Consent):</strong> Private chat opens when you apply to a role or accept an invitation, and your full resume and contact details (including any Enterprise Employer ATS sync to Workday/Greenhouse or CSV export) are shared strictly after you click &ldquo;Release Resume &amp; Contact Vault.&rdquo;
                </li>
                <li>
                  <strong className="text-slate-800">With Core Service Providers:</strong> Trusted infrastructure providers who power our cloud hosting, encrypted database storage, payment and identity verification (Stripe), and transactional email delivery.
                </li>
                <li>
                  <strong className="text-slate-800">For Legal &amp; Security Compliance:</strong> When required by law or to enforce our Terms of Service and protect the safety of our users.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl">7. Cookies &amp; Session Security</h2>
              <p className="text-slate-600 leading-relaxed mt-2">
                Special Sauce uses strictly necessary authentication and security cookies to keep you signed in, verify 2-step authentication sessions, and protect your account against cross-site request forgery. We do not use third-party advertising cookies or cross-site behavioral tracking pixels.
              </p>
            </section>

            <section>
              <h2 className="text-xl">8. Your Data Rights, Age Requirement &amp; Account Deletion</h2>
              <p className="text-slate-600 leading-relaxed mt-2">
                You may update or delete your profile and stored PDF resume at any time from your dashboard or by contacting us. When you delete your account, your profile and stored resume files are permanently deleted from our active databases. Special Sauce is intended strictly for individuals <strong>18 years of age or older</strong>, and we do not knowingly collect personal information from anyone under 18.
              </p>
            </section>

            <section>
              <h2 className="text-xl">9. Contact Us</h2>
              <p className="text-slate-600 leading-relaxed mt-2">
                If you have questions or requests regarding this Privacy Policy or your personal data, please contact us at{' '}
                <a
                  href={`mailto:${LEGAL_CONFIG.supportEmail}`}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  {LEGAL_CONFIG.supportEmail}
                </a>
                .
              </p>
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">{LEGAL_CONFIG.legalEntityName}</p>
                <p>Attn: Privacy &amp; Legal Compliance</p>
                <p>{LEGAL_CONFIG.legalEntityAddress}</p>
                <p>Email: {LEGAL_CONFIG.supportEmail}</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
