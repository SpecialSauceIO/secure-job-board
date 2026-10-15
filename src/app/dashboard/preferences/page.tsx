import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SubmitButton } from '@/components/SubmitButton'
import UsLocationSelector from '@/components/UsLocationSelector'
import { updateProfile, forceVerifyCandidateIdentity } from '@/app/dashboard/actions'

export const dynamic = 'force-dynamic'

export default async function MatchPreferencesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'employer') redirect('/dashboard')

  const isVerified = Boolean(
    profile?.identity_verified === true ||
    profile?.is_verified === true ||
    profile?.verification_status === 'verified'
  )

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <header>
          <Link
            href="/dashboard"
            className="text-indigo-600 font-bold text-sm inline-flex items-center gap-1 mb-3 hover:text-indigo-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Candidate Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Match Preferences & Dealbreakers</h1>
          <p className="text-slate-500 mt-1">
            Configure your minimum salary expectations, preferred work model, and target US location to control which employer connection pitches you receive.
          </p>
        </header>

        {!isVerified && (
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-extrabold text-amber-950">Identity Verification Required</h2>
              <p className="text-xs text-amber-800 mt-0.5">
                Complete Stripe Identity verification to unlock receiving inbound connection pitches from verified employers.
              </p>
            </div>
            <form action={forceVerifyCandidateIdentity}>
              <button
                type="submit"
                className="shrink-0 px-4 py-2.5 bg-amber-600 text-white text-xs font-extrabold rounded-xl hover:bg-amber-700 transition-colors shadow-sm"
              >
                ⚡ Complete Verification
              </button>
            </form>
          </div>
        )}

        <form action={updateProfile} className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <input type="hidden" name="experience_years" value={profile?.experience_years || ''} />
          <input type="hidden" name="bio" value={profile?.bio || ''} />
          <input type="hidden" name="structured_skills" value={JSON.stringify(profile?.structured_skills || [])} />

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700">Minimum Salary Expectation (Annual USD)</label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <span className="text-slate-500 font-bold">$</span>
                </div>
                <input
                  type="number"
                  name="min_salary_expectation"
                  defaultValue={profile?.min_salary_expectation || ''}
                  placeholder="95000"
                  className="block w-full rounded-lg border border-slate-300 bg-white pl-8 pr-14 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm font-bold"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                  <span className="text-xs font-extrabold text-slate-400">USD /yr</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Employers whose role maximum budget is below this threshold will be blocked from pitching you.
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700">Preferred Work Model</label>
              <select
                name="preferred_work_model"
                defaultValue={profile?.preferred_work_model || 'remote'}
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium"
              >
                <option value="remote">Remote Only</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
                <option value="any">Open to Any Model</option>
              </select>
            </div>

            {/* US CASCADING LOCATION SELECTOR */}
            <div className="pt-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Target Location</label>
              <p className="text-xs text-slate-500 mb-3">
                Select your preferred US state and metro area for hybrid/on-site roles (or remote preference).
              </p>
              <UsLocationSelector
                name="location"
                value={profile?.location || ''}
                workModel={profile?.preferred_work_model || 'remote'}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <SubmitButton
              pendingText="Saving Preferences..."
              className="rounded-xl bg-indigo-600 px-8 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Save Match Preferences
            </SubmitButton>
          </div>
        </form>

      </div>
    </div>
  )
}