'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { SubmitButton } from '@/components/SubmitButton'
import { StructuredRequirementEditor } from '@/components/StructuredRequirementEditor'
import { StructuredLanguageEditor } from '@/components/StructuredLanguageEditor'
import AiJobScanner from '@/components/AiJobScanner'
import UsLocationSelector from '@/components/UsLocationSelector'
import { createStructuredJob } from '@/app/dashboard/actions'
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

export default function NewJobPage() {
  const router = useRouter()
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [isOrgVerified, setIsOrgVerified] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

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
    const checkDomainVerification = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (member?.organization_id) {
        const { data: orgObj } = await supabase
          .from('organizations')
          .select('verification_status, description')
          .eq('id', member.organization_id)
          .single()

        setIsOrgVerified(orgObj?.verification_status === 'verified')

        const rawDesc = orgObj?.description || ''
        const indMatch = rawDesc.match(/\[IND:([^\]]+)\]/i)
        const sizeMatch = rawDesc.match(/\[SIZE:([^\]]+)\]/i)

        setJobData((prev) => ({
          ...prev,
          industry: indMatch?.[1]
            ? normalizeIndustryVertical(indMatch[1].trim())
            : prev.industry,
          company_size: sizeMatch?.[1]
            ? sizeMatch[1].trim()
            : prev.company_size,
        }))
      }

      setIsCheckingAccess(false)
    }

    checkDomainVerification()
  }, [router])

  const handleAiData = (data: any) => {
    setJobData((prev) => ({
      ...prev,
      title: data.title || prev.title,
      work_model: data.work_model || prev.work_model,
      location: data.location || prev.location,
      pay_type: data.pay_type === 'hourly' ? 'hourly' : 'annual',
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
    setSubmitError(null)
    const result = await createStructuredJob(formData)
    if (result?.error) {
      setSubmitError(result.error)
      return
    }
    router.push('/dashboard/employer/jobs')
    router.refresh()
  }

  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-12">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-12 text-center shadow-sm border-2 border-2-slate-200 mt-8 border-slate-300">
          <div className="inline-block w-8 h-8 border-4 border-slate-300 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">
            Verifying organization permissions...
          </p>
        </div>
      </div>
    )
  }

  if (!isOrgVerified) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-12">
        <div className="max-w-3xl mx-auto space-y-6">
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

          <div className="bg-white p-12 rounded-2xl border border-amber-300 shadow-sm text-center">
            <div className="w-16 h-16 bg-amber-50 border border-amber-300 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
              Corporate Domain Verification Required
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed max-w-lg mx-auto mb-6">
              To maintain platform trust, employers must verify their corporate domain before publishing blind job listings or searching the candidate pool.
            </p>
            <Link
              href="/dashboard/employer/organization"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 transition-colors shadow-sm"
            >
              Verify Corporate Domain →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-slate-200 mt-8 mb-12">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-indigo-600 font-bold text-sm inline-flex items-center gap-1 mb-3 hover:text-indigo-700"
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
        <h2 className="text-2xl font-bold text-slate-900">
          Post a New Blind Role
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Candidates will see your compensation band, US metro location, education/certification/language alignment, and standardized industry vertical, while your company name and domain remain hidden until unlock.
        </p>
      </div>

      {submitError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 text-sm font-bold">
          {submitError}
        </div>
      )}

      <div className="mb-8">
        <AiJobScanner onDataExtracted={handleAiData} />
      </div>

      <form action={handleSubmit} className="space-y-8">
        {/* SECTION 1: ROLE BASICS, EDUCATION, LANGUAGES & US CASCADING LOCATION */}
        <div className="space-y-6 rounded-xl bg-slate-50 p-6 border-2 border-2-slate-200 border-slate-300">
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
                placeholder="e.g. Senior Full Stack Engineer"
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
        <div className="space-y-6 rounded-xl bg-slate-50 p-6 border-2 border-2-slate-200 border-slate-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-300 pb-2">
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
        <div className="space-y-6 rounded-xl bg-slate-50 p-6 border-2 border-2-slate-200 border-slate-300">
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
        </div>

        {/* SECTION 4: SKILLS & DESCRIPTION */}
        <div className="space-y-6 rounded-xl bg-slate-50 p-6 border-2 border-2-slate-200 border-slate-300">
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
              Describe day-to-day responsibilities and team culture. Avoid using your company name so the role remains blind until unlock.
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

        <div className="pt-2 flex justify-end">
          <SubmitButton
            pendingText="Publishing..."
            className="rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Publish Blind Job Post
          </SubmitButton>
        </div>
      </form>
    </div>
  )
}