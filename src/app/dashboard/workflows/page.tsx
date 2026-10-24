import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PlatformWorkflowsView from '@/components/PlatformWorkflowsView'

export const metadata = {
  title: 'Platform Workflows | specialsauce.io',
  description:
    'Side-by-side visual guide to Candidate and Employer onboarding, verification, and marketplace workflows.',
}

export default async function DashboardWorkflowsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <header>
          <Link
            href="/dashboard"
            className="text-indigo-600 font-bold text-sm inline-flex items-center gap-1 mb-3 hover:text-indigo-700"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Platform Workflows &amp; Verification Roadmap
          </h1>
          <p className="text-slate-500 mt-1">
            Step-by-step visual guide showing how Candidates and Employers enroll, verify, and unlock full marketplace capabilities.
          </p>
        </header>

        <PlatformWorkflowsView isDashboard={true} />
      </div>
    </div>
  )
}
