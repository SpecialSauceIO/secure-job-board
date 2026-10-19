import { signupCandidate } from '@/app/signup/actions'
import Link from 'next/link'
import Image from 'next/image'

export default async function CandidateSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const resolvedParams = await searchParams

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 sm:p-8">
      <div className="mb-6 flex justify-center">
        <Link href="/" className="group block hover:opacity-90 transition-opacity">
          <Image
            src="/logo.png"
            alt="specialsauce.io Logo"
            width={340}
            height={85}
            className="h-20 w-auto object-contain"
            className="w-[195px] sm:w-[220px] h-auto"
            priority
          />
        </Link>
      </div>

      <div className="w-full max-w-md rounded-2xl bg-white p-8 sm:p-10 shadow-sm border border-slate-300 border-t-4 border-t-indigo-600">
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-300 text-indigo-700 text-[11px] font-extrabold uppercase tracking-wider mb-3">
            🛡️ 2-Stage Identity Vault Protected
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Candidate Sign Up
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 font-medium">
            Create your anonymous skill profile. Zero resume harvesting.
          </p>
        </div>

        {/* High-Trust Value Props Callout */}
        <div className="mb-6 p-4 rounded-xl bg-slate-50 border-2 border-2-slate-200/80 space-y-2 text-xs text-slate-600">
          <div className="flex items-start gap-2">
            <span className="text-emerald-600 font-black mt-0.5">✓</span>
            <span>
              <strong className="text-slate-900">2-Stage Vault Control:</strong>{' '}
              Chat in an encrypted thread first. Your raw email &amp; PDF resume stay locked until you click release.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-600 font-black mt-0.5">✓</span>
            <span>
              <strong className="text-slate-900">Dealbreaker Firewall:</strong>{' '}
              Block pitches that miss your minimum salary, work model, or W-2/1099 preferences.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-600 font-black mt-0.5">✓</span>
            <span>
              <strong className="text-slate-900">30-Day Fresh Roles Only:</strong>{' '}
              Every job listing auto-expires after 30 days to eliminate ghost jobs.
            </span>
          </div>
        </div>

        {resolvedParams.message && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-300 text-rose-600 text-sm font-bold rounded-lg text-center">
            {resolvedParams.message}
          </div>
        )}

        <form action={signupCandidate} className="space-y-5">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold text-slate-700 mb-1.5"
              >
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    ></path>
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:text-sm shadow-sm"
                  placeholder="name@email.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-bold text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    ></path>
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:text-sm shadow-sm"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex justify-center items-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-all cursor-pointer"
            >
              Create Candidate Account →
            </button>
          </div>

          <p className="text-[11px] text-center text-slate-400 leading-relaxed">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-slate-600">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-slate-600">
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      </div>

      <div className="mt-6 text-center space-y-2">
        <p className="text-xs text-slate-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-extrabold text-indigo-600 hover:text-indigo-700"
          >
            Sign In
          </Link>
        </p>
        <Link
          href="/signup"
          className="text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors block"
        >
          &larr; Back to account selection
        </Link>
      </div>
    </div>
  )
}