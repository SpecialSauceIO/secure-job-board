import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createJob } from '../actions'
import { SubmitButton } from '@/components/SubmitButton'
import Link from 'next/link'

export default async function PostJobPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (profile?.role !== 'employer') redirect('/dashboard')

  return (
    <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Post a New Role
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Create a protected posting to attract unbiased talent.
          </p>
        </div>
        <Link 
          href="/dashboard" 
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <form action={createJob} className="space-y-6">
        <div className="space-y-4 rounded-lg bg-gray-50 p-6 border border-slate-300">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Job Title
            </label>
            <input 
              type="text" 
              name="title" 
              required 
              placeholder="e.g. Senior Frontend Developer" 
              className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Job Description
            </label>
            <p className="text-xs text-gray-500 mb-2 mt-1">
              Focus on responsibilities and required skills. Do not include your company name.
            </p>
            <textarea 
              name="description" 
              rows={5} 
              required 
              placeholder="We are looking for..." 
              className="block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3" 
            />
          </div>
        </div>

        <div className="space-y-4 rounded-lg bg-white p-6 border border-slate-300 shadow-sm">
          <h3 className="text-md font-semibold text-gray-900 border-b pb-2 border-slate-300">
            Targeting Details
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Industry
              </label>
              <input 
                type="text" 
                name="industry" 
                placeholder="e.g. Fintech, Healthcare" 
                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Work Model
              </label>
              <select 
                name="workModel" 
                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
              >
                <option value="On-Site">On-Site</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Minimum Salary (USD)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input 
                  type="number" 
                  name="minSalary" 
                  placeholder="80000" 
                  className="block w-full rounded-md border-gray-300 bg-white text-gray-900 pl-7 pr-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Maximum Salary (USD)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input 
                  type="number" 
                  name="maxSalary" 
                  placeholder="120000" 
                  className="block w-full rounded-md border-gray-300 bg-white text-gray-900 pl-7 pr-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-indigo-50 p-6 border border-indigo-300 flex items-start gap-4">
          <div className="flex h-6 items-center">
            <input 
              type="checkbox" 
              name="aiReview" 
              id="aiReview" 
              defaultChecked 
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" 
            />
          </div>
          <div>
            <label htmlFor="aiReview" className="font-medium text-indigo-900">
              Enable AI Application Screening
            </label>
            <p className="text-sm text-indigo-700 mt-1">
              Our AI will automatically score incoming protected resumes against your job description to highlight the best matches.
            </p>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Link 
            href="/dashboard" 
            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <SubmitButton 
            pendingText="Publishing..." 
            className="rounded-md bg-indigo-600 px-8 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-500"
          >
            Publish Job
          </SubmitButton>
        </div>
      </form>
    </div>
  )
}