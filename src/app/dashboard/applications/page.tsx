import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CandidateApplications } from '@/components/CandidateApplications'

export default async function ApplicationsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // FIX: We now only redirect if we are certain they are an employer. 
  // This allows new test accounts with a NULL role to access the tracker.
  if (profile?.role === 'employer') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="mb-8">
          <Link
            href="/dashboard"
            className="text-indigo-600 font-bold text-sm inline-flex items-center gap-1 mb-3 hover:text-indigo-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Candidate Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Application Tracker</h1>
          <p className="text-slate-500 mt-2">Monitor your active applications and employer unlocks.</p>
        </header>

        <section>
          <CandidateApplications />
        </section>

      </div>
    </div>
  )
}