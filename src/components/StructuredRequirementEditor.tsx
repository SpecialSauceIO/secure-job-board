'use client'

import { useState, useEffect } from 'react'

export function StructuredRequirementEditor({ initialRequirements = [] }: { initialRequirements?: any[] }) {
  // Use state to manage the rows internally
  const [requirements, setRequirements] = useState<{skill: string, level: string}[]>([])

  // CRITICAL FIX: This hook listens for when the AI finishes scanning and updates the rows!
  useEffect(() => {
    if (Array.isArray(initialRequirements) && initialRequirements.length > 0) {
      setRequirements(initialRequirements)
    } else if (requirements.length === 0) {
      // Only set a blank default row if we have literally nothing
      setRequirements([{ skill: '', level: 'Intermediate' }])
    }
  }, [initialRequirements])

  const addRequirement = () => {
    setRequirements([...requirements, { skill: '', level: 'Intermediate' }])
  }

  const removeRequirement = (index: number) => {
    const newReqs = [...requirements]
    newReqs.splice(index, 1)
    setRequirements(newReqs)
  }

  const updateRequirement = (index: number, field: string, value: string) => {
    const newReqs = [...requirements]
    // @ts-ignore - dynamic key assignment
    newReqs[index][field] = value
    setRequirements(newReqs)
  }

  const cleanRequirements = requirements.filter(r => r.skill.trim() !== '')

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mt-6">
      <label className="block text-sm font-bold text-slate-700 mb-2">Core Requirements</label>
      <p className="text-xs text-slate-500 mb-4">List the critical technical skills needed for this role. This powers the instant AI matching algorithm.</p>
      
      <div className="space-y-3 mb-4">
        {requirements.map((r, i) => (
          <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <input 
              type="text" 
              value={r.skill}
              onChange={(e) => updateRequirement(i, 'skill', e.target.value)}
              placeholder="e.g. React, Agile, Node.js" 
              className="flex-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white text-slate-900"
              required
            />
            <div className="relative w-full sm:w-40 shrink-0">
              <select 
                value={r.level}
                onChange={(e) => updateRequirement(i, 'level', e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white text-slate-900"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
            <button 
              type="button" 
              onClick={() => removeRequirement(i)}
              className="text-slate-300 hover:text-red-500 transition-colors p-2 shrink-0 self-end sm:self-auto"
              title="Remove Requirement"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        ))}
      </div>
      
      <button 
        type="button" 
        onClick={addRequirement}
        className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-3 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
        Add Another Skill
      </button>

      {/* Hidden input securely passes the JSON array to the server action */}
      <input type="hidden" name="structured_requirements" value={JSON.stringify(cleanRequirements)} />
    </div>
  )
}