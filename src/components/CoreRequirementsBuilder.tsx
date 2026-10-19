'use client'

import { useState } from 'react'

type RequirementItem = {
  skill: string
  level: string
}

export function CoreRequirementsBuilder({ initialData }: { initialData: any }) {
  const parseInitialData = (): RequirementItem[] => {
    if (!initialData) return [{ skill: '', level: 'Intermediate' }]

    let rawArray: any[] = []
    if (Array.isArray(initialData)) {
      rawArray = initialData
    } else if (typeof initialData === 'string') {
      try {
        const parsed = JSON.parse(initialData)
        if (Array.isArray(parsed)) rawArray = parsed
      } catch {
        rawArray = initialData.split(',').map(s => ({ skill: s.trim(), level: 'Intermediate' }))
      }
    }

    const cleaned: RequirementItem[] = rawArray
      .map((item: any) => {
        if (typeof item === 'string') {
          return { skill: item.trim(), level: 'Intermediate' }
        }
        if (item && typeof item === 'object') {
          const skillName = item.skill || item.name || ''
          const levelName = item.level || 'Intermediate'
          return {
            skill: typeof skillName === 'string' ? skillName.trim() : '',
            level: ['Beginner', 'Intermediate', 'Expert'].includes(levelName) ? levelName : 'Intermediate',
          }
        }
        return { skill: '', level: 'Intermediate' }
      })
      .filter(r => r.skill.length > 0 && r.skill !== '[object Object]')

    return cleaned.length > 0 ? cleaned : [{ skill: '', level: 'Intermediate' }]
  }

  const [requirements, setRequirements] = useState<RequirementItem[]>(parseInitialData)

  const handleAddSkill = () => {
    setRequirements(prev => [...prev, { skill: '', level: 'Intermediate' }])
  }

  const handleRemoveSkill = (index: number) => {
    if (requirements.length <= 1) {
      setRequirements([{ skill: '', level: 'Intermediate' }])
      return
    }
    setRequirements(prev => prev.filter((_, i) => i !== index))
  }

  const handleChange = (index: number, field: keyof RequirementItem, value: string) => {
    setRequirements(prev =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  const serializedRequirements = JSON.stringify(
    requirements
      .map(r => ({ skill: r.skill.trim(), level: r.level }))
      .filter(r => r.skill.length > 0)
  )

  return (
    <div className="rounded-xl bg-white p-6 border-2 border-2-slate-200 shadow-sm border-slate-300">
      <h3 className="text-sm font-bold text-slate-800">Core Requirements</h3>
      <p className="text-xs text-slate-500 mt-1 mb-4">
        List the critical technical skills needed for this role. This powers the instant AI matching algorithm.
      </p>

      <input type="hidden" name="structured_requirements" value={serializedRequirements} />

      <div className="space-y-3">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-3">
            <input
              type="text"
              value={req.skill}
              onChange={(e) => handleChange(index, 'skill', e.target.value)}
              placeholder="e.g. React, Agile, Node.js"
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <select
              value={req.level}
              onChange={(e) => handleChange(index, 'level', e.target.value)}
              className="w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Expert">Expert</option>
            </select>

            <button
              type="button"
              onClick={() => handleRemoveSkill(index)}
              className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
              title="Remove Skill"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddSkill}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Another Skill
      </button>
    </div>
  )
}