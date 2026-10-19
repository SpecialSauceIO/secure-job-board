'use client'

import { useState, useEffect } from 'react'

export function StructuredSkillEditor({ initialSkills = [] }: { initialSkills?: any[] }) {
  const [skills, setSkills] = useState<{skill: string, years: number | string}[]>([])

  // This ensures the UI instantly updates when the AI finishes scanning the resume
  useEffect(() => {
    if (Array.isArray(initialSkills) && initialSkills.length > 0) {
      setSkills(initialSkills)
    } else if (skills.length === 0) {
      setSkills([{ skill: '', years: '' }])
    }
  }, [initialSkills])

  const addSkill = () => {
    setSkills([...skills, { skill: '', years: '' }])
  }

  const removeSkill = (index: number) => {
    const newSkills = [...skills]
    newSkills.splice(index, 1)
    setSkills(newSkills)
  }

  const updateSkill = (index: number, field: string, value: string) => {
    const newSkills = [...skills]
    // @ts-ignore
    newSkills[index][field] = field === 'years' ? (value === '' ? '' : parseInt(value)) : value
    setSkills(newSkills)
  }

  const cleanSkills = skills.filter(s => s.skill.trim() !== '')

  return (
    <div className="bg-white p-4 rounded-xl border-2 border-slate-300 shadow-sm border-slate-300">
      <label className="block text-sm font-bold text-slate-700 mb-2">Verified Skills & Experience</label>
      <p className="text-xs text-slate-500 mb-4">List your core technical or professional skills and the years of experience you have with each. This structured data ensures perfect alignment with employer requirements.</p>
      
      <div className="space-y-3 mb-4">
        {skills.map((s, i) => (
          <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <input 
              type="text" 
              value={s.skill}
              onChange={(e) => updateSkill(i, 'skill', e.target.value)}
              placeholder="Skill (e.g. React, Agile, Python)" 
              className="flex-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white text-slate-900"
              required
            />
            <div className="relative w-full sm:w-40 shrink-0">
              <input 
                type="number" 
                value={s.years}
                onChange={(e) => updateSkill(i, 'years', e.target.value)}
                placeholder="Years" 
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white text-slate-900"
                required
                min="0"
              />
              <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium pointer-events-none">
                Yrs
              </span>
            </div>
            <button 
              type="button" 
              onClick={() => removeSkill(i)}
              className="text-slate-300 hover:text-red-500 transition-colors p-2 shrink-0 self-end sm:self-auto"
              title="Remove Skill"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        ))}
      </div>
      
      <button 
        type="button" 
        onClick={addSkill}
        className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-3 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
        Add Another Skill
      </button>

      {/* Hidden input securely passes the JSON array to the server action */}
      <input type="hidden" name="structured_skills" value={JSON.stringify(cleanSkills)} />
    </div>
  )
}