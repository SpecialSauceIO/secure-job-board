import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy',
  description: 'How Special Sauce collects, uses, and protects your data.',
}

export default function PrivacyPolicyPage() {
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
              At specialsauce.io ("Special Sauce," "we," "us," or "our"), trust is the foundation of our blind hiring marketplace. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform or use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl">2. Information We Collect</h2>
            <p className="text-slate-600 leading-relaxed mt-2">
              We collect information that identifies, relates to, or could reasonably be linked with you ("Personal Information"), including:
            </p>
            <ul className="list-disc pl-5 mt-4 space-y-2 text-slate-600">
              <li><strong className="text-slate-800">Account Data:</strong> Name, email address, and authentication credentials.</li>
              <li><strong className="text-slate-800">Professional Data:</strong> Resumes, job histories, technical skills, and job descriptions uploaded to the platform.</li>
              <li><strong className="text-slate-800">Identity Verification Data:</strong> If you opt for a "Verified" status, you will provide government ID and biometric data directly to our third-party identity provider (e.g., Stripe). <span className="font-semibold text-slate-800">Special Sauce does not store your raw ID documents or facial scans on our servers.</span> We only receive and store a cryptographic verification token.</li>
              <li><strong className="text-slate-800">Automated Data:</strong> IP addresses, browser types, and usage data required to enforce rate limits and protect against spam and bots.</li>
            </ul>
          </section>

          <section className="bg-emerald-50/50 p-6 rounded-xl border border-emerald-100">
            <h2 className="text-xl text-slate-900 mb-4">3. How Our "Blind" System Works</h2>
            <p className="text-slate-700 leading-relaxed">
              When a Candidate applies for a role, their Personal Information (name, contact info, original resume document) is hidden. Employers only see an anonymized profile, skills matrix, and AI-generated executive briefing. 
            </p>
            <p className="text-slate-700 leading-relaxed mt-4 font-bold">
              Your identity is only revealed to an Employer when both parties explicitly opt-in to decrypt the match and move forward with the hiring process.
            </p>
          </section>

          <section className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100">
            <h2 className="text-xl text-slate-900 mb-4">4. Artificial Intelligence & Third-Party APIs</h2>
            <p className="text-slate-700 leading-relaxed">
              To provide our core matching and parsing services, we transmit your uploaded resumes and job descriptions to third-party Large Language Model (LLM) providers via secure APIs.
            </p>
            <ul className="list-disc pl-5 mt-4 space-y-2 text-slate-700">
              <li>Data transmitted to our AI partners is used <span className="font-bold underline">strictly</span> for the purpose of parsing your profile and generating match scores.</li>
              <li>We maintain agreements with our AI providers ensuring that your personal and professional data is <span className="font-bold">never used to train their underlying public foundation models</span>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl">5. How We Share Your Information</h2>
            <p className="text-slate-600 leading-relaxed mt-2">
              We do not sell your Personal Information. We share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-5 mt-4 space-y-2 text-slate-600">
              <li><strong className="text-slate-800">With Employers:</strong> Only when you apply for a role AND a mutual decision is made to reveal your identity.</li>
              <li><strong className="text-slate-800">With Service Providers:</strong> Trusted third parties who provide cloud hosting (Vercel), database infrastructure (Supabase), payment processing and identity verification (Stripe), and AI processing.</li>
              <li><strong className="text-slate-800">For Legal & Security Reasons:</strong> To comply with legal obligations, enforce our Terms of Service, or protect the platform against fraud and algorithmic manipulation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl">6. Data Security</h2>
            <p className="text-slate-600 leading-relaxed mt-2">
              We implement industry-standard technical and organizational measures to secure your data, including Row Level Security (RLS) in our databases and encryption in transit and at rest. However, no internet transmission is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl">7. Your Data Rights & Deletion</h2>
            <p className="text-slate-600 leading-relaxed mt-2">
              You have the right to access, update, or delete your Personal Information at any time. You can delete your account and associated data directly through your dashboard settings. Upon deletion, your data will be permanently removed from our active databases, though some anonymized metadata may be retained for accounting and security auditing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl">8. Contact Us</h2>
            <p className="text-slate-600 leading-relaxed mt-2">
              If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please contact us at <a href="mailto:privacy@specialsauce.io" className="text-indigo-600 font-medium hover:underline">privacy@specialsauce.io</a>.
            </p>
          </section>
        </div>
        
      </div>
    </div>
  )
}