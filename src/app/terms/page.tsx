import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service',
  description: 'Special Sauce Terms of Service and Acceptable Use Policy.',
}

export default function TermsOfServicePage() {
  const lastUpdated = "October 13, 2026"

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6 md:px-12 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
        
        {/* Header */}
        <div className="mb-12 border-b border-slate-100 pb-8">
          <Link href="/" className="inline-flex items-center gap-2 group mb-8">
            <span className="text-2xl font-black tracking-tight text-slate-900 group-hover:opacity-80 transition-opacity">
              special<span className="text-orange-500">sauce</span><span className="text-xs text-slate-400 font-bold ml-1">™</span>
            </span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-slate prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-indigo-600 max-w-none space-y-8">
          
          <section>
            <h2 className="text-xl">1. Acceptance of Terms</h2>
            <p className="text-slate-600 leading-relaxed mt-2">
              By accessing or using the specialsauce.io website, platform, and related services (collectively, the "Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Platform. These Terms apply to all visitors, users, candidates, and employers who access the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl">2. Description of Service</h2>
            <p className="text-slate-600 leading-relaxed mt-2">
              Special Sauce provides an AI-driven, blind hiring marketplace designed to connect professionals ("Candidates") with hiring companies ("Employers") based strictly on extracted skills and experience. We do not guarantee employment, the accuracy of employer job descriptions, or the ultimate performance of any candidate hired through the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl">3. Account Registration & Identity Verification</h2>
            <p className="text-slate-600 leading-relaxed mt-2">
              To utilize certain features of the Platform, you must register for an account. You agree to provide accurate, current, and complete information during the registration process. Candidates opting for a "Verified" status must submit to our third-party identity verification process. Providing false identification documents or misrepresenting your professional history is grounds for immediate account termination.
            </p>
          </section>

          <section className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h2 className="text-xl text-slate-900 mb-4">4. Prohibited Conduct & Acceptable Use</h2>
            <p className="text-slate-600 leading-relaxed">
              Special Sauce is a curated ecosystem designed for authentic connections between real professionals and verified employers. By accessing the Platform, you agree not to:
            </p>
            <ul className="list-disc pl-5 mt-4 space-y-2 text-slate-600">
              <li>Use any robot, spider, scraper, or other automated means to access the Platform, create accounts, extract data, or submit applications.</li>
              <li>Upload resumes, job descriptions, or other materials containing hidden text, deceptive formatting, or keyword-stuffing specifically designed to manipulate the Platform’s AI matching algorithms.</li>
              <li>Utilize the Platform for the purpose of bulk data harvesting, including but not limited to systematically revealing candidate identities without genuine hiring intent.</li>
              <li>Submit applications to roles for which you have no genuine interest or basic qualifications, at a volume that constitutes spam or degrades the experience of other Users.</li>
              <li>Attempt to reverse-engineer, decompile, or bypass the security and rate-limiting measures governing the Platform.</li>
            </ul>
          </section>

          <section className="bg-orange-50/50 p-6 rounded-xl border border-orange-100">
            <h2 className="text-xl text-slate-900 mb-4">5. Account Monitoring and Termination</h2>
            <p className="text-slate-700 leading-relaxed">
              To protect the integrity of the Platform, Special Sauce employs automated and manual security measures to monitor velocity, volume, and behavioral anomalies. 
            </p>
            <p className="text-slate-700 leading-relaxed mt-4">
              We reserve the right, at our sole discretion and without prior notice, to throttle, suspend, or permanently terminate any account that exhibits behavior consistent with spamming, data harvesting, or algorithmic manipulation. In the event of account termination due to a violation of these Acceptable Use terms, you forfeit any right to a refund for active subscriptions, paid job postings, or premium services.
            </p>
          </section>

          <section>
            <h2 className="text-xl">6. Payments, Subscriptions, and Refunds</h2>
            <p className="text-slate-600 leading-relaxed mt-2">
              Certain features of the Platform are subject to fees. All fees are stated in U.S. Dollars and are non-refundable except as required by law or explicitly stated in these Terms. Recurring subscriptions will automatically renew unless canceled prior to the billing cycle. Special Sauce utilizes third-party payment processors (e.g., Stripe) and does not store your full financial information on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-xl">7. Artificial Intelligence Disclaimer</h2>
            <p className="text-slate-600 leading-relaxed mt-2">
              The Platform relies on Large Language Models (LLMs) and artificial intelligence to parse documents, extract skills, and generate match scores. While we strive for high accuracy, AI systems can occasionally produce errors, omit context, or hallucinate data. Employers are solely responsible for conducting their own interviews and verifying candidate credentials upon revealing a profile. Candidates are responsible for ensuring their extracted profiles accurately reflect their experience prior to applying.
            </p>
          </section>

          <section>
            <h2 className="text-xl">8. Limitation of Liability</h2>
            <p className="text-slate-600 leading-relaxed mt-2">
              To the maximum extent permitted by applicable law, Special Sauce and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Platform; (ii) any conduct or content of any third party on the Platform; or (iii) unauthorized access, use, or alteration of your transmissions or content.
            </p>
          </section>

          <section>
            <h2 className="text-xl">9. Changes to Terms</h2>
            <p className="text-slate-600 leading-relaxed mt-2">
              We reserve the right to modify or replace these Terms at any time. We will provide notice of significant changes by updating the "Last Updated" date at the top of these Terms and posting an announcement on the Platform. Your continued use of the Platform following the posting of any changes constitutes acceptance of those changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl">10. Contact Information</h2>
            <p className="text-slate-600 leading-relaxed mt-2">
              If you have any questions about these Terms, please contact our legal and compliance team at <a href="mailto:legal@specialsauce.io" className="text-indigo-600 font-medium hover:underline">legal@specialsauce.io</a>.
            </p>
          </section>
        </div>
        
      </div>
    </div>
  )
}