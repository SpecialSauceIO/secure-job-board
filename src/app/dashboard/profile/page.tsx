import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AiResumeScanner from '@/components/AiResumeScanner'
import { SubmitButton } from '@/components/SubmitButton'
import { StructuredSkillEditor } from '@/components/StructuredSkillEditor'
import UsLocationSelector from '@/components/UsLocationSelector'
import { updateProfile } from '@/app/dashboard/actions'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'employer') redirect('/dashboard')

  const visibleStructuredSkills = Array.isArray(profile?.structured_skills)
    ? profile.structured_skills.filter(
        (s: any) => s && typeof s === 'object' && !s._ss_meta && s.skill
      )
    : []

  const hasProfileData = !!(profile?.bio)

  const AiSection = (
    <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          {hasProfileData ? 'Update via Resume (Optional)' : 'Step 1: AI Extraction'}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {hasProfileData 
            ? 'Upload a new resume to overwrite your current profile with fresh extracted data.' 
            : 'Upload your resume to instantly generate an anonymous profile using AI.'}
        </p>
      </div>
      <AiResumeScanner profile={profile} />
    </div>
  )

  const FormSection = (
    <form action={updateProfile} className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">
          {hasProfileData ? 'Profile Details' : 'Step 2: Manual Review'}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Review and manually adjust your public anonymous profile, location, and private unlock details.
        </p>
      </div>

      {/* Private Identity Box (Hidden until unlocked) */}
      <div className="p-5 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-bold text-indigo-950">
              Full Name <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider ml-1">(Kept Hidden Until Unlocked)</span>
            </label>
            <p className="text-xs text-indigo-800/80 mt-0.5 mb-3">
              Employers cannot see your name while browsing the talent pool or reviewing blind applications. It is only revealed when an employer unlocks your application or when you accept an employer&apos;s pitch.
            </p>
            <input
              type="text"
              name="full_name"
              defaultValue={profile?.full_name || profile?.name || ''}
              placeholder="e.g. Jordan Taylor"
              className="block w-full sm:w-2/3 rounded-lg border border-indigo-200 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium"
            />
          </div>
        </div>
      </div>

      <div className="space-y-8 bg-slate-50 p-6 border border-slate-100 rounded-xl">
        {/* US Cascading Location Selector */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Target Work Location</label>
          <p className="text-xs text-slate-500 mb-3">Select your preferred US state and metro area for hybrid/on-site roles or remote search alignment.</p>
          <UsLocationSelector
            name="location"
            value={profile?.location || ''}
            workModel={profile?.preferred_work_model || 'remote'}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Overall Years of Experience</label>
          <input 
            type="number" 
            name="experience_years" 
            defaultValue={profile?.experience_years || ''} 
            placeholder="e.g. 5" 
            className="block w-full sm:w-1/3 rounded-md border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3" 
            required
          />
        </div>

        {/* The Dynamic Skills Editor */}
        <StructuredSkillEditor initialSkills={visibleStructuredSkills} />

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Professional Bio</label>
          <p className="text-xs text-slate-500 mb-2">A short, third-person summary of your achievements. Keep it anonymous (no names or current company names).</p>
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
        <SubmitButton pendingText="Saving Profile..." className="rounded-md bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors">
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Candidate Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Anonymous Profile</h1>
          <p className="text-slate-500 mt-2">Manage your extracted skills, target location, anonymous bio, and private contact identity.</p>
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