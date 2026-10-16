import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { SubmitButton } from '@/components/SubmitButton'
import UsLocationSelector from '@/components/UsLocationSelector'
import { updateProfile, forceVerifyCandidateIdentity } from '@/app/dashboard/actions'

export const dynamic = 'force-dynamic'

const EMPLOYMENT_TYPE_OPTIONS = [
  {
    value: 'Full-Time (W-2)',
    label: 'Full-Time (W-2)',
    desc: 'Standard salaried or hourly W-2 employment with benefits',
  },
  {
    value: 'Contract (1099 / Corp-to-Corp)',
    label: 'Contract (1099 / C2C)',
    desc: 'Independent contractor or Corp-to-Corp project engagements',
  },
  {
    value: 'Contract-to-Hire',
    label: 'Contract-to-Hire',
    desc: 'Initial contract period with intent to convert to Full-Time',
  },
  {
    value: 'Part-Time',
    label: 'Part-Time',
    desc: 'Reduced weekly hours or flexible fractional roles',
  },
]

function extractSavedEmploymentTypes(profile: any): string[] {
  if (
    Array.isArray(profile?.preferred_employment_types) &&
    profile.preferred_employment_types.length > 0
  ) {
    return profile.preferred_employment_types
  }
  const rawSkills = Array.isArray(profile?.structured_skills)
    ? profile.structured_skills
    : []
  const metaEntry = rawSkills.find(
    (item: any) => item && item._ss_pref_meta === true
  )
  if (
    Array.isArray(metaEntry?.employment_types) &&
    metaEntry.employment_types.length > 0
  ) {
    return metaEntry.employment_types
  }
  return EMPLOYMENT_TYPE_OPTIONS.map((o) => o.value)
}

async function saveCandidatePreferencesWithEmploymentTypes(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const selectedTypes = formData
    .getAll('employment_types')
    .map(String)
    .filter(Boolean)
  const finalEmploymentTypes =
    selectedTypes.length > 0
      ? selectedTypes
      : EMPLOYMENT_TYPE_OPTIONS.map((o) => o.value)

  // Fetch latest structured_skills from DB so we preserve saved_job_ids & saved_candidate_ids
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('structured_skills')
    .eq('id', user.id)
    .single()

  const rawSkills = Array.isArray(currentProfile?.structured_skills)
    ? currentProfile.structured_skills
    : []

  const existingPrefMeta =
    rawSkills.find((item: any) => item && item._ss_pref_meta === true) || {}

  const cleanedSkills = rawSkills.filter(
    (item: any) => !(item && item._ss_pref_meta === true)
  )

  cleanedSkills.push({
    ...existingPrefMeta,
    _ss_pref_meta: true,
    employment_types: finalEmploymentTypes,
  })

  formData.set('structured_skills', JSON.stringify(cleanedSkills))

  await updateProfile(formData)

  await supabase
    .from('profiles')
    .update({ structured_skills: cleanedSkills })
    .eq('id', user.id)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/preferences')
  revalidatePath('/dashboard/jobs')
}

export default async function MatchPreferencesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
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

  const savedEmploymentTypes = extractSavedEmploymentTypes(profile)

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
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
            Back to Candidate Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Match Preferences &amp; Dealbreakers
          </h1>
          <p className="text-slate-500 mt-1">
            Configure your minimum salary expectations, accepted employment types, preferred work model, and target US location to control which employer connection pitches you receive.
          </p>
        </header>

        {!isVerified && (
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-extrabold text-amber-950">
                Identity Verification Required
              </h2>
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

        <form
          action={saveCandidatePreferencesWithEmploymentTypes}
          className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6"
        >
          <input
            type="hidden"
            name="experience_years"
            value={profile?.experience_years || ''}
          />
          <input type="hidden" name="bio" value={profile?.bio || ''} />
          <input
            type="hidden"
            name="structured_skills"
            value={JSON.stringify(profile?.structured_skills || [])}
          />

          <div className="space-y-6">
            {/* 1. MINIMUM SALARY EXPECTATION */}
            <div>
              <label className="block text-sm font-bold text-slate-700">
                Minimum Salary Expectation (Annual USD)
              </label>
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
                  <span className="text-xs font-extrabold text-slate-400">
                    USD /yr
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Employers whose role maximum budget is below this threshold will be blocked from pitching you.
              </p>
            </div>

            {/* 2. ACCEPTED EMPLOYMENT TYPES (DEALBREAKER) */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-700">
                Accepted Employment Types (Dealbreaker)
              </label>
              <p className="text-xs text-slate-500 mt-0.5 mb-3">
                Select all employment models you are open to. Roles outside these types will be filtered out of your recommendations and dealbreaker guardrails.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EMPLOYMENT_TYPE_OPTIONS.map((opt) => {
                  const isChecked = savedEmploymentTypes.includes(opt.value)
                  return (
                    <label
                      key={opt.value}
                      className="relative flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-indigo-50/40 hover:border-indigo-300 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        name="employment_types"
                        value={opt.value}
                        defaultChecked={isChecked}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="text-xs">
                        <span className="font-extrabold text-slate-900 block">
                          {opt.label}
                        </span>
                        <span className="text-slate-500 leading-snug block mt-0.5">
                          {opt.desc}
                        </span>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* 3. PREFERRED WORK MODEL */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-700">
                Preferred Work Model
              </label>
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

            {/* 4. US CASCADING LOCATION SELECTOR */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Target Location
              </label>
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