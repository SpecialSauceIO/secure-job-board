import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PlatformWorkflowsView from '@/components/PlatformWorkflowsView'

export const metadata = {
  title: 'Platform Workflows | specialsauce.io',
  description:
    'Side-by-side visual guide to Professional and Employer onboarding, verification, and marketplace workflows.',
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
    <div className="py-2">
      <div className="max-w-6xl mx-auto py-3 space-y-6">
        <header>
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <Link
              href="/dashboard"
              className="text-indigo-600 dark:text-indigo-400 font-bold text-sm inline-flex items-center gap-1 hover:text-indigo-700 dark:hover:text-indigo-300"
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
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link
              href="/dashboard/support"
              className="text-emerald-600 dark:text-emerald-400 font-bold text-sm inline-flex items-center gap-1 hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              Back to Support Center →
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Platform Workflows &amp; Verification Roadmap
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            Step-by-step visual guide showing how Professionals and Employers enroll, verify, and unlock full marketplace capabilities.
          </p>
        </header>

        <PlatformWorkflowsView isDashboard={true} />
      </div>
    </div>
  )
}
