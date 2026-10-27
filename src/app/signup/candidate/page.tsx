'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { signupCandidate } from '@/app/signup/actions'
import Link from 'next/link'
import { PublicHeader } from '@/components/PublicHeader'

export default function CandidateSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; plan?: string }>
}) {
  const resolvedParams = use(searchParams)
  const selectedPlan =
    resolvedParams.plan === 'professional' || resolvedParams.plan === 'prestige'
      ? resolvedParams.plan
      : 'explorer'

  const router = useRouter()
  const [showPassword, setShowPassword] = useState<boolean>(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        router.replace(`/dashboard/billing?select=${selectedPlan}`)
      }
    })
  }, [router, selectedPlan])

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:p-8">
        <div className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-10 shadow-sm border border-slate-300 border-t-4 border-t-indigo-600">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-300 text-indigo-700 text-[11px] font-extrabold uppercase tracking-wider mb-3">
              🛡️ Intro/Convo Identity Vault Protected
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Candidate Sign Up
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 font-medium">
              {selectedPlan === 'prestige'
                ? 'Create your free account to stage your profile and start your 30-Day Free Trial of Prestige ($15/mo after).'
                : selectedPlan === 'professional'
                  ? 'Create your free account to stage your profile and start your 30-Day Free Trial of Professional ($9/mo after).'
                  : 'Create your free account to stage your anonymous skill matrix and start your 30-Day Free Trial of Explorer ($3/mo after).'}
            </p>
          </div>

          {/* High-Trust Value Props Callout */}
          <div className="mb-6 p-4 rounded-xl bg-slate-50 border-2 border-slate-300/80 space-y-2 text-xs text-slate-600 border-slate-300">
            <div className="flex items-start gap-2">
              <span className="text-emerald-600 font-black mt-0.5">✓</span>
              <span>
                <strong className="text-slate-900">Intro/Convo Vault Control:</strong>{' '}
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
            <input type="hidden" name="plan" value={selectedPlan} />
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
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="block w-full rounded-lg border border-slate-300 bg-white pl-10 pr-16 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:text-sm shadow-sm"
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev: boolean) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-extrabold text-slate-500 hover:text-indigo-600 cursor-pointer"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex justify-center items-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-all cursor-pointer"
              >
                {selectedPlan === 'prestige'
                  ? 'Start 30-Day Free Trial ($15/mo After) →'
                  : selectedPlan === 'professional'
                    ? 'Start 30-Day Free Trial ($9/mo After) →'
                    : 'Create Free Vault & Start 30-Day Free Trial →'}
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
              href={`/login?plan=${selectedPlan}`}
              className="font-extrabold text-indigo-600 hover:text-indigo-700"
            >
              Sign In
            </Link>
          </p>
          <Link
            href={`/signup?plan=${selectedPlan}`}
            className="text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors block"
          >
            &larr; Back to account selection
          </Link>
        </div>
      </div>
    </div>
  )
}
