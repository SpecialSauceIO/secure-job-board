'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SubmitButton } from '@/components/SubmitButton'
import UsLocationSelector from '@/components/UsLocationSelector'
import { CANDIDATE_AVAILABILITY_STATUSES } from '@/constants/availability'

interface EmploymentTypeOption {
  value: string
  label: string
  desc: string
}

interface CandidatePreferencesFormProps {
  action: (formData: FormData) => void | Promise<void>
  isVerified: boolean
  initialMinSalary: string
  initialEmploymentTypes: string[]
  employmentTypeOptions: EmploymentTypeOption[]
  initialWorkModel: string
  initialAvailabilityWindow: string
  initialLocation: string
  hiddenExperienceYears: string
  hiddenBio: string
  hiddenStructuredSkillsJson: string
}

export default function CandidatePreferencesForm({
  action,
  isVerified,
  initialMinSalary,
  initialEmploymentTypes,
  employmentTypeOptions,
  initialWorkModel,
  initialAvailabilityWindow,
  initialLocation,
  hiddenExperienceYears,
  hiddenBio,
  hiddenStructuredSkillsJson,
}: CandidatePreferencesFormProps) {
  const [minSalary, setMinSalary] = useState(initialMinSalary)
  const [selectedEmpTypes, setSelectedEmpTypes] = useState<string[]>(
    initialEmploymentTypes
  )
  const [workModel, setWorkModel] = useState(initialWorkModel || 'remote')
  const [availabilityWindow, setAvailabilityWindow] = useState(
    initialAvailabilityWindow
  )
  const [location, setLocation] = useState(initialLocation || '')

  useEffect(() => {
    setMinSalary(initialMinSalary)
  }, [initialMinSalary])

  useEffect(() => {
    setSelectedEmpTypes(initialEmploymentTypes)
  }, [initialEmploymentTypes])

  useEffect(() => {
    setWorkModel(initialWorkModel || 'remote')
  }, [initialWorkModel])

  useEffect(() => {
    setAvailabilityWindow(initialAvailabilityWindow)
  }, [initialAvailabilityWindow])

  useEffect(() => {
    setLocation(initialLocation || '')
  }, [initialLocation])

  const toggleEmploymentType = (val: string) => {
    setSelectedEmpTypes((prev) => {
      if (prev.includes(val)) {
        if (prev.length <= 1) return prev
        return prev.filter((item) => item !== val)
      }
      return [...prev, val]
    })
  }

  const isPausedStatus = availabilityWindow.startsWith('Paused')

  return (
    <form
      action={action}
      className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl border-2 border-slate-300 shadow-sm space-y-6"
    >
      <input type="hidden" name="experience_years" value={hiddenExperienceYears} />
      <input type="hidden" name="bio" value={hiddenBio} />
      <input
        type="hidden"
        name="structured_skills"
        value={hiddenStructuredSkillsJson}
      />

      <div
        className={
          !isVerified
            ? 'opacity-45 pointer-events-none select-none grayscale space-y-6'
            : 'space-y-6'
        }
      >
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
              min={0}
              step={1000}
              name="min_salary_expectation"
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              placeholder="95000"
              className="block w-full rounded-lg border border-slate-300 bg-white pl-8 pr-16 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm font-bold"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
              <span className="text-xs font-extrabold text-slate-400">
                USD /yr
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Employers whose role maximum budget (annual or annualized hourly rate) falls below this floor are blocked from sending you inbound invitations.
          </p>
        </div>

        {/* 2. ACCEPTED EMPLOYMENT TYPES (DEALBREAKER) */}
        <div className="pt-2 border-t border-slate-300">
          <label className="block text-sm font-bold text-slate-700">
            Accepted Employment Types (Dealbreaker)
          </label>
          <p className="text-xs text-slate-500 mt-0.5 mb-3">
            Select all employment arrangements you accept. At least one option stays active so roles outside your selection are blocked automatically.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {employmentTypeOptions.map((opt) => {
              const isChecked = selectedEmpTypes.includes(opt.value)
              return (
                <label
                  key={opt.value}
                  className={`relative flex items-start gap-3 p-3.5 rounded-xl border-2 transition-colors cursor-pointer ${
                    isChecked
                      ? 'border-indigo-300 bg-indigo-50/40'
                      : 'border-slate-300 bg-slate-50/60 hover:bg-indigo-50/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    name="employment_types"
                    value={opt.value}
                    checked={isChecked}
                    onChange={() => toggleEmploymentType(opt.value)}
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

        {/* 3. PREFERRED WORK MODEL & SEARCH AVAILABILITY */}
        <div className="pt-2 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700">
              Preferred Work Model (Dealbreaker)
            </label>
            <p className="text-xs text-slate-500 mt-0.5 mb-2">
              Controls which work arrangements verified employers are permitted to send you.
            </p>
            <select
              name="preferred_work_model"
              value={workModel}
              onChange={(e) => setWorkModel(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium cursor-pointer"
            >
              <option value="remote">Remote Only</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
              <option value="any">Open to Any Model</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700">
              ⚡ Search Status &amp; Start Availability
            </label>
            <p className="text-xs text-slate-500 mt-0.5 mb-2">
              Signals your notice period to verified employers or pauses inbound invitations.
            </p>
            <select
              name="availability_window"
              value={availabilityWindow}
              onChange={(e) => setAvailabilityWindow(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium cursor-pointer"
            >
              {CANDIDATE_AVAILABILITY_STATUSES.map((statusOpt) => (
                <option key={statusOpt} value={statusOpt}>
                  {statusOpt}
                </option>
              ))}
            </select>
            {isPausedStatus && (
              <p className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mt-2">
                Inbound employer invitations are paused while this status is active.
              </p>
            )}
          </div>
        </div>

        {/* 4. US CASCADING LOCATION SELECTOR */}
        <div className="pt-2 border-t border-slate-300">
          <label className="block text-sm font-bold text-slate-700 mb-1">
            Target Work Location
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Select your preferred US state and metro area for hybrid or on-site roles, or choose US Remote alignment when set to Remote Only.
          </p>
          <UsLocationSelector
            name="location"
            value={location}
            onChange={(val) => setLocation(val)}
            workModel={workModel}
            allowRemoteOption={workModel === 'remote' || workModel === 'any'}
          />
        </div>

        {/* Clean Pointer to Professional Profile */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold text-slate-900">
              Looking for Industry Vertical, Education, Certifications, Languages, or Core Skills?
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Your professional capabilities and credentials live exclusively on your Anonymous Profile so you never have to maintain duplicate fields.
            </p>
          </div>
          <Link
            href="/dashboard/profile"
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold border border-indigo-200 transition-colors"
          >
            Edit My Profile &rarr;
          </Link>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <SubmitButton
          disabled={!isVerified}
          pendingText="Saving Preferences..."
          className="w-full sm:w-auto rounded-xl bg-indigo-600 px-8 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          Save Match Preferences
        </SubmitButton>
      </div>
    </form>
  )
}