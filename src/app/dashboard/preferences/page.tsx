import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import CandidatePreferencesForm from '@/components/CandidatePreferencesForm'
import { updateProfile } from '@/app/dashboard/actions'
import VerifyButton from '@/app/dashboard/VerifyButton'
import { normalizeIndustryVertical } from '@/constants/industries'
import { normalizeCandidateEducation } from '@/constants/education'
import { normalizeLanguageList } from '@/constants/languages'
import { normalizeCandidateAvailability } from '@/constants/availability'

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
  {
    value: 'Seasonal / Temporary',
    label: 'Seasonal / Temporary',
    desc: 'Fixed-term, holiday, peak-season, or temporary staffing roles',
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

function extractSavedPrefMeta(profile: any) {
  const rawSkills = Array.isArray(profile?.structured_skills)
    ? profile.structured_skills
    : []
  const metaEntry =
    rawSkills.find((item: any) => item && item._ss_pref_meta === true) || {}

  return {
    industryVertical: metaEntry.industry_vertical
      ? normalizeIndustryVertical(metaEntry.industry_vertical)
      : 'Technology, Software & SaaS',
    educationLevel: metaEntry.education_level
      ? normalizeCandidateEducation(metaEntry.education_level)
      : 'Practical Experience & Industry Certifications',
    certifications: metaEntry.certifications || '',
    availabilityWindow: normalizeCandidateAvailability(metaEntry.availability_window),
    languages: normalizeLanguageList(metaEntry.languages, true),
  }
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

  const rawSubmittedIndustry = String(
    formData.get('industry_vertical') || ''
  ).trim()
  const rawSubmittedEducation = String(
    formData.get('education_level') || ''
  ).trim()
  const submittedCertifications = formData.has('certifications')
    ? String(formData.get('certifications') || '').trim()
    : ''
  const rawSubmittedAvailability = String(
    formData.get('availability_window') || ''
  ).trim()
  const rawSubmittedLanguages = String(formData.get('languages') || '').trim()

  // Fetch latest profile fields from DB so we preserve bio, experience, verification, and saved skills
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('structured_skills, experience_years, bio, identity_verified, is_verified, is_discoverable')
    .eq('id', user.id)
    .single()

  const rawSkills = Array.isArray(currentProfile?.structured_skills)
    ? currentProfile.structured_skills
    : []

  const existingPrefMeta =
    rawSkills.find((item: any) => item && item._ss_pref_meta === true) || {}

  const finalIndustryVertical = rawSubmittedIndustry
    ? normalizeIndustryVertical(rawSubmittedIndustry)
    : existingPrefMeta.industry_vertical || 'Technology, Software & SaaS'

  const finalEducationLevel = rawSubmittedEducation
    ? normalizeCandidateEducation(rawSubmittedEducation)
    : existingPrefMeta.education_level ||
      'Practical Experience & Industry Certifications'

  const finalAvailabilityWindow = rawSubmittedAvailability
    ? normalizeCandidateAvailability(rawSubmittedAvailability)
    : normalizeCandidateAvailability(existingPrefMeta.availability_window)

  const finalLanguages = rawSubmittedLanguages
    ? normalizeLanguageList(rawSubmittedLanguages, true)
    : normalizeLanguageList(existingPrefMeta.languages, true)

  const cleanedSkills = rawSkills.filter(
    (item: any) => !(item && item._ss_pref_meta === true)
  )

  cleanedSkills.push({
    ...existingPrefMeta,
    _ss_pref_meta: true,
    employment_types: finalEmploymentTypes,
    industry_vertical: finalIndustryVertical,
    education_level: finalEducationLevel,
    certifications: formData.has('certifications')
      ? submittedCertifications
      : existingPrefMeta.certifications || '',
    availability_window: finalAvailabilityWindow,
    languages: finalLanguages,
  })

  formData.set('structured_skills', JSON.stringify(cleanedSkills))
  formData.set('industry_vertical', finalIndustryVertical)
  formData.set('education_level', finalEducationLevel)
  formData.set(
    'certifications',
    formData.has('certifications')
      ? submittedCertifications
      : existingPrefMeta.certifications || ''
  )
  formData.set('availability_window', finalAvailabilityWindow)
  formData.set('languages', JSON.stringify(finalLanguages))
  if (currentProfile?.experience_years !== undefined && currentProfile?.experience_years !== null) {
    formData.set('experience_years', String(currentProfile.experience_years))
  }
  if (currentProfile?.bio !== undefined && currentProfile?.bio !== null) {
    formData.set('bio', String(currentProfile.bio))
  }

  await updateProfile(formData)

  await supabase
    .from('profiles')
    .update({ structured_skills: cleanedSkills })
    .eq('id', user.id)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard/preferences')
  revalidatePath('/dashboard/jobs')
  revalidatePath('/dashboard/requests')
  revalidatePath('/dashboard/employer/search')
  redirect('/dashboard/preferences?saved=1')
}

export default async function MatchPreferencesPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string }>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const showSavedBanner = resolvedSearchParams?.saved === '1'

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
      String(profile?.identity_verified) === 'true' ||
      profile?.is_verified === true ||
      String(profile?.is_verified) === 'true'
  )

  const savedEmploymentTypes = extractSavedEmploymentTypes(profile)
  const { availabilityWindow } = extractSavedPrefMeta(profile)

  return (
    <div className="py-2">
      <div className="max-w-6xl mx-auto py-3 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Match Preferences &amp; Dealbreakers
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Set your minimum salary floor, accepted employment types, preferred work model, target US location, and search availability.
            </p>
          </div>
        </header>

        {!isVerified && (
          <div className="p-4 sm:p-6 rounded-2xl bg-amber-50 border-2 border-slate-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-extrabold text-amber-950">
                Identity Verification Required
              </h2>
              <p className="text-xs text-amber-800 mt-0.5">
                Complete the $5 One-Time ID Verification to unlock your anonymous profile in Employer Search and configure inbound dealbreaker rules.
              </p>
            </div>
            <div className="shrink-0">
              <VerifyButton />
            </div>
          </div>
        )}

        {showSavedBanner && isVerified && (
          <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 flex items-center justify-between gap-3 shadow-sm">
            <div className="text-xs sm:text-sm font-bold">
              ✓ Match Preferences &amp; Dealbreakers saved. Your Recommended Roles, Find Roles filters, and Employer Search rules are updated.
            </div>
          </div>
        )}

        <CandidatePreferencesForm
          action={saveCandidatePreferencesWithEmploymentTypes}
          isVerified={isVerified}
          initialMinSalary={
            profile?.min_salary_expectation
              ? String(profile.min_salary_expectation)
              : ''
          }
          initialEmploymentTypes={savedEmploymentTypes}
          employmentTypeOptions={EMPLOYMENT_TYPE_OPTIONS}
          initialWorkModel={profile?.preferred_work_model || 'remote'}
          initialAvailabilityWindow={availabilityWindow}
          initialLocation={profile?.location || ''}
          hiddenExperienceYears={
            profile?.experience_years !== undefined && profile?.experience_years !== null
              ? String(profile.experience_years)
              : ''
          }
          hiddenBio={profile?.bio || ''}
          hiddenStructuredSkillsJson={JSON.stringify(
            profile?.structured_skills || []
          )}
        />
      </div>
    </div>
  )
}