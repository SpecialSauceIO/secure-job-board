'use client'
import StructuredCertificationSelector from '@/components/StructuredCertificationSelector'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { SubmitButton } from '@/components/SubmitButton'
import { StructuredRequirementEditor } from '@/components/StructuredRequirementEditor'
import { StructuredLanguageEditor } from '@/components/StructuredLanguageEditor'
import AiJobScanner from '@/components/AiJobScanner'
import UsLocationSelector from '@/components/UsLocationSelector'
import {
  createStructuredJob,
  purchaseEmployerRolePass,
  resolveEmployerTierInfo,
} from '@/app/dashboard/actions'
import {
  EXTRA_PROTECTED_ROLE_SLOT,
  ProtectedRolePassId,
  RolePassInventory,
} from '@/lib/sponsored-verification'
import {
  clampRoleOpenings,
  sumActiveRoleSlots,
} from '@/constants/availability'
import {
  parseEorConfigFromDescription,
  hasExplicitEorConfigTag,
} from '@/lib/eor-config'
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
  const [isPracticeMode, setIsPracticeMode] = useState(false)
  const [hasSavedOrgEorDefaults, setHasSavedOrgEorDefaults] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [billingNotice, setBillingNotice] = useState<string | null>(null)
  const [buyingPassId, setBuyingPassId] = useState<string | null>(null)
  const [maxActiveJobs, setMaxActiveJobs] = useState<number>(0)
  const [activeSlotsUsed, setActiveSlotsUsed] = useState<number>(0)
  const [rolePasses, setRolePasses] = useState<RolePassInventory>({
    extraRoleSlots: 0,
    role_25: 0,
    role_50: 0,
    role_100: 0,
    totalPasses: 0,
    firstRoleGranted: false,
  })

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
    bridge_min_years: '',
    bridge_min_years_field: '',
    description: '',
    structured_requirements: [] as any[],
  })
  const [liveSkills, setLiveSkills] = useState<string[]>([])

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
          .select('verification_status, subscription_status, subscription_tier, description')
          .eq('id', member.organization_id)
          .single()

        const tierNorm = String(orgObj?.subscription_tier || '').toLowerCase()
        const statusNorm = String(orgObj?.subscription_status || '').toLowerCase()
        const resolvedTier = await resolveEmployerTierInfo(orgObj)
        const hasPaidActivePlan = resolvedTier.tier !== 'free' && resolvedTier.maxActiveJobs > 0
        setIsPracticeMode(!hasPaidActivePlan)
        setMaxActiveJobs(resolvedTier.maxActiveJobs)
        setRolePasses(resolvedTier.rolePasses)

        const { data: orgJobs } = await supabase
          .from('jobs')
          .select('id, created_at, is_active, structured_requirements')
          .eq('organization_id', member.organization_id)
          .eq('is_active', true)
        const liveJobs = (orgJobs || []).filter((rj: any) => {
          const reqs = Array.isArray(rj?.structured_requirements) ? rj.structured_requirements : []
          const meta = reqs.find((r: any) => r && r._ss_job_meta === true)
          if (meta?.practice_draft === true) return false
          if (meta?.expires_at && new Date(meta.expires_at).getTime() <= Date.now()) return false
          return true
        })
        const appsByJob: Record<string, any[]> = {}
        const liveIds = liveJobs.map((j: any) => String(j.id)).filter(Boolean)
        if (liveIds.length > 0) {
          const { data: liveApps } = await supabase
            .from('applications')
            .select('id, job_id, match_data')
            .in('job_id', liveIds)
          for (const a of liveApps || []) {
            const jid = String(a.job_id || '')
            if (!appsByJob[jid]) appsByJob[jid] = []
            appsByJob[jid].push(a)
          }
        }
        setActiveSlotsUsed(sumActiveRoleSlots(liveJobs, appsByJob))
        setIsOrgVerified(Boolean(orgObj?.verification_status === 'verified' || (orgObj as any)?.domain_verified === true || ['active', 'verified_sandbox'].includes(statusNorm) || ['explorer', 'starter', 'growth', 'enterprise'].includes(tierNorm)))

        const rawDesc = orgObj?.description || ''
        const indMatch = rawDesc.match(/\[IND:([^\]]+)\]/i)
        const sizeMatch = rawDesc.match(/\[SIZE:([^\]]+)\]/i)
        const hasOrgEor = hasExplicitEorConfigTag(rawDesc)
        const orgEor = parseEorConfigFromDescription(rawDesc)
        setHasSavedOrgEorDefaults(hasOrgEor)

        setJobData((prev) => ({
          ...prev,
          industry: indMatch?.[1]
            ? normalizeIndustryVertical(indMatch[1].trim())
            : prev.industry,
          company_size: sizeMatch?.[1]
            ? sizeMatch[1].trim()
            : prev.company_size,
          ...(hasOrgEor
            ? {
                employment_type:
                  orgEor.defaultContractTrack === 'trial_to_hire_90d'
                    ? 'Contract-to-Hire'
                    : orgEor.defaultContractTrack === 'fixed_term_w2'
                    ? 'Contract (W-2 Fixed-Term)'
                    : orgEor.defaultContractTrack === 'open_ended_w2'
                    ? 'Contract (W-2 Open-Ended)'
                    : 'Full-Time (W-2)',
                eor_contract_track: orgEor.defaultContractTrack,
                eor_duration_months: String(orgEor.defaultDurationMonths),
                eor_bg_check: orgEor.defaultBgCheck,
                eor_drug_check: orgEor.defaultDrugCheck,
                equipment_policy: orgEor.defaultEquipmentPolicy,
                equipment_notes: orgEor.defaultEquipmentNotes,
              }
            : {}),
        }))
      }

      setIsCheckingAccess(false)
    }

    checkDomainVerification()
  }, [router])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const savedDraft = window.sessionStorage.getItem('ss_new_job_draft_v1')
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft)
        if (parsed && typeof parsed === 'object') {
          setJobData((prev) => ({ ...prev, ...parsed }))
          if (Array.isArray(parsed.structured_requirements)) {
            const restoredSkills = parsed.structured_requirements
              .map((r: any) => String(r?.skill || r?.name || '').trim())
              .filter(Boolean)
            if (restoredSkills.length > 0) setLiveSkills(restoredSkills)
          }
        }
        window.sessionStorage.removeItem('ss_new_job_draft_v1')
      }
    } catch {
      // Ignore storage parse errors
    }
    const params = new URLSearchParams(window.location.search)
    const billingStatus = params.get('billing')
    const passParam = params.get('pass') as ProtectedRolePassId | 'extra_role_slot' | null
    const sessionIdParam = params.get('session_id')
    if (
      billingStatus === 'role_pass_success' &&
      sessionIdParam &&
      passParam &&
      ['extra_role_slot', 'role_25', 'role_50', 'role_100'].includes(passParam)
    ) {
      window.history.replaceState({}, '', '/dashboard/employer/roles/new')
      purchaseEmployerRolePass(passParam, sessionIdParam).then((res) => {
        if (res?.error) {
          setSubmitError(res.error)
        } else {
          if (res?.rolePasses) setRolePasses(res.rolePasses)
          setBillingNotice(
            res?.message ||
              `✓ ${EXTRA_PROTECTED_ROLE_SLOT.shortLabel} added—your role is ready to publish below.`
          )
        }
      })
    } else if (billingStatus === 'cancelled') {
      window.history.replaceState({}, '', '/dashboard/employer/roles/new')
    }
  }, [])

  const handleBuyExtraSlotInline = async () => {
    setBuyingPassId(EXTRA_PROTECTED_ROLE_SLOT.id)
    setSubmitError(null)
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('ss_new_job_draft_v1', JSON.stringify(jobData))
      }
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: EXTRA_PROTECTED_ROLE_SLOT.id, returnTo: 'new_job' }),
      })
      const data = await res.json()
      if (!res.ok || data?.error) {
        setSubmitError(data?.error || 'Could not start Extra Protected Role Slot checkout.')
        setBuyingPassId(null)
        return
      }
      if (data?.url) {
        window.location.href = data.url
        return
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Network error launching Extra Protected Role Slot checkout.')
    }
    setBuyingPassId(null)
  }

  const handleAiData = (data: any) => {
    const matchOpt = (val: any, opts: string[], fb: string) => { if (typeof val === "string" && val.trim().length > 0) { const norm = (s: string) => s.trim().toLowerCase().replace(/[\u2010-\u2015-]/g, "-"); const t = norm(val); if (opts.length === 0) return val.trim(); return opts.find((o) => norm(o) === t) || opts.find((o) => norm(o).includes(t) || t.includes(norm(o))) || fb; } return fb; };
    setJobData((prev) => ({
      ...prev,
      title: data.title || prev.title,
      work_model: matchOpt(data.work_model, ['remote', 'hybrid', 'onsite'], prev.work_model),
      location: data.location || prev.location,
      pay_type: data.pay_type === 'hourly' ? 'hourly' : 'annual',
      salary_min: data.salary_min ? String(data.salary_min) : prev.salary_min,
      salary_max: data.salary_max ? String(data.salary_max) : prev.salary_max,
      employment_type: matchOpt(data.employment_type, ["Full-Time (W-2)", "Contract-to-Hire", "Contract (W-2 Fixed-Term)", "Contract (W-2 Open-Ended)", "Contract (1099 / Corp-to-Corp)", "Part-Time", "Seasonal / Temporary"], prev.employment_type),
      eor_contract_track: data.employment_type === "Contract-to-Hire" ? "trial_to_hire_90d" : data.employment_type === "Contract (W-2 Fixed-Term)" || data.employment_type === "Seasonal / Temporary" ? "fixed_term_w2" : data.employment_type === "Contract (W-2 Open-Ended)" ? "open_ended_w2" : prev.eor_contract_track,
      eor_duration_months: data.eor_duration_months ? String(data.eor_duration_months) : prev.eor_duration_months,
      equipment_policy: matchOpt(data.equipment_policy, ["No Equipment Needed / Not Applicable", "Company-Shipped Hardware (Laptop / Security Key)", "Cloud VDI / BYOD (Virtual Desktop & Passkey Only)", "Request EOR Managed Laptop Add-On"], prev.equipment_policy),
      equipment_notes: typeof data.equipment_notes === "string" && data.equipment_notes.trim() ? data.equipment_notes.trim() : prev.equipment_notes,
      experience_level: matchOpt(data.experience_level, ["Entry / Junior (0–2 yrs)", "Mid-Level (3–5 yrs)", "Senior (5–8 yrs)", "Lead / Staff / Principal (8+ yrs)", "Executive / Director"], prev.experience_level),
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
      bridge_min_years: (() => {
        const yrs = Array.isArray(data.structured_requirements)
          ? data.structured_requirements
              .map((r: any) => Number(r?.years ?? r?.min_years ?? 0))
              .filter((n: number) => Number.isFinite(n) && n > 0)
          : []
        if (yrs.length > 0) return String(Math.min(40, Math.max(...yrs)))
        const exp = String(data.experience_level || '').toLowerCase()
        if (exp.includes('executive') || exp.includes('director')) return '10'
        if (exp.includes('lead') || exp.includes('staff') || exp.includes('principal')) return '8'
        if (exp.includes('senior')) return '5'
        if (exp.includes('mid')) return '3'
        if (exp.includes('entry') || exp.includes('junior')) return '1'
        return prev.bridge_min_years
      })(),
      bridge_min_years_field: data.title ? String(data.title).slice(0, 80) : prev.bridge_min_years_field,
      comp_perks: matchOpt(data.comp_perks, ["Base Salary Only", "+ Annual Bonus", "+ Equity / Stock Options", "+ Bonus & Equity", "+ Commission / OTE"], prev.comp_perks),
      hiring_timeline: matchOpt(data.hiring_timeline, ["Immediate / Urgent (1–2 Weeks)", "Active Hiring (2–4 Weeks)", "Standard Pipeline (30+ Days)", "Flexible Start for Right Fit"], prev.hiring_timeline),
      company_size: matchOpt(data.company_size, ["Seed / Startup (1–50 Employees)", "Growth (50–250 Employees)", "Mid-Market (250–1,000 Employees)", "Enterprise (1,000+ Employees)"], prev.company_size),
      work_auth: matchOpt(data.work_auth, ["US Authorized Only (No Sponsorship)", "Visa Sponsorship Available", "Security Clearance Required"], prev.work_auth),
    }))
    if (Array.isArray(data.structured_requirements)) {
      const extracted = Array.from(
        new Set(
          data.structured_requirements
            .map((r: any) => (typeof r === 'string' ? r : r?.skill || r?.name || '').trim())
            .filter(Boolean)
        )
      ) as string[]
      if (extracted.length > 0) setLiveSkills(extracted)
    }
  }

  const handleSubmit = async (formData: FormData) => {
    setSubmitError(null)
    const result = await createStructuredJob(formData)
    if (result?.error) {
      setSubmitError(result.error)
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      return
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    router.push('/dashboard/employer/roles')
    router.refresh()
  }

  if (isCheckingAccess) {
    return (
      <div className="py-2">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-12 text-center shadow-sm border-2 border-slate-300 mt-8 border-slate-300">
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
      <div className="py-2">
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
              To maintain platform trust, employers must verify their corporate domain before publishing protected job listings or searching the professional pool.
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
    <div className="mx-auto max-w-6xl rounded-2xl bg-white p-4 sm:p-8 shadow-sm border-2 border-slate-300 mt-4 mb-12">
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
          {isPracticeMode ? 'Draft a Protected Role (Practice Mode)' : 'Post a New Protected Role'}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Verified Professionals see your verified company brand, compensation band, US metro location, and skill/certification alignment, while every applicant's identity stays protected behind our 2-Stage Privacy Handshake.
        </p>
        {isPracticeMode && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs font-semibold text-amber-950">
              <strong>Practice Mode Active ($0/mo):</strong> Save up to 5 inactive Protected Role drafts right now. When you are ready to publish live, activate Starter ($299/mo · 2 Active Roles), Growth ($599/mo · 5 Active Roles), or Enterprise ($999/mo · 15 Active Roles) in Membership &amp; Plan Settings.
            </p>
            <Link
              href="/dashboard/employer/membership"
              className="shrink-0 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-indigo-600 transition-colors text-center"
            >
              View Employer Plans →
            </Link>
          </div>
        )}
      </div>

      {billingNotice && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-bold">
          {billingNotice}
        </div>
      )}

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
              <div className="flex flex-wrap items-center gap-2">
                {hasSavedOrgEorDefaults && (
                  <Link
                    href="/dashboard/employer/organization"
                    className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors"
                  >
                    Inherited Organization Defaults · Edit
                  </Link>
                )}
                <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-indigo-700 border border-indigo-200">
                  All-In W-2 Payroll · $0 Conversion Fee
                </span>
              </div>
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

        {/* SECTION 4: SKILLS & DESCRIPTION */}
        <div className="space-y-5 rounded-xl bg-slate-50 p-4 sm:p-6 border-2 border-slate-300">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-300 pb-2">
            4. Core Skill Matrix &amp; Role Overview
          </h3>

          <StructuredRequirementEditor
            initialRequirements={jobData.structured_requirements}
            onSkillsChange={setLiveSkills}
          />

          <div className="rounded-xl border border-slate-300 bg-white p-4 space-y-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-slate-800">
                Verified Hiring Bridge Deal-Breaker Gate (Optional)
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Unverified applicants arriving via a Verified Hiring Bridge link must confirm your Work Model, Pay Range, and this optional minimum experience before using a $0 Employer-Sponsored ID check.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Minimum Years (Optional)
                </label>
                <input
                  type="number"
                  name="bridge_min_years"
                  min={0}
                  max={40}
                  value={jobData.bridge_min_years}
                  onChange={(e) => setJobData({ ...jobData, bridge_min_years: e.target.value })}
                  placeholder="e.g., 5"
                  className="block w-full rounded-lg border border-slate-300 bg-white text-slate-900 py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Experience Area / Role Label (Optional — Defaults to Role Title)
                </label>
                <input
                  type="text"
                  name="bridge_min_years_field"
                  maxLength={80}
                  value={jobData.bridge_min_years_field}
                  onChange={(e) => setJobData({ ...jobData, bridge_min_years_field: e.target.value })}
                  placeholder={jobData.title ? `Default: ${jobData.title}` : 'Leave blank to use Role Title automatically'}
                  className="block w-full rounded-lg border border-slate-300 bg-white text-slate-900 py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Your top core skills from the matrix above are automatically displayed on the applicant gate.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <label className="block text-sm font-bold text-slate-700">
              Job Description Overview
            </label>
            <p className="text-xs text-slate-500 mb-2 mt-1">
              Describe day-to-day responsibilities, impact, and team culture in plain language.
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

        {!isPracticeMode && (() => {
          const requestedOpenings = clampRoleOpenings(jobData.openings_count, 1)
          const remainingIncludedSlots = Math.max(0, maxActiveJobs - activeSlotsUsed)
          const overflowSlotsNeeded = Math.max(0, requestedOpenings - remainingIncludedSlots)
          const shortfallSlots = Math.max(0, overflowSlotsNeeded - rolePasses.totalPasses)
          return (
            <div className="space-y-4 rounded-xl bg-slate-50 p-4 sm:p-6 border-2 border-slate-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-300 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                    5. Active Protected Role Capacity &amp; Sponsored Bridge Access
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Already-verified Ecosystem Professionals always apply unlimited at $0; external Verified Hiring Bridge applicants verify free up to your role's sponsored cap (pre-gated before Stripe ID).
                  </p>
                </div>
                <span className="shrink-0 px-3 py-1 rounded-full bg-white border border-slate-300 text-xs font-extrabold text-slate-800">
                  {Math.min(activeSlotsUsed, maxActiveJobs)} / {maxActiveJobs} Plan Slots Active{rolePasses.totalPasses > 0 ? ` · +${rolePasses.totalPasses} Extra Banked` : ''}
                </span>
              </div>

              {overflowSlotsNeeded === 0 ? (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-emerald-950 leading-relaxed">
                    ✓ <strong>Included in Your Plan ($0 Extra):</strong> Publishing this role uses {requestedOpenings} of your {remainingIncludedSlots} open included plan {remainingIncludedSlots === 1 ? 'slot' : 'slots'}. Closing or pausing a filled role frees its slot right away.
                  </p>
                </div>
              ) : shortfallSlots === 0 ? (
                <div className="rounded-xl border border-indigo-300 bg-indigo-50/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-indigo-950 leading-relaxed">
                    ★ <strong>Overflow Covered by Banked Extra Slot:</strong> Publishing this role applies {overflowSlotsNeeded} banked Extra Protected Role {overflowSlotsNeeded === 1 ? 'Slot' : 'Slots'} ({rolePasses.totalPasses} available in balance).
                  </p>
                  <button
                    type="button"
                    disabled={buyingPassId !== null}
                    onClick={handleBuyExtraSlotInline}
                    className="shrink-0 px-3.5 py-2 rounded-lg border border-indigo-300 bg-white hover:bg-indigo-100 text-indigo-900 text-xs font-extrabold cursor-pointer disabled:opacity-50"
                  >
                    {buyingPassId ? 'Opening Checkout...' : '+ Add Another Slot ($199)'}
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-extrabold text-amber-950">
                      All {maxActiveJobs} Included Active Role Slots Are Currently in Use
                    </p>
                    <p className="text-xs text-amber-900 leading-relaxed">
                      Close or pause an active role to free a plan slot, upgrade your plan in <Link href="/dashboard/employer/membership" className="underline font-bold">Membership &amp; Plan Settings</Link>, or add {shortfallSlots === 1 ? 'a flat $199 Extra Protected Role Slot' : `${shortfallSlots} Extra Protected Role Slots ($199 each)`} right here—your role fields on this page are saved automatically during checkout.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={buyingPassId !== null}
                    onClick={handleBuyExtraSlotInline}
                    className="shrink-0 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {buyingPassId ? 'Opening Checkout...' : '+ Add Extra Role Slot ($199) →'}
                  </button>
                </div>
              )}
            </div>
          )
        })()}

        <div className="pt-2 flex justify-end">
          {!isPracticeMode && Math.max(0, clampRoleOpenings(jobData.openings_count, 1) - Math.max(0, maxActiveJobs - activeSlotsUsed)) > rolePasses.totalPasses ? (
            <button
              type="button"
              disabled
              className="w-full sm:w-auto rounded-xl bg-slate-300 px-8 py-3.5 text-sm font-extrabold text-slate-600 cursor-not-allowed"
            >
              Add an Extra Protected Role Slot ($199) Above to Publish
            </button>
          ) : (
            <SubmitButton
              pendingText={isPracticeMode ? 'Saving Draft...' : 'Publishing...'}
              className="w-full sm:w-auto rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              {isPracticeMode ? 'Save Practice Mode Draft' : 'Publish Protected Role'}
            </SubmitButton>
          )}
        </div>
      </form>
    </div>
  )
}