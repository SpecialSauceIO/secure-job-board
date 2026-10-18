'use client'

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [jobData, setJobData] = useState({
    title: '',
    work_model: 'hybrid',
    location: '',
    employment_type: 'Full-Time (W-2)',
    experience_level: 'Senior (5–8 yrs)',
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
        .select('*, organizations:organization_id (description)')
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

      const rawReqs = Array.isArray(job.structured_requirements)
        ? job.structured_requirements
        : []
      const metaItem =
        rawReqs.find((r: any) => r && r._ss_job_meta === true) || {}
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
        work_model: job.work_model || 'hybrid',
        location: metaItem.location || '',
        employment_type: normalizedEmpType,
        experience_level: metaItem.experience_level || 'Senior (5–8 yrs)',
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
        description: job.description || '',
        structured_requirements: visibleReqs,
      })
      setIsLoading(false)
    }

    fetchJob()
  }, [jobId, router])

  const handleAiData = (data: any) => {
    setJobData((prev) => ({
      ...prev,
      title: data.title || prev.title,
      work_model: data.work_model || prev.work_model,
      location: data.location || prev.location,
      pay_type: data.pay_type === 'hourly' ? 'hourly' : prev.pay_type,
      salary_min: data.salary_min ? String(data.salary_min) : prev.salary_min,
      salary_max: data.salary_max ? String(data.salary_max) : prev.salary_max,
      employment_type: data.employment_type || prev.employment_type,
      experience_level: data.experience_level || prev.experience_level,
      education_req: data.education_req
        ? normalizeJobEducationReq(data.education_req)
        : prev.education_req,
      required_certifications:
        typeof data.required_certifications === 'string'
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
    }))
  }

  const handleSubmit = async (formData: FormData) => {
    setErrorMsg(null)
    formData.append('job_id', jobId)

    const result = await updateStructuredJob(formData)
    if (result?.error) {
      setErrorMsg(result.error)
      return
    }

    router.push('/dashboard/employer/jobs')
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-12">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-12 text-center shadow-sm border border-slate-200 mt-8">
          <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Loading role details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-slate-200 mt-8 mb-12">
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
            Back to Job Management
          </Link>
        </div>

        <h2 className="text-2xl font-bold text-slate-900">
          Edit Blind Role Listing
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Update the compensation band (/yr or /hr), US metro location, education, certifications, required languages, standardized industry vertical, and core skill requirements.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">
          {errorMsg}
        </div>
      )}

      <div className="mb-8">
        <AiJobScanner onDataExtracted={handleAiData} />
      </div>

      <form action={handleSubmit} className="space-y-8">
        <input type="hidden" name="job_id" value={jobId} />

        {/* SECTION 1: ROLE FUNDAMENTALS, EDUCATION, LANGUAGES & US LOCATION */}
        <div className="space-y-6 rounded-xl bg-slate-50 p-6 border border-slate-200">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
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
                Employment Type
              </label>
              <select
                name="employment_type"
                value={jobData.employment_type}
                onChange={(e) =>
                  setJobData({ ...jobData, employment_type: e.target.value })
                }
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium cursor-pointer"
              >
                <option value="Full-Time (W-2)">Full-Time (W-2)</option>
                <option value="Contract (1099 / Corp-to-Corp)">
                  Contract (1099 / Corp-to-Corp)
                </option>
                <option value="Contract-to-Hire">Contract-to-Hire</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Seasonal / Temporary">
                  Seasonal / Temporary
                </option>
              </select>
            </div>

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
          </div>

          {/* Education Requirement + Active Industry Certifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-200/70">
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
                Comma-separated credentials (e.g., AWS Solutions Architect, PMP, Security+).
              </p>
              <input
                type="text"
                name="required_certifications"
                value={jobData.required_certifications}
                onChange={(e) =>
                  setJobData({
                    ...jobData,
                    required_certifications: e.target.value,
                  })
                }
                placeholder="e.g. AWS Certified, CompTIA Security+, PMP"
                className="block w-full rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3.5 text-sm font-medium"
              />
            </div>
          </div>

          {/* Required / Preferred Languages Matrix */}
          <StructuredLanguageEditor
            name="required_languages"
            initialLanguages={jobData.required_languages}
            title="🌐 Required / Preferred Languages"
            subtitle="Specify required languages, modality (Written, Verbal, or Both), and minimum proficiency level. Evaluated automatically by the 5-Point AI Match Radar and Outbound Pitch Firewall."
            onChange={(updatedLangs) =>
              setJobData((prev) => ({
                ...prev,
                required_languages: updatedLangs,
              }))
            }
          />
        </div>

        {/* SECTION 2: COMPENSATION & PAY TYPE (/YR VS /HR) */}
        <div className="space-y-6 rounded-xl bg-slate-50 p-6 border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
              2. Compensation Band (
              {jobData.pay_type === 'hourly' ? 'Hourly /hr' : 'Annual Salary /yr'}
              )
            </h3>
            <span className="text-xs font-bold text-emerald-700">
              Displayed publicly on blind listing
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
        <div className="space-y-6 rounded-xl bg-slate-50 p-6 border border-slate-200">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
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
        </div>

        {/* SECTION 4: CORE SKILL MATRIX & OVERVIEW */}
        <div className="space-y-6 rounded-xl bg-slate-50 p-6 border border-slate-200">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
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
            className="px-6 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <SubmitButton
            pendingText="Saving Changes..."
            className="rounded-xl bg-indigo-600 px-8 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Save Role Updates
          </SubmitButton>
        </div>
      </form>
    </div>
  )
}