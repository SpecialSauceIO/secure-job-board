'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function CandidatePreferencesForm({ profile }: { profile: any }) {
  const router = useRouter()
  const supabase = createClient()
  
  // Initialize state with the user's existing database values
  const [isDiscoverable, setIsDiscoverable] = useState(profile?.is_discoverable ?? true)
  const [minSalary, setMinSalary] = useState(profile?.min_salary_expectation?.toString() || '')
  const [workModel, setWorkModel] = useState(profile?.preferred_work_model || 'any')
  
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setStatusMessage(null)

    // Clean the salary input to ensure it's a valid integer
    const cleanedSalary = parseInt(minSalary.replace(/[^0-9]/g, '')) || 0

    const { error } = await supabase
      .from('profiles')
      .update({
        is_discoverable: isDiscoverable,
        min_salary_expectation: cleanedSalary,
        preferred_work_model: workModel
      })
      .eq('id', profile.id)

    setIsSaving(false)

    if (error) {
      setStatusMessage({ type: 'error', text: 'Failed to update preferences. Please try again.' })
    } else {
      setStatusMessage({ type: 'success', text: 'Dealbreakers successfully locked in.' })
      router.refresh()
      
      // Clear success message after 3 seconds
      setTimeout(() => setStatusMessage(null), 3000)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      
      {/* Discoverability Toggle Card */}
      <div className={`p-6 rounded-2xl border transition-colors ${isDiscoverable ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-300'}`}>
        <div className="flex items-start justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Profile Visibility</h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              When enabled, verified employers can view your anonymous skills matrix and send you connection requests for relevant roles. Your name and contact info remain hidden until you explicitly accept a request.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={isDiscoverable}
              onChange={() => setIsDiscoverable(!isDiscoverable)}
            />
            <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Minimum Salary Card */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-sm border-slate-300">
          <label className="block text-lg font-bold text-slate-900 mb-1">Minimum Salary</label>
          <p className="text-sm text-slate-500 mb-4">Employers offering below this amount will be blocked from messaging you.</p>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-slate-500 font-bold">$</span>
            </div>
            <input
              type="text"
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              placeholder="120000"
              className="block w-full rounded-xl border-2 border-slate-300 bg-white pl-8 pr-4 py-3 text-slate-900 font-medium placeholder:text-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm border-slate-300"
            />
          </div>
        </div>

        {/* Work Model Card */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-sm border-slate-300">
          <label className="block text-lg font-bold text-slate-900 mb-1">Work Model</label>
          <p className="text-sm text-slate-500 mb-4">Block roles that require an incompatible daily commute.</p>
          <select
            value={workModel}
            onChange={(e) => setWorkModel(e.target.value)}
            className="block w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-slate-900 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm cursor-pointer border-slate-300"
          >
            <option value="any">Open to Any Model</option>
            <option value="remote">Remote Only</option>
            <option value="hybrid">Hybrid Allowed</option>
            <option value="onsite">On-site Allowed</option>
          </select>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex-1">
          {statusMessage && (
            <span className={`text-sm font-bold flex items-center gap-2 ${statusMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {statusMessage.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              )}
              {statusMessage.text}
            </span>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isSaving}
          className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-indigo-600 focus:ring-4 focus:ring-indigo-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? 'Locking in...' : 'Save Preferences'}
        </button>
      </div>
    </form>
  )
}