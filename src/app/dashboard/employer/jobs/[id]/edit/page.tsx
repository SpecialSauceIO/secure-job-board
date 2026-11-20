'use client'
import StructuredCertificationSelector from '@/components/StructuredCertificationSelector'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { SubmitButton } from '@/components/SubmitButton'
import { StructuredRequirementEditor } from '@/components/StructuredRequirementEditor'
import { StructuredLanguageEditor } from '@/components/StructuredLanguageEditor'
import AiJobScanner from '@/components/AiJobScanner'
import UsLocationSelector from '@/components/UsLocationSelector'
import { updateStructuredJob } from '@/app/dashboard/actions'
import {
  STANDARD_INDUSTRY_VERTICALS,
  normalizeIndustryVertical,
} from '@/constants/industries'
import {
  JOB_EDUCATION_REQUIREMENTS,
  normalizeJobEducationReq,
} from '@/constants/education'
import {
  DEFAULT_LANGUAGE_ENTRY,
  LanguageEntry,
  normalizeLanguageList,
} from '@/constants/languages'

export default function EditJobPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params?.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isPracticeMode, setIsPracticeMode] = useState(false)
  const [isPracticeDraft, setIsPracticeDraft] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [jobData, setJobData] = useState({
    title: '',
    work_model: 'hybrid',
    location: '',
    employment_type: 'Full-Time (W-2)',
    experience_level: 'Senior (5–8 yrs)',
    openings_count: '1',
    education_req: "Bachelor's Degree OR Equivalent Practical Experience",
    required_certifications: '',
    required_languages: [{ ...DEFAULT_LANGUAGE_ENTRY }] as LanguageEntry[],
    pay_type: 'annual' as 'annual' | 'hourly',
    salary_min: '',
    salary_max: '',
    comp_perks: 'Base Salary Only',
    industry: 'Technology, Software & SaaS',
    company_size: 'Growth (50–250 Employees)',
    work_auth: 'US Authorized Only (No Sponsorship)',
    hiring_timeline: 'Active Hiring (2–4 Weeks)',
    eor_contract_track: 'none',
    eor_duration_months: '6',
    eor_bg_check: true,
    eor_drug_check: false,
    equipment_policy: 'No Equipment Needed / Not Applicable',
    equipment_notes: '',
    description: '',
    structured_requirements: [] as any[],
  })

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: job, error } = await supabase
        .from('jobs')
        .select('*, organizations:organization_id (description, subscription_status, subscription_tier)')
        .eq('id', jobId)
        .single()

      if (error || !job) {
        setErrorMsg('Role not found or you do not have permission to edit it.')
        setIsLoading(false)
        return
      }

      const orgObj: any = Array.isArray(job.organizations)
        ? job.organizations[0]
        : job.organizations
      const orgDesc = orgObj?.description || ''
      const orgIndMatch = orgDesc.match(/\[IND:([^\]]+)\]/i)
      const orgSizeMatch = orgDesc.match(/\[SIZE:([^\]]+)\]/i)

      const isObjReqs =
        job.structured_requirements &&
        typeof job.structured_requirements === 'object' &&
        !Array.isArray(job.structured_requirements)
      const objReqs: any = isObjReqs ? job.structured_requirements : {}
      const rawReqs = Array.isArray(job.structured_requirements)
        ? job.structured_requirements
        : Array.isArray(objReqs.required_skills)
        ? objReqs.required_skills.map((s: any) =>
            typeof s === 'string'
              ? {
                  skill: s,
                  years: Number(objReqs.min_experience_years) || 3,
                  level: 'Advanced',
                }
              : s
          )
        : []
      const metaItem =
        (Array.isArray(job.structured_requirements)
          ? job.structured_requirements.find((r: any) => r && r._ss_job_meta === true)
          : null) || {
          pay_type: objReqs.compensation_type || objReqs.pay_type,
          location: objReqs.metro_area || objReqs.location || job.location,
          required_certifications: Array.isArray(objReqs.certifications)
            ? objReqs.certifications.join(', ')
            : objReqs.certifications,
          required_languages: objReqs.languages,
        }
      const tierNorm = String(orgObj?.subscription_tier || '').toLowerCase()
      const statusNorm = String(orgObj?.subscription_status || '').toLowerCase()
      const hasPaidActivePlan = statusNorm === 'active' && ['starter', 'growth', 'enterprise'].includes(tierNorm)
      setIsPracticeMode(!hasPaidActivePlan)
      setIsPracticeDraft(Boolean(metaItem?.practice_draft === true))

      const visibleReqs = rawReqs.filter(
        (r: any) => r && !r._ss_job_meta && (r.skill || r.name)
      )

      const inferredPayType: 'annual' | 'hourly' =
        metaItem.pay_type === 'hourly' ||
        (job.salary_max && job.salary_max > 0 && job.salary_max <= 500)
          ? 'hourly'
          : 'annual'

      const rawEmpType = metaItem.employment_type || 'Full-Time (W-2)'
      const normalizedEmpType =
        rawEmpType === 'Contract / 1099'
          ? 'Contract (1099 / Corp-to-Corp)'
          : rawEmpType

      const rawIndustry =
        metaItem.industry || (orgIndMatch?.[1] ? orgIndMatch[1].trim() : '')
      const normalizedIndustry = rawIndustry
        ? normalizeIndustryVertical(rawIndustry)
        : 'Technology, Software & SaaS'

      const resolvedCompanySize =
        metaItem.company_size ||
        (orgSizeMatch?.[1] ? orgSizeMatch[1].trim() : '') ||
        'Growth (50–250 Employees)'

      const normalizedEducationReq = metaItem.education_req
        ? normalizeJobEducationReq(metaItem.education_req)
        : "Bachelor's Degree OR Equivalent Practical Experience"

      const normalizedLanguages = normalizeLanguageList(
        metaItem.required_languages,
        true
      )

      setJobData({
        title: job.title || '',
        work_model: String(job.work_model || 'hybrid').toLowerCase(),
        location: metaItem.location || job.location || '',
        employment_type: normalizedEmpType,
        experience_level: metaItem.experience_level || 'Senior (5–8 yrs)',
        openings_count: String(Math.min(25, Math.max(1, Math.floor(Number(metaItem.openings_count) || 1)))),
        education_req: normalizedEducationReq,
        required_certifications: metaItem.required_certifications || '',
        required_languages: normalizedLanguages,
        pay_type: inferredPayType,
        salary_min: job.salary_min ? String(job.salary_min) : '',
        salary_max: job.salary_max ? String(job.salary_max) : '',
        comp_perks: metaItem.comp_perks || 'Base Salary Only',
        industry: normalizedIndustry,
        company_size: resolvedCompanySize,
        work_auth: metaItem.work_auth || 'US Authorized Only (No Sponsorship)',
        hiring_timeline: metaItem.hiring_timeline || 'Active Hiring (2–4 Weeks)',
        eor_contract_track:
          metaItem.eor_contract_track ||
          (normalizedEmpType === 'Contract-to-Hire'
            ? 'trial_to_hire_90d'
            : normalizedEmpType === 'Contract (W-2 Fixed-Term)'
            ? 'fixed_term_w2'
            : normalizedEmpType === 'Contract (W-2 Open-Ended)'
            ? 'open_ended_w2'
            : 'none'),
        eor_duration_months: metaItem.eor_duration_months ? String(metaItem.eor_duration_months) : '6',
        eor_bg_check: metaItem.eor_bg_check !== undefined ? Boolean(metaItem.eor_bg_check) : true,
        eor_drug_check: Boolean(metaItem.eor_drug_check),
        equipment_policy: metaItem.equipment_policy || 'No Equipment Needed / Not Applicable',
        equipment_notes: metaItem.equipment_notes || '',
        description: job.description || '',
        structured_requirements: visibleReqs,
      })
      setIsLoading(false)
    }

    fetchJob()
  }, [jobId, router])

  const handleAiData = (data: any) => {
    const matchOpt = (val: any, opts: string[], fb: string) => {
      if (typeof val === 'string' && val.trim().length > 0) {
        const norm = (s: string) => s.trim().toLowerCase().replace(/[\u2010-\u2015-]/g, '-')
        const t = norm(val)
        if (opts.length === 0) return val.trim()
        return opts.find((o) => norm(o) === t) || opts.find((o) => norm(o).includes(t) || t.includes(norm(o))) || fb
      }
      return fb
    }
    setJobData((prev) => ({
      ...prev,
      title: data.title || prev.title,
      work_model: matchOpt(data.work_model, ['remote', 'hybrid', 'onsite'], prev.work_model),
      location: data.location || prev.location,
      pay_type: data.pay_type === 'hourly' ? 'hourly' : data.pay_type === 'annual' ? 'annual' : prev.pay_type,
      salary_min: data.salary_min ? String(data.salary_min) : prev.salary_min,
      salary_max: data.salary_max ? String(data.salary_max) : prev.salary_max,
      employment_type: matchOpt(data.employment_type, ['Full-Time (W-2)', 'Contract-to-Hire', 'Contract (W-2 Fixed-Term)', 'Contract (W-2 Open-Ended)', 'Contract (1099 / Corp-to-Corp)', 'Part-Time', 'Seasonal / Temporary'], prev.employment_type),
      eor_contract_track: data.employment_type === 'Contract-to-Hire' ? 'trial_to_hire_90d' : data.employment_type === 'Contract (W-2 Fixed-Term)' || data.employment_type === 'Seasonal / Temporary' ? 'fixed_term_w2' : data.employment_type === 'Contract (W-2 Open-Ended)' ? 'open_ended_w2' : prev.eor_contract_track,
      eor_duration_months: data.eor_duration_months ? String(data.eor_duration_months) : prev.eor_duration_months,
      equipment_policy: matchOpt(data.equipment_policy, ['No Equipment Needed / Not Applicable', 'Company-Shipped Hardware (Laptop / Security Key)', 'Cloud VDI / BYOD (Virtual Desktop & Passkey Only)', 'Request EOR Managed Laptop Add-On'], prev.equipment_policy),
      equipment_notes: typeof data.equipment_notes === 'string' && data.equipment_notes.trim() ? data.equipment_notes.trim() : prev.equipment_notes,
      experience_level: matchOpt(data.experience_level, ['Entry / Junior (0–2 yrs)', 'Mid-Level (3–5 yrs)', 'Senior (5–8 yrs)', 'Lead / Staff / Principal (8+ yrs)', 'Executive / Director'], prev.experience_level),
      education_req: data.education_req
        ? normalizeJobEducationReq(data.education_req)
        : prev.education_req,
      required_certifications:
        Array.isArray(data.required_certifications)
          ? data.required_certifications.filter(Boolean).join(', ')
          : typeof data.required_certifications === 'string' && data.required_certifications.trim()
            ? data.required_certifications
            : prev.required_certifications,
      required_languages: data.required_languages
        ? normalizeLanguageList(data.required_languages, true)
        : prev.required_languages,
      industry: data.industry
        ? normalizeIndustryVertical(data.industry)
        : prev.industry,
      description: data.description || prev.description,
      structured_requirements:
        data.structured_requirements || prev.structured_requirements,
      comp_perks: matchOpt(data.comp_perks, ['Base Salary Only', '+ Annual Bonus', '+ Equity / Stock Options', '+ Bonus & Equity', '+ Commission / OTE'], prev.comp_perks),
      hiring_timeline: matchOpt(data.hiring_timeline, ['Immediate / Urgent (1–2 Weeks)', 'Active Hiring (2–4 Weeks)', 'Standard Pipeline (30+ Days)', 'Flexible Start for Right Fit'], prev.hiring_timeline),
      company_size: matchOpt(data.company_size, ['Seed / Startup (1–50 Employees)', 'Growth (50–250 Employees)', 'Mid-Market (250–1,000 Employees)', 'Enterprise (1,000+ Employees)'], prev.company_size),
      work_auth: matchOpt(data.work_auth, ['US Authorized Only (No Sponsorship)', 'Visa Sponsorship Available', 'Security Clearance Required'], prev.work_auth),
    }))
  }

  const handleSubmit = async (formData: FormData) => {
    setErrorMsg(null)
    formData.append('job_id', jobId)

    const result = await updateStructuredJob(formData)
    if (result?.error) {
      setErrorMsg(result.error)
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      return
    }

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    router.push('/dashboard/employer/jobs')
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="py-2">
        <div className="mx-auto max-w-6xl rounded-2xl bg-white p-12 text-center shadow-sm border-2 border-slate-300 mt-8 border-slate-300">
          <div className="inline-block w-8 h-8 border-4 border-slate-300 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Loading role details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl rounded-2xl bg-white p-4 sm:p-8 shadow-sm border-2 border-slate-300 mt-4 mb-12">
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-4 mb-3">
          <Link
            href="/dashboard"
            className="text-indigo-600 font-bold text-sm inline-flex items-center gap-1 hover:text-indigo-700"
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
            Back to Employer Dashboard
          </Link>
          <span className="text-slate-300">•</span>
          <Link
            href="/dashboard/employer/jobs"
            className="text-slate-500 font-bold text-sm hover:text-slate-800"
          >
            Back to Manage Roles
          </Link>
        </div>

        <h2 className="text-2xl font-bold text-slate-900">
          {isPracticeDraft || isPracticeMode ? 'Edit Protected Role Draft (Practice Mode)' : 'Edit Protected Role Listing'}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Update the compensation band (/yr or /hr), US metro location, education, certifications, required languages, standardized industry vertical, and core skill requirements.
        </p>
        {(isPracticeDraft || isPracticeMode) && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs font-semibold text-amber-950">
              <strong>{isPracticeMode ? 'Practice Mode Active ($0/mo):' : 'Saved Practice Draft:'}</strong>{' '}
              {isPracticeMode
                ? 'Changes save directly to your inactive Practice Mode draft. When you are ready to publish roles live to Verified Professionals, activate Starter ($149/mo), Growth ($499/mo), or Enterprise ($1,250/mo).'
                : 'This role is currently an inactive Practice Mode draft. Save any updates here, then publish it live from Manage Roles whenever a role slot is open.'}
            </p>
            {isPracticeMode && (
              <Link
                href="/dashboard/employer/billing"
                className="shrink-0 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-indigo-600 transition-colors text-center"
              >
                View Employer Plans →
              </Link>
            )}
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 text-sm font-bold">
          {errorMsg}
        </div>
      )}

      <div className="mb-8">
        <AiJobScanner onDataExtracted={handleAiData} />
      </div>

      <form action={handleSubmit} className="space-y-8">
        <input type="hidden" name="job_id" value={jobId} />

        {/* SECTION 1: ROLE FUNDAMENTALS, EDUCATION, LANGUAGES & US LOCATION */}
        <div className="space-y-5 rounded-xl bg-slate-50 p-4 sm:p-6 border-2 border-slate-300">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-300 pb-2">
            1. Role Fundamentals, Education, Languages &amp; US Location
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-700">
                Job Title
              </label>
              <input
                type="text"
                name="title"
                required
                value={jobData.title}
                onChange={(e) =>
                  setJobData({ ...jobData, title: e.target.value })
                }
                placeholder="e.g. Senior Full Stack Developer"
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700">
                Work Model
              </label>
              <select
                name="work_model"
                required
                value={jobData.work_model}
                onChange={(e) =>
                  setJobData({ ...jobData, work_model: e.target.value })
                }
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium cursor-pointer"
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </div>
          </div>

          {/* CASCADING US STATE -> MAJOR METRO DROPDOWN */}
          <UsLocationSelector
            name="location"
            value={jobData.location}
            workModel={jobData.work_model}
            onChange={(loc) => setJobData((prev) => ({ ...prev, location: loc }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700">
                Seniority / Experience Level
              </label>
              <select
                name="experience_level"
                value={jobData.experience_level}
                onChange={(e) =>
                  setJobData({ ...jobData, experience_level: e.target.value })
                }
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium cursor-pointer"
              >
                <option value="Entry / Junior (0–2 yrs)">
                  Entry / Junior (0–2 yrs)
                </option>
                <option value="Mid-Level (3–5 yrs)">Mid-Level (3–5 yrs)</option>
                <option value="Senior (5–8 yrs)">Senior (5–8 yrs)</option>
                <option value="Lead / Staff / Principal (8+ yrs)">
                  Lead / Staff / Principal (8+ yrs)
                </option>
                <option value="Executive / Director">
                  Executive / Director
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700">
                Total Role Openings (Seats)
              </label>
              <input
                type="number"
                name="openings_count"
                min={1}
                max={25}
                required
                value={jobData.openings_count}
                onChange={(e) =>
                  setJobData({ ...jobData, openings_count: e.target.value })
                }
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium"
              />
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Each unfilled seat counts toward your active role limit (up to 25 seats per listing) and steps down automatically as placements are recorded.
              </p>
            </div>
          </div>

          {/* Education Requirement + Active Industry Certifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-300">
            <div>
              <label className="block text-sm font-bold text-slate-700">
                Education Requirement
              </label>
              <p className="text-xs text-slate-500 mt-0.5 mb-2">
                Choose whether practical experience is accepted in lieu of a degree.
              </p>
              <select
                name="education_req"
                value={jobData.education_req}
                onChange={(e) =>
                  setJobData({ ...jobData, education_req: e.target.value })
                }
                className="block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium cursor-pointer"
              >
                {JOB_EDUCATION_REQUIREMENTS.map((reqOpt) => (
                  <option key={reqOpt} value={reqOpt}>
                    {reqOpt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700">
                Required / Preferred Certifications (Optional)
              </label>
              <p className="text-xs text-slate-500 mt-0.5 mb-2">
                Select standardized industry credentials or licenses evaluated directly by the TrueFit Score™.
              </p>
              <StructuredCertificationSelector
                name="required_certifications"
                value={jobData.required_certifications}
                industryVertical={jobData.industry}
                onChange={(updatedCerts: string) =>
                  setJobData((prev) => ({
                    ...prev,
                    required_certifications: updatedCerts,
                  }))
                }
              />
            </div>
          </div>

          {/* Required / Preferred Languages Matrix */}
          <StructuredLanguageEditor
            name="required_languages"
            initialLanguages={jobData.required_languages}
            title="🌐 Required / Preferred Languages"
            subtitle="Specify required languages and minimum fluency level for this role."
            onChange={(updatedLangs) =>
              setJobData((prev) => ({
                ...prev,
                required_languages: updatedLangs,
              }))
            }
          />
        </div>

        {/* SECTION 2: COMPENSATION & PAY TYPE (/YR VS /HR) */}
        <div className="space-y-5 rounded-xl bg-slate-50 p-4 sm:p-6 border-2 border-slate-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-300 pb-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
              2. Compensation Band (
              {jobData.pay_type === 'hourly' ? 'Hourly /hr' : 'Annual Salary /yr'}
              )
            </h3>
            <span className="text-xs font-bold text-emerald-700">
              Displayed publicly on protected listing
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700">
                Pay Structure
              </label>
              <select
                name="pay_type"
                value={jobData.pay_type}
                onChange={(e) =>
                  setJobData({
                    ...jobData,
                    pay_type: e.target.value as 'annual' | 'hourly',
                  })
                }
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-bold cursor-pointer"
              >
                <option value="annual">Annual Salary (/yr)</option>
                <option value="hourly">Hourly Rate (/hr)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700">
                Additional Compensation / Perks
              </label>
              <select
                name="comp_perks"
                value={jobData.comp_perks}
                onChange={(e) =>
                  setJobData({ ...jobData, comp_perks: e.target.value })
                }
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium cursor-pointer"
              >
                <option value="Base Salary Only">Base Pay Only</option>
                <option value="+ Annual Bonus">
                  + Annual Performance Bonus
                </option>
                <option value="+ Equity / Stock Options">
                  + Equity / Stock Options
                </option>
                <option value="+ Bonus & Equity">
                  + Bonus &amp; Equity Package
                </option>
                <option value="+ Commission / OTE">
                  + Uncapped Commission / OTE
                </option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700">
                Minimum{' '}
                {jobData.pay_type === 'hourly'
                  ? 'Hourly Rate ($/hr)'
                  : 'Annual Salary ($/yr)'}
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <span className="text-slate-500 font-bold">$</span>
                </div>
                <input
                  type="number"
                  name="salary_min"
                  required
                  value={jobData.salary_min}
                  onChange={(e) =>
                    setJobData({ ...jobData, salary_min: e.target.value })
                  }
                  placeholder={jobData.pay_type === 'hourly' ? '55' : '95000'}
                  className="block w-full rounded-lg border border-slate-300 bg-white pl-8 pr-14 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm font-bold"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                  <span className="text-xs font-extrabold text-slate-400">
                    {jobData.pay_type === 'hourly' ? 'USD /hr' : 'USD /yr'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700">
                Maximum{' '}
                {jobData.pay_type === 'hourly'
                  ? 'Hourly Rate ($/hr)'
                  : 'Annual Salary ($/yr)'}
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <span className="text-slate-500 font-bold">$</span>
                </div>
                <input
                  type="number"
                  name="salary_max"
                  required
                  value={jobData.salary_max}
                  onChange={(e) =>
                    setJobData({ ...jobData, salary_max: e.target.value })
                  }
                  placeholder={jobData.pay_type === 'hourly' ? '85' : '135000'}
                  className="block w-full rounded-lg border border-slate-300 bg-white pl-8 pr-14 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm font-bold"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                  <span className="text-xs font-extrabold text-slate-400">
                    {jobData.pay_type === 'hourly' ? 'USD /hr' : 'USD /yr'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: ANONYMOUS COMPANY TEASER & WORK AUTHORIZATION */}
        <div className="space-y-5 rounded-xl bg-slate-50 p-4 sm:p-6 border-2 border-slate-300">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-300 pb-2">
            3. Anonymous Company Teaser &amp; Work Authorization
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700">
                Industry Vertical
              </label>
              <select
                name="industry"
                required
                value={jobData.industry}
                onChange={(e) =>
                  setJobData({ ...jobData, industry: e.target.value })
                }
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium cursor-pointer"
              >
                {STANDARD_INDUSTRY_VERTICALS.map((vertical) => (
                  <option key={vertical} value={vertical}>
                    {vertical}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700">
                Company Stage / Size
              </label>
              <select
                name="company_size"
                value={jobData.company_size}
                onChange={(e) =>
                  setJobData({ ...jobData, company_size: e.target.value })
                }
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium cursor-pointer"
              >
                <option value="Seed / Startup (1–50 Employees)">
                  Seed / Startup (1–50)
                </option>
                <option value="Growth (50–250 Employees)">
                  Growth Stage (50–250)
                </option>
                <option value="Mid-Market (250–1,000 Employees)">
                  Mid-Market (250–1,000)
                </option>
                <option value="Enterprise (1,000+ Employees)">
                  Enterprise (1,000+)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700">
                Work Authorization
              </label>
              <select
                name="work_auth"
                value={jobData.work_auth}
                onChange={(e) =>
                  setJobData({ ...jobData, work_auth: e.target.value })
                }
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium cursor-pointer"
              >
                <option value="US Authorized Only (No Sponsorship)">
                  US Authorized Only (No Sponsorship)
                </option>
                <option value="Visa Sponsorship Available">
                  Visa Sponsorship Available
                </option>
                <option value="Security Clearance Required">
                  Security Clearance Required
                </option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-700">
                ⏱️ Target Start Window (Hiring Urgency)
              </label>
              <select
                name="hiring_timeline"
                value={jobData.hiring_timeline}
                onChange={(e) =>
                  setJobData({ ...jobData, hiring_timeline: e.target.value })
                }
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium cursor-pointer"
              >
                <option value="Immediate / Urgent (1–2 Weeks)">
                  Immediate / Urgent Start (Within 1–2 Weeks)
                </option>
                <option value="Active Hiring (2–4 Weeks)">
                  Active Hiring (Target Start in 2–4 Weeks)
                </option>
                <option value="Standard Pipeline (30+ Days)">
                  Standard Pipeline (Target Start in 30+ Days)
                </option>
                <option value="Flexible Start for Right Fit">
                  Flexible / Open Start Date for Right Fit
                </option>
              </select>
            </div>
          </div>

          {/* ROLE-LEVEL W-2 CONTRACT & EQUIPMENT DEFAULTS */}
          <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-extrabold text-indigo-950">
                  Hiring Track, W-2 Payroll &amp; Equipment Defaults
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Select the single hiring and employment track plus IT equipment policy for this role. You control extensions, direct conversions, or assignment wrap-ups directly from Manage Roles.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-indigo-700 border border-indigo-200">
                All-In W-2 Payroll · $0 Conversion Fee
              </span>
            </div>

            <input type="hidden" name="employment_type" value={jobData.employment_type} />
            <input type="hidden" name="eor_contract_track" value={jobData.eor_contract_track} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Hiring &amp; Employment Track
                </label>
                <select
                  value={
                    jobData.eor_contract_track === 'trial_to_hire_90d'
                      ? 'eor_c2h'
                      : jobData.eor_contract_track === 'fixed_term_w2'
                      ? 'eor_fixed'
                      : jobData.eor_contract_track === 'open_ended_w2'
                      ? 'eor_open'
                      : jobData.employment_type === 'Contract (1099 / Corp-to-Corp)'
                      ? 'direct_1099'
                      : jobData.employment_type === 'Part-Time'
                      ? 'direct_part_time'
                      : jobData.employment_type === 'Seasonal / Temporary'
                      ? 'direct_seasonal'
                      : 'direct_ft'
                  }
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === 'eor_c2h') {
                      setJobData({ ...jobData, employment_type: 'Contract-to-Hire', eor_contract_track: 'trial_to_hire_90d' })
                    } else if (v === 'eor_fixed') {
                      setJobData({ ...jobData, employment_type: 'Contract (W-2 Fixed-Term)', eor_contract_track: 'fixed_term_w2' })
                    } else if (v === 'eor_open') {
                      setJobData({ ...jobData, employment_type: 'Contract (W-2 Open-Ended)', eor_contract_track: 'open_ended_w2' })
                    } else if (v === 'direct_1099') {
                      setJobData({ ...jobData, employment_type: 'Contract (1099 / Corp-to-Corp)', eor_contract_track: 'none' })
                    } else if (v === 'direct_part_time') {
                      setJobData({ ...jobData, employment_type: 'Part-Time', eor_contract_track: 'none' })
                    } else if (v === 'direct_seasonal') {
                      setJobData({ ...jobData, employment_type: 'Seasonal / Temporary', eor_contract_track: 'none' })
                    } else {
                      setJobData({ ...jobData, employment_type: 'Full-Time (W-2)', eor_contract_track: 'none' })
                    }
                  }}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm font-medium cursor-pointer"
                >
                  <option value="direct_ft">Direct Hire — Full-Time (W-2)</option>
                  <option value="eor_c2h">W-2 Contract-to-Hire ($0 Conversion)</option>
                  <option value="eor_fixed">Fixed-Term W-2 Contract (3–12 Months + Extend Anytime)</option>
                  <option value="eor_open">Open-Ended Ongoing W-2 Contract (Extend or End Anytime)</option>
                  <option value="direct_1099">Independent Contract (1099 / Corp-to-Corp)</option>
                  <option value="direct_part_time">Direct Hire — Part-Time</option>
                  <option value="direct_seasonal">Direct Hire — Seasonal / Temporary</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Equipment &amp; Access Provisioning
                </label>
                <select
                  name="equipment_policy"
                  value={jobData.equipment_policy === 'Request EOR Managed Laptop Add-On' ? 'Request Managed Laptop Add-On' : jobData.equipment_policy}
                  onChange={(e) => setJobData({ ...jobData, equipment_policy: e.target.value })}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm font-medium cursor-pointer"
                >
                  <option value="No Equipment Needed / Not Applicable">No Equipment Needed / Not Applicable</option>
                  <option value="Company-Shipped Hardware (Laptop / Security Key)">Company-Shipped Hardware (Laptop / Security Key)</option>
                  <option value="Cloud VDI / BYOD (Virtual Desktop & Passkey Only)">Cloud VDI / BYOD (Virtual Desktop &amp; Passkey Only)</option>
                  <option value="Request Managed Laptop Add-On">Request Managed Laptop Add-On</option>
                </select>
              </div>
            </div>

            {(jobData.eor_contract_track === 'fixed_term_w2' || jobData.eor_contract_track === 'trial_to_hire_90d') && (
              <div className="max-w-xs">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  {jobData.eor_contract_track === 'trial_to_hire_90d' ? 'Target Ramp-Up Period' : 'Initial Fixed-Term Length'}
                </label>
                <select
                  name="eor_duration_months"
                  value={jobData.eor_duration_months}
                  onChange={(e) => setJobData({ ...jobData, eor_duration_months: e.target.value })}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm font-medium cursor-pointer"
                >
                  <option value="1">1 Month / 30 Days ($0 Conversion)</option>
                  <option value="2">2 Months / 60 Days ($0 Conversion)</option>
                  <option value="3">3 Months / 90 Days ($0 Conversion)</option>
                  <option value="6">6 Months / 180 Days ($0 Conversion)</option>
                  <option value="9">9 Months ($0 Conversion)</option>
                  <option value="12">12 Months ($0 Conversion)</option>
                </select>
              </div>
            )}
            {jobData.eor_contract_track !== 'fixed_term_w2' && jobData.eor_contract_track !== 'trial_to_hire_90d' && (
              <input type="hidden" name="eor_duration_months" value={jobData.eor_duration_months} />
            )}

            {jobData.equipment_policy !== 'No Equipment Needed / Not Applicable' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Equipment / Access Instructions (Optional)
                </label>
                <input
                  type="text"
                  name="equipment_notes"
                  maxLength={240}
                  value={jobData.equipment_notes}
                  onChange={(e) => setJobData({ ...jobData, equipment_notes: e.target.value })}
                  placeholder="e.g., Company ships pre-configured MacBook Pro + YubiKey upon W-2 onboarding; prepaid return box sent at offboarding."
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 text-sm"
                />
              </div>
            )}
            {jobData.equipment_policy === 'No Equipment Needed / Not Applicable' && (
              <input type="hidden" name="equipment_notes" value="" />
            )}

            <input type="hidden" name="eor_bg_check" value={jobData.eor_bg_check ? 'true' : 'false'} />
            <input type="hidden" name="eor_drug_check" value={jobData.eor_drug_check ? 'true' : 'false'} />
            {jobData.eor_contract_track !== 'none' && (
              <div className="flex flex-wrap items-center gap-5 pt-1 text-xs text-slate-700">
                <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={jobData.eor_bg_check}
                    onChange={(e) => setJobData({ ...jobData, eor_bg_check: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  Include Standard W-2 Background Check
                </label>
                <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={jobData.eor_drug_check}
                    onChange={(e) => setJobData({ ...jobData, eor_drug_check: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  Include Pre-Assignment Drug Screen
                </label>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: CORE SKILL MATRIX & OVERVIEW */}
        <div className="space-y-5 rounded-xl bg-slate-50 p-4 sm:p-6 border-2 border-slate-300">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-300 pb-2">
            4. Core Skill Matrix &amp; Role Overview
          </h3>

          <StructuredRequirementEditor
            initialRequirements={jobData.structured_requirements}
          />

          <div className="pt-4">
            <label className="block text-sm font-bold text-slate-700">
              Job Description Overview
            </label>
            <p className="text-xs text-slate-500 mb-2 mt-1">
              Describe the core responsibilities and team culture. Technical skills are already handled above.
            </p>
            <textarea
              name="description"
              required
              rows={6}
              value={jobData.description}
              onChange={(e) =>
                setJobData({ ...jobData, description: e.target.value })
              }
              placeholder="We are looking for..."
              className="block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <Link
            href="/dashboard/employer/jobs"
            className="px-6 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors border-slate-300"
          >
            Cancel
          </Link>
          <SubmitButton
            pendingText={isPracticeDraft || isPracticeMode ? 'Saving Draft...' : 'Saving Changes...'}
            className="w-full sm:w-auto rounded-xl bg-indigo-600 px-8 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            {isPracticeDraft || isPracticeMode ? 'Save Draft Updates' : 'Save Role Updates'}
          </SubmitButton>
        </div>
      </form>
    </div>
  )
}