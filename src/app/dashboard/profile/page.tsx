import StructuredCertificationSelector from '@/components/StructuredCertificationSelector'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import AiResumeScanner from '@/components/AiResumeScanner'
import { SubmitButton } from '@/components/SubmitButton'
import { StructuredSkillEditor } from '@/components/StructuredSkillEditor'
import { StructuredLanguageEditor } from '@/components/StructuredLanguageEditor'
import UsLocationSelector from '@/components/UsLocationSelector'
import { updateProfile } from '@/app/dashboard/actions'
import {
  STANDARD_INDUSTRY_VERTICALS,
  normalizeIndustryVertical,
} from '@/constants/industries'
import {
  CANDIDATE_EDUCATION_LEVELS,
  normalizeCandidateEducation,
} from '@/constants/education'
import { normalizeLanguageList } from '@/constants/languages'
import {
  CANDIDATE_AVAILABILITY_STATUSES,
  normalizeCandidateAvailability,
} from '@/constants/availability'

export const dynamic = 'force-dynamic'

const CANDIDATE_EMPLOYMENT_TYPE_OPTIONS = [
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

async function saveCandidateProfilePreservingMeta(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch current profile so we never lose hidden _ss_pref_meta or _ss_meta objects
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('structured_skills, min_salary_expectation, preferred_work_model, location')
    .eq('id', user.id)
    .single()

  const existingRaw = Array.isArray(existingProfile?.structured_skills)
    ? existingProfile.structured_skills
    : []

  const existingMetaObj = existingRaw.find(
    (s: any) => s && typeof s === 'object' && s._ss_meta === true
  )
  const existingPrefObj =
    existingRaw.find(
      (s: any) => s && typeof s === 'object' && s._ss_pref_meta === true
    ) || { _ss_pref_meta: true }

  const rawSubmittedIndustry = String(
    formData.get('industry_vertical') || ''
  ).trim()
  const normalizedIndustry = rawSubmittedIndustry
    ? normalizeIndustryVertical(rawSubmittedIndustry)
    : existingPrefObj.industry_vertical || 'Technology, Software & SaaS'

  const rawSubmittedEducation = String(
    formData.get('education_level') || ''
  ).trim()
  const normalizedEducation = rawSubmittedEducation
    ? normalizeCandidateEducation(rawSubmittedEducation)
    : existingPrefObj.education_level ||
      'Practical Experience & Industry Certifications'

  const submittedCertifications = String(
    formData.get('certifications') || ''
  ).trim()

  const rawSubmittedAvailability = String(
    formData.get('availability_window') || ''
  ).trim()
  const submittedAvailability = rawSubmittedAvailability
    ? normalizeCandidateAvailability(rawSubmittedAvailability)
    : normalizeCandidateAvailability(existingPrefObj.availability_window)

  const rawSubmittedLanguages = String(formData.get('languages') || '').trim()
  const normalizedLanguages = rawSubmittedLanguages
    ? normalizeLanguageList(rawSubmittedLanguages, true)
    : normalizeLanguageList(existingPrefObj.languages, true)

  const selectedEmpTypes = formData
    .getAll('employment_types')
    .map(String)
    .filter(Boolean)
  const finalEmploymentTypes =
    selectedEmpTypes.length > 0
      ? selectedEmpTypes
      : Array.isArray(existingPrefObj.employment_types) &&
        existingPrefObj.employment_types.length > 0
      ? existingPrefObj.employment_types
      : CANDIDATE_EMPLOYMENT_TYPE_OPTIONS.map((o) => o.value)

  const updatedPrefObj = {
    ...existingPrefObj,
    _ss_pref_meta: true,
    employment_types: finalEmploymentTypes,
    industry_vertical: normalizedIndustry,
    education_level: normalizedEducation,
    certifications: submittedCertifications,
    availability_window: submittedAvailability,
    languages: normalizedLanguages,
  }

  let submittedSkills: any[] = []
  try {
    submittedSkills = JSON.parse(
      String(formData.get('structured_skills') || '[]')
    )
  } catch {
    submittedSkills = []
  }

  const visibleSubmitted = (
    Array.isArray(submittedSkills) ? submittedSkills : []
  ).filter(
    (s: any) => s && typeof s === 'object' && !s._ss_meta && !s._ss_pref_meta
  )

  const mergedSkills = [
    ...visibleSubmitted,
    ...(existingMetaObj ? [existingMetaObj] : []),
    updatedPrefObj,
  ]
  formData.set('structured_skills', JSON.stringify(mergedSkills))
  formData.set('industry_vertical', normalizedIndustry)
  formData.set('education_level', normalizedEducation)
  formData.set('certifications', submittedCertifications)
  formData.set('availability_window', submittedAvailability)
  formData.set('languages', JSON.stringify(normalizedLanguages))

  // Preserve salary & work model if not present on the Profile form
  if (
    !formData.get('min_salary_expectation') &&
    existingProfile?.min_salary_expectation
  ) {
    formData.set(
      'min_salary_expectation',
      String(existingProfile.min_salary_expectation)
    )
  }
  if (
    !formData.get('preferred_work_model') &&
    existingProfile?.preferred_work_model
  ) {
    formData.set(
      'preferred_work_model',
      String(existingProfile.preferred_work_model)
    )
  }
  if (!formData.get('location') && existingProfile?.location) {
    formData.set('location', String(existingProfile.location))
  }

  await updateProfile(formData)

  await supabase
    .from('profiles')
    .update({ structured_skills: mergedSkills })
    .eq('id', user.id)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard/preferences')
  revalidatePath('/dashboard/employer/search')
}

export default async function ProfilePage() {
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

  const rawSkillsArray = Array.isArray(profile?.structured_skills)
    ? profile.structured_skills
    : []

  const visibleStructuredSkills = rawSkillsArray.filter(
    (s: any) =>
      s &&
      typeof s === 'object' &&
      !s._ss_meta &&
      !s._ss_pref_meta &&
      s.skill
  )

  const prefMetaObj = rawSkillsArray.find(
    (s: any) => s && typeof s === 'object' && s._ss_pref_meta === true
  )
  const currentIndustryVertical = prefMetaObj?.industry_vertical
    ? normalizeIndustryVertical(prefMetaObj.industry_vertical)
    : 'Technology, Software & SaaS'

  const currentEducationLevel = prefMetaObj?.education_level
    ? normalizeCandidateEducation(prefMetaObj.education_level)
    : 'Practical Experience & Industry Certifications'

  const currentCertifications = prefMetaObj?.certifications || ''
  const currentEmploymentTypes: string[] =
    Array.isArray(prefMetaObj?.employment_types) &&
    prefMetaObj.employment_types.length > 0
      ? prefMetaObj.employment_types
      : CANDIDATE_EMPLOYMENT_TYPE_OPTIONS.map((o) => o.value)
  const currentAvailability = normalizeCandidateAvailability(prefMetaObj?.availability_window)
  const currentLanguages = normalizeLanguageList(prefMetaObj?.languages, true)

  const hasProfileData = !!profile?.bio

  const AiSection = (
    <div className="bg-white p-6 md:p-8 rounded-2xl border-2 border-slate-300 shadow-sm border-slate-300">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          {hasProfileData
            ? 'Update via Resume (Optional)'
            : 'Step 1: AI Extraction'}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {hasProfileData
            ? 'Upload a new resume to overwrite your current profile with fresh extracted skills, education, certifications, and languages.'
            : 'Upload your resume to instantly generate an anonymous profile using AI.'}
        </p>
      </div>
      <AiResumeScanner profile={profile} />
    </div>
  )

  const FormSection = (
    <form
      action={saveCandidateProfilePreservingMeta}
      className="bg-white p-6 md:p-8 rounded-2xl border-2 border-slate-300 shadow-sm space-y-6 border-slate-300"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-800">
          {hasProfileData ? 'Profile Details' : 'Step 2: Manual Review'}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Review and manually adjust your public anonymous profile, primary industry vertical, education, active certifications, language proficiencies, and vaulted contact details.
        </p>
      </div>

      {/* Private Identity Box (Vaulted behind 2-Stage Unlock) */}
      <div className="p-5 rounded-xl bg-indigo-50/60 border border-indigo-300 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-bold text-indigo-950">
              Full Name{' '}
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider ml-1">
                (Protected by 2-Stage Identity Vault)
              </span>
            </label>
            <p className="text-xs text-indigo-800/80 mt-0.5 mb-3">
              Employers cannot see your name while browsing the talent pool or reviewing protected applications. In Stage 1 (initial thread unlock), only your First Name + Last Initial is shown; your full name and PDF resume are only revealed when you approve Stage 2 Vault Release.
            </p>
            <input
              type="text"
              name="full_name"
              defaultValue={profile?.full_name || profile?.name || ''}
              placeholder="e.g. Jordan Taylor"
              className="block w-full sm:w-2/3 rounded-lg border border-indigo-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium"
            />
          </div>
        </div>
      </div>

      <div className="space-y-8 bg-slate-50 p-6 border-2 border-slate-300 rounded-xl border-slate-300">
        {/* Clean Pointer to Match Preferences & Dealbreakers */}
        <div className="p-4 rounded-xl bg-white border border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div>
            <p className="text-xs font-extrabold text-slate-900">
              Looking for Salary Minimums, Work Model, Employment Types, Target Location, or Availability?
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              This page only captures your professional credentials and capabilities. Configure your search logistics and pitch firewall rules in Match Preferences.
            </p>
          </div>
          <Link
            href="/dashboard/preferences"
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold border border-indigo-200 transition-colors"
          >
            Manage Dealbreakers &rarr;
          </Link>
        </div>

        {/* Row 1: Experience Years + Primary Industry Vertical */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Overall Years of Experience
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Total years of professional experience across your career.
            </p>
            <input
              type="number"
              name="experience_years"
              defaultValue={profile?.experience_years || ''}
              placeholder="e.g. 5"
              className="block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Primary Industry Vertical
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Helps employers filter passive talent and boosts domain expertise scoring.
            </p>
            <select
              name="industry_vertical"
              defaultValue={currentIndustryVertical}
              className="block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium cursor-pointer"
            >
              {STANDARD_INDUSTRY_VERTICALS.map((vertical) => (
                <option key={vertical} value={vertical}>
                  {vertical}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Education & Academic Background + Active Certifications & Licenses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-300">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              🎓 Education &amp; Academic Background
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Practical experience is weighted equally for roles accepting equivalent experience.
            </p>
            <select
              name="education_level"
              defaultValue={currentEducationLevel}
              className="block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium cursor-pointer"
            >
              {CANDIDATE_EDUCATION_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              🏅 Active Certifications &amp; Licenses (Optional)
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Select standardized credentials by industry vertical or search by keyword for exact 5-Point AI Fit Radar matching.
            </p>
            <StructuredCertificationSelector
              name="certifications"
              initialValue={currentCertifications}
              industryVertical={currentIndustryVertical}
            />
          </div>

        </div>

        {/* Row 3: The Structured Language Proficiency Matrix */}
        <StructuredLanguageEditor
          name="languages"
          initialLanguages={currentLanguages}
        />

        {/* The Dynamic Skills Editor */}
        <div className="pt-4 border-t border-slate-300">
          <StructuredSkillEditor initialSkills={visibleStructuredSkills} />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Professional Bio
          </label>
          <p className="text-xs text-slate-500 mb-2">
            A short, third-person summary of your achievements. Keep it anonymous (no names or current company names).
          </p>
          <textarea
            name="bio"
            rows={6}
            defaultValue={profile?.bio || ''}
            placeholder="An experienced professional with a track record of..."
            className="block w-full rounded-md border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3"
            required
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <SubmitButton
          pendingText="Saving Profile..."
          className="w-full sm:w-auto rounded-xl bg-indigo-600 px-8 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          Save Profile Updates
        </SubmitButton>
      </div>
    </form>
  )

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="mb-8">
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
            Anonymous Profile
          </h1>
          <p className="text-slate-500 mt-2">
            Manage your professional credentials, extracted skills, primary industry vertical, education, active certifications, language capabilities, and vaulted contact identity.
          </p>
        </header>

        <div className="space-y-8">
          {hasProfileData ? (
            <>
              {FormSection}
              {AiSection}
            </>
          ) : (
            <>
              {AiSection}
              {FormSection}
            </>
          )}
        </div>
      </div>
    </div>
  )
}