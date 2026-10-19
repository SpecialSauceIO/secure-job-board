'use client'

import { useState, useEffect } from 'react'

export interface RequirementRow {
  skill: string
  level: string
  years?: number
}

const MIN_REQUIRED_SKILLS = 3

const DEFAULT_THREE_ROWS: RequirementRow[] = [
  { skill: '', level: 'Intermediate', years: 2 },
  { skill: '', level: 'Intermediate', years: 2 },
  { skill: '', level: 'Beginner', years: 1 },
]

export function StructuredRequirementEditor({
  initialRequirements = [],
}: {
  initialRequirements?: any[]
}) {
  const [requirements, setRequirements] = useState<RequirementRow[]>(DEFAULT_THREE_ROWS)

  useEffect(() => {
    if (Array.isArray(initialRequirements) && initialRequirements.length > 0) {
      const normalized = initialRequirements.map((r: any) => ({
        skill: typeof r === 'string' ? r : r?.skill || r?.name || '',
        level: r?.level || 'Intermediate',
        years:
          typeof r?.years === 'number' && !Number.isNaN(r.years)
            ? r.years
            : r?.level === 'Expert'
            ? 5
            : r?.level === 'Beginner'
            ? 1
            : 2,
      }))
      while (normalized.length < MIN_REQUIRED_SKILLS) {
        normalized.push({ skill: '', level: 'Intermediate', years: 2 })
      }
      setRequirements(normalized)
    }
  }, [initialRequirements])

  const addRequirement = () => {
    setRequirements([
      ...requirements,
      { skill: '', level: 'Intermediate', years: 2 },
    ])
  }

  const removeRequirement = (index: number) => {
    if (requirements.length <= MIN_REQUIRED_SKILLS) {
      const cleared = [...requirements]
      cleared[index] = { skill: '', level: 'Intermediate', years: 2 }
      setRequirements(cleared)
      return
    }
    const newReqs = [...requirements]
    newReqs.splice(index, 1)
    setRequirements(newReqs)
  }

  const updateRequirement = (
    index: number,
    field: keyof RequirementRow,
    value: string | number
  ) => {
    const newReqs = [...requirements]
    newReqs[index] = {
      ...newReqs[index],
      [field]: value,
    }
    setRequirements(newReqs)
  }

  const cleanRequirements = requirements.filter((r) => r.skill.trim() !== '')
  const filledCount = cleanRequirements.length
  const meetsMinimum = filledCount >= MIN_REQUIRED_SKILLS

  return (
    <div className="bg-white p-5 rounded-xl border-2 border-2-slate-200 shadow-xs mt-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-300 pb-3">
        <div>
          <label className="block text-sm font-extrabold text-slate-800">
            Core Role Competencies &amp; Skill Tenure Matrix <span className="text-rose-500">*</span>
          </label>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter at least <strong>{MIN_REQUIRED_SKILLS} core skills</strong> (technical, operational, or domain competencies) to power the 5-Point AI Fit Radar.
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold shrink-0 border ${
            meetsMinimum
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-amber-50 text-amber-800 border-amber-300'
          }`}
        >
          {meetsMinimum
            ? `✓ ${filledCount} Core Skills Added`
            : `${filledCount} of ${MIN_REQUIRED_SKILLS} Minimum Skills Added`}
        </span>
      </div>

      {!meetsMinimum && (
        <div className="rounded-lg bg-amber-50/80 border border-amber-300 px-3.5 py-2.5 text-xs text-amber-900 flex items-center gap-2">
          <span className="font-black text-amber-600">ⓘ</span>
          <span>
            <strong>Minimum {MIN_REQUIRED_SKILLS} Skills Required:</strong> Please fill in at least {MIN_REQUIRED_SKILLS} core skills below before publishing or saving this role ({MIN_REQUIRED_SKILLS - filledCount} more needed).
          </span>
        </div>
      )}

      <div className="space-y-3">
        {requirements.map((r, i) => {
          const isRowRequired = !meetsMinimum && i < MIN_REQUIRED_SKILLS
          return (
            <div
              key={i}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 animate-in fade-in duration-200"
            >
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs font-extrabold text-slate-400 w-5 text-right shrink-0">
                  {i + 1}.
                </span>
                <input
                  type="text"
                  value={r.skill}
                  onChange={(e) => updateRequirement(i, 'skill', e.target.value)}
                  placeholder={
                    i === 0
                      ? 'e.g., Project Management, React, or Customer Enablement (Required)'
                      : i < MIN_REQUIRED_SKILLS
                      ? `Core Skill #${i + 1} (Required)`
                      : 'Additional skill (Optional)'
                  }
                  className="flex-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500 bg-white text-slate-900"
                  required={isRowRequired}
                />
              </div>

              <div className="flex items-center gap-2 sm:w-auto pl-7 sm:pl-0">
                <select
                  value={r.level}
                  onChange={(e) => updateRequirement(i, 'level', e.target.value)}
                  className="w-full sm:w-36 rounded-lg border border-slate-300 px-2.5 py-2 text-xs sm:text-sm font-semibold shadow-xs focus:border-indigo-500 focus:ring-indigo-500 bg-white text-slate-900"
                  title="Required Proficiency Level"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Expert">Expert</option>
                </select>

                <select
                  value={r.years ?? 2}
                  onChange={(e) =>
                    updateRequirement(i, 'years', parseInt(e.target.value, 10) || 1)
                  }
                  className="w-full sm:w-28 rounded-lg border border-slate-300 px-2.5 py-2 text-xs sm:text-sm font-semibold shadow-xs focus:border-indigo-500 focus:ring-indigo-500 bg-white text-slate-900"
                  title="Target Years in Skill"
                >
                  <option value={0}>&lt; 1 yr</option>
                  <option value={1}>1+ yr</option>
                  <option value={2}>2+ yrs</option>
                  <option value={3}>3+ yrs</option>
                  <option value={5}>5+ yrs</option>
                  <option value={7}>7+ yrs</option>
                  <option value={10}>10+ yrs</option>
                </select>

                <button
                  type="button"
                  onClick={() => removeRequirement(i)}
                  className="text-slate-300 hover:text-rose-500 transition-colors p-2 shrink-0 cursor-pointer"
                  title={
                    requirements.length <= MIN_REQUIRED_SKILLS
                      ? 'Clear Skill Row'
                      : 'Remove Skill Row'
                  }
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={addRequirement}
          className="text-xs sm:text-sm font-extrabold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 transition-colors cursor-pointer"
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
              strokeWidth="3"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Another Skill Row
        </button>

        <span className="text-[11px] text-slate-400 font-medium">
          Blank optional rows are ignored automatically when saving
        </span>
      </div>

      <input
        type="hidden"
        name="structured_requirements"
        value={JSON.stringify(cleanRequirements)}
      />
    </div>
  )
}
