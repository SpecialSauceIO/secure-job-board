import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { PublicHeader } from '@/components/PublicHeader'

export default async function SignupSelectionPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const resolvedParams = await searchParams
  const rawPlan = (resolvedParams?.plan || '').trim().toLowerCase()
  const isCandidatePlan =
    rawPlan === 'explorer' || rawPlan === 'professional' || rawPlan === 'prestige'
  const isEmployerPlan =
    rawPlan === 'starter' || rawPlan === 'growth' || rawPlan === 'enterprise'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    if (isCandidatePlan) {
      redirect('/dashboard/billing?select=' + encodeURIComponent(rawPlan))
    }
    if (isEmployerPlan) {
      redirect('/dashboard/employer/billing?select=' + encodeURIComponent(rawPlan))
    }
    redirect('/dashboard')
  }

  const candidateHref = isCandidatePlan
    ? `/signup/candidate?plan=${encodeURIComponent(rawPlan)}`
    : '/signup/candidate'
  const employerHref = isEmployerPlan
    ? `/signup/employer?plan=${encodeURIComponent(rawPlan)}`
    : '/signup/employer'
  const loginHref =
    isCandidatePlan || isEmployerPlan
      ? `/login?plan=${encodeURIComponent(rawPlan)}`
      : '/login'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicHeader />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:p-6">
        <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl border-2 border-slate-300 overflow-hidden">
          <div className="p-5 sm:p-10 text-center bg-slate-900 text-white">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 sm:mb-3 tracking-tight">
              Join the Platform
            </h1>
            <p className="text-slate-400 text-sm sm:text-lg max-w-xl mx-auto">
              Select your account type to get started.
            </p>
          </div>

          <div className="p-4 sm:p-10 bg-white grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Link
              href={candidateHref}
              className="group relative p-4 sm:p-8 border-2 border-slate-300 rounded-2xl hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left shadow-sm hover:shadow-md block"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-extrabold uppercase tracking-wider">
                  $5 One-Time Verify • $0/Mo Explorer Forever
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                I&apos;m a Professional
              </h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Verify your identity once for $5 to unlock your $0/mo Explorer Vault forever (unlimited TrueFit Score™ checks, inbound Employer Invitations, & Weekly 1-Year Prestige Drawing). Upgrade to Professional ($12/mo) or Prestige ($19/mo) anytime to apply outbound.
              </p>
              <div className="mt-5 sm:mt-6 flex items-center text-indigo-600 font-bold text-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-hover:translate-x-1 transition-all">
                Create Verified Professional Vault
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </Link>

            <Link
              href={employerHref}
              className="group relative p-4 sm:p-8 border-2 border-slate-300 rounded-2xl hover:border-emerald-600 hover:bg-emerald-50 transition-all text-left shadow-sm hover:shadow-md block"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider">
                  $25 One-Time Verify • $0/Mo Sandbox • 12-Mo Rate Lock
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                I&apos;m an Employer
              </h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Complete your $25 one-time Organization Verification to unlock the $0/mo Employer Explorer Sandbox, preview verified professional matches, and lock in Founding Partner rates for 12 months with 100% Accepted-Only Invitation Credit Protection.
              </p>
              <div className="mt-5 sm:mt-6 flex items-center text-emerald-600 font-bold text-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-hover:translate-x-1 transition-all">
                Continue as Employer
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href={loginHref}
            className="text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors"
          >
            Already have an account? Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
