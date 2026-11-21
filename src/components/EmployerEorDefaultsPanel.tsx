'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  OrganizationEorConfig,
  EorContractTrack,
  EOR_CONTRACT_TRACK_OPTIONS,
  EOR_EQUIPMENT_POLICY_OPTIONS,
  DEFAULT_ORG_EOR_CONFIG,
} from '@/lib/eor-config'
import {
  getOrganizationEorSettings,
  saveOrganizationEorSettings,
} from '@/app/dashboard/eor-actions'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]

export default function EmployerEorDefaultsPanel() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasSavedDefaults, setHasSavedDefaults] = useState(false)
  const [config, setConfig] = useState<OrganizationEorConfig>({
    ...DEFAULT_ORG_EOR_CONFIG,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    let mounted = true
    getOrganizationEorSettings().then((res) => {
      if (!mounted) return
      if (res && !res.error && res.config) {
        setConfig(res.config)
        setHasSavedDefaults(Boolean(res.hasSavedDefaults))
      }
      setIsLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [])

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSaving(true)
    setFeedback(null)

    const fd = new FormData()
    fd.set('defaultContractTrack', config.defaultContractTrack)
    fd.set('defaultDurationMonths', String(config.defaultDurationMonths))
    fd.set('defaultBgCheck', config.defaultBgCheck ? 'true' : 'false')
    fd.set('defaultDrugCheck', config.defaultDrugCheck ? 'true' : 'false')
    fd.set('defaultEquipmentPolicy', config.defaultEquipmentPolicy)
    fd.set('defaultEquipmentNotes', config.defaultEquipmentNotes)
    fd.set('legalEntityName', config.legalEntityName)
    fd.set('timecardApproverName', config.timecardApproverName)
    fd.set('timecardApproverEmail', config.timecardApproverEmail)
    fd.set('billingApEmail', config.billingApEmail)
    fd.set('defaultSupervisorName', config.defaultSupervisorName)
    fd.set('defaultPoNumber', config.defaultPoNumber)
    fd.set('billingStreet1', config.billingStreet1)
    fd.set('billingCity', config.billingCity)
    fd.set('billingState', config.billingState)
    fd.set('billingZip', config.billingZip)
    fd.set('defaultWcCode', config.defaultWcCode)
    fd.set('diffWorksite', config.diffWorksite ? 'true' : 'false')
    fd.set('worksiteStreet1', config.worksiteStreet1)
    fd.set('worksiteCity', config.worksiteCity)
    fd.set('worksiteState', config.worksiteState)
    fd.set('worksiteZip', config.worksiteZip)

    const res = await saveOrganizationEorSettings(fd)
    setIsSaving(false)

    if (res?.error) {
      setFeedback({ type: 'error', text: res.error })
      return
    }

    if (res?.config) {
      setConfig(res.config)
    }
    setHasSavedDefaults(true)
    setFeedback({
      type: 'success',
      text: 'Organization W-2 payroll defaults saved. New Protected Roles will inherit these defaults automatically.',
    })
  }

  return (
    <section className="rounded-2xl bg-white border-2 border-slate-300 shadow-sm overflow-hidden">
      <div className="px-5 sm:px-6 py-4 bg-slate-50 border-b border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Built-In W-2 Employer of Record (EOR) &amp; Payroll Defaults
            </h2>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                hasSavedDefaults
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              {hasSavedDefaults ? 'Saved Organization Defaults' : 'Standard Defaults'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Configure your default W-2 Employer of Record track (Contract-to-Hire, Limited W-2, or Indefinite W-2), screening rules, equipment policy, and Net-30 billing contacts once. Every new Protected Role inherits these defaults automatically • <Link href="/dashboard/w2-hiring" className="text-indigo-700 underline hover:text-indigo-900 font-bold">View 4 Hiring Paths Flowchart →</Link>
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-6 text-sm text-slate-500 font-medium">
          Loading W-2 payroll defaults...
        </div>
      ) : (
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Default W-2 Contract Track
              </label>
              <select
                value={config.defaultContractTrack}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    defaultContractTrack: e.target.value as EorContractTrack,
                  })
                }
                className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 text-sm font-medium cursor-pointer"
              >
                {EOR_CONTRACT_TRACK_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Default Equipment &amp; Device Policy
              </label>
              <select
                value={config.defaultEquipmentPolicy}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    defaultEquipmentPolicy: e.target.value,
                  })
                }
                className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 text-sm font-medium cursor-pointer"
              >
                {EOR_EQUIPMENT_POLICY_OPTIONS.map((policy) => (
                  <option key={policy} value={policy}>
                    {policy}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(config.defaultContractTrack === 'fixed_term_w2' || config.defaultContractTrack === 'trial_to_hire_90d') && (
            <div className="max-w-xs">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                {config.defaultContractTrack === 'trial_to_hire_90d' ? 'Default Ramp-Up / Contract Period' : 'Default Initial Fixed-Term Length'}
              </label>
              <select
                value={config.defaultDurationMonths}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    defaultDurationMonths: Number(e.target.value) || 6,
                  })
                }
                className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm font-medium cursor-pointer"
              >
                <option value={1}>1 Month / 30 Days ($0 Conversion or Extend Anytime)</option>
                <option value={2}>2 Months / 60 Days ($0 Conversion or Extend Anytime)</option>
                <option value={3}>3 Months / 90 Days ($0 Conversion or Extend Anytime)</option>
                <option value={6}>6 Months / 180 Days ($0 Conversion or Extend Anytime)</option>
                <option value={9}>9 Months ($0 Conversion or Extend Anytime)</option>
                <option value={12}>12 Months ($0 Conversion or Extend Anytime)</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="flex items-start gap-2.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.defaultBgCheck}
                onChange={(e) =>
                  setConfig({ ...config, defaultBgCheck: e.target.checked })
                }
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-700 leading-snug">
                <strong className="font-extrabold text-slate-900 block">
                  Require Background Check by Default
                </strong>
                Completed through W-2 Payroll onboarding prior to start date.
              </span>
            </label>

            <label className="flex items-start gap-2.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.defaultDrugCheck}
                onChange={(e) =>
                  setConfig({ ...config, defaultDrugCheck: e.target.checked })
                }
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-700 leading-snug">
                <strong className="font-extrabold text-slate-900 block">
                  Require Drug Screen by Default
                </strong>
                Standard panel screening coordinated before Day 1 onboarding.
              </span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Default Equipment &amp; Access Notes (Optional)
            </label>
            <input
              type="text"
              maxLength={240}
              value={config.defaultEquipmentNotes}
              onChange={(e) =>
                setConfig({ ...config, defaultEquipmentNotes: e.target.value })
              }
              placeholder="e.g., Ship company MacBook + YubiKey 5 business days before start date"
              className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
            />
          </div>

          <div className="rounded-xl bg-indigo-50/60 border border-indigo-200 p-4 space-y-3">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-950">
                Payroll &amp; Timecard Contacts (Used for W-2 Placement Dispatch)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Saved once so our W-2 Payroll team knows who approves weekly hours and receives consolidated invoices when a Professional accepts W-2 terms.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Timecard Approver Name
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={config.timecardApproverName}
                  onChange={(e) =>
                    setConfig({ ...config, timecardApproverName: e.target.value })
                  }
                  placeholder="Jane Doe"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Timecard Approver Email
                </label>
                <input
                  type="email"
                  maxLength={160}
                  value={config.timecardApproverEmail}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      timecardApproverEmail: e.target.value,
                    })
                  }
                  placeholder="manager@company.com"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Billing / AP Email
                </label>
                <input
                  type="email"
                  maxLength={160}
                  value={config.billingApEmail}
                  onChange={(e) =>
                    setConfig({ ...config, billingApEmail: e.target.value })
                  }
                  placeholder="ap@company.com"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700">
                  Exact Legal Entity Name (Not DBA)
                </label>
                <input
                  type="text"
                  maxLength={128}
                  value={config.legalEntityName}
                  onChange={(e) =>
                    setConfig({ ...config, legalEntityName: e.target.value })
                  }
                  placeholder="Acme Solutions LLC"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Day-to-Day Supervisor (Optional)
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={config.defaultSupervisorName}
                  onChange={(e) =>
                    setConfig({ ...config, defaultSupervisorName: e.target.value })
                  }
                  placeholder="Defaults to Approver"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Default PO #
                  </label>
                  <input
                    type="text"
                    maxLength={64}
                    value={config.defaultPoNumber}
                    onChange={(e) =>
                      setConfig({ ...config, defaultPoNumber: e.target.value })
                    }
                    placeholder="Optional"
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    WC Code
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={config.defaultWcCode}
                    onChange={(e) =>
                      setConfig({ ...config, defaultWcCode: e.target.value })
                    }
                    placeholder="8810"
                    title="Workers Comp Code (default 8810 Clerical/Tech)"
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-2.5 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700">
                  Company Billing Street
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={config.billingStreet1}
                  onChange={(e) =>
                    setConfig({ ...config, billingStreet1: e.target.value })
                  }
                  placeholder="100 Main St, Suite 200"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Billing City
                </label>
                <input
                  type="text"
                  maxLength={80}
                  value={config.billingCity}
                  onChange={(e) =>
                    setConfig({ ...config, billingCity: e.target.value })
                  }
                  placeholder="Austin"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    State
                  </label>
                  <select
                    value={config.billingState}
                    onChange={(e) =>
                      setConfig({ ...config, billingState: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-2 text-sm"
                  >
                    <option value="">Select</option>
                    {US_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    ZIP
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={config.billingZip}
                    onChange={(e) =>
                      setConfig({ ...config, billingZip: e.target.value })
                    }
                    placeholder="78701"
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-2.5 text-sm"
                  />
                </div>
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={config.diffWorksite}
                onChange={(e) =>
                  setConfig({ ...config, diffWorksite: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              On-site or hybrid physical worksite address differs from company billing address
            </label>

            {config.diffWorksite && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Physical Worksite Street
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={config.worksiteStreet1}
                    onChange={(e) =>
                      setConfig({ ...config, worksiteStreet1: e.target.value })
                    }
                    placeholder="500 Congress Ave"
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Worksite City
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    value={config.worksiteCity}
                    onChange={(e) =>
                      setConfig({ ...config, worksiteCity: e.target.value })
                    }
                    placeholder="Austin"
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      State
                    </label>
                    <select
                      value={config.worksiteState}
                      onChange={(e) =>
                        setConfig({ ...config, worksiteState: e.target.value })
                      }
                      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-2 text-sm"
                    >
                      <option value="">Select</option>
                      {US_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      ZIP
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={config.worksiteZip}
                      onChange={(e) =>
                        setConfig({ ...config, worksiteZip: e.target.value })
                      }
                      placeholder="78701"
                      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {feedback && (
            <div
              className={`rounded-xl px-4 py-3 text-xs font-bold border ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-rose-50 text-rose-900 border-rose-300'
              }`}
            >
              {feedback.text}
            </div>
          )}

          <div className="flex items-center justify-end pt-1">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors cursor-pointer"
            >
              {isSaving ? 'Saving W-2 Defaults...' : 'Save W-2 Payroll Defaults'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
