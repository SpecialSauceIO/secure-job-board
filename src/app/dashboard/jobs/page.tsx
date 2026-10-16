'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { CandidateJobFeed } from '@/components/CandidateJobFeed'
import { searchJobs } from '@/app/dashboard/actions'
import { toggleBookmarkItem } from '@/app/dashboard/bookmark-actions'
import { US_STATES_AND_METROS, US_REMOTE_REGIONS } from '@/constants/usLocations'

const EMPLOYMENT_TYPES = [
  'Full-Time (W-2)',
  'Contract (1099 / Corp-to-Corp)',
  'Contract-to-Hire',
  'Part-Time',
]

function getJobEmploymentType(job: any): string {
  const rawReqs = Array.isArray(job?.structured_requirements)
    ? job.structured_requirements
    : []
  const metaItem =
    rawReqs.find((r: any) => r && r._ss_job_meta === true) || job?.job_meta || {}
  return job?.employment_type || metaItem?.employment_type || 'Full-Time (W-2)'
}

export default function CandidateJobsPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [workModel, setWorkModel] = useState('all')
  const [employmentType, setEmploymentType] = useState('all')
  const [selectedState, setSelectedState] = useState('')
  const [selectedMetro, setSelectedMetro] = useState('')
  const [rawJobs, setRawJobs] = useState<any[]>([])
  const [savedEmpTypes, setSavedEmpTypes] = useState<string[]>([])
  const [savedJobIds, setSavedJobIds] = useState<string[]>([])
  const [onlyMyDealbreakers, setOnlyMyDealbreakers] = useState(false)
  const [onlySavedJobs, setOnlySavedJobs] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if the user clicked "Saved Roles (X)" from the Dashboard (?saved=true)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('saved') === 'true') {
        setOnlySavedJobs(true)
      }
    }

    const initPage = async () => {
      setIsLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // HARD AUTH GATE: Block unauthenticated Incognito visitors immediately
      if (!user) {
        router.replace('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'employer') {
        router.replace('/dashboard')
        return
      }

      setIsVerified(
        Boolean(
          profile?.identity_verified === true ||
            String(profile?.identity_verified) === 'true' ||
            profile?.is_verified === true ||
            String(profile?.is_verified) === 'true' ||
            profile?.verification_status === 'verified' ||
            profile?.verification_status === 'approved'
        )
      )

      const rawSkills = Array.isArray(profile?.structured_skills)
        ? profile.structured_skills
        : []
      const prefMeta = rawSkills.find(
        (item: any) => item && item._ss_pref_meta === true
      )
      if (
        Array.isArray(prefMeta?.employment_types) &&
        prefMeta.employment_types.length > 0
      ) {
        setSavedEmpTypes(prefMeta.employment_types)
      }
      if (Array.isArray(prefMeta?.saved_job_ids)) {
        setSavedJobIds(prefMeta.saved_job_ids.map(String))
      }

      const initialJobs = await searchJobs('', 'all', '')
      setRawJobs(initialJobs || [])
      setIsLoading(false)
    }

    initPage()
  }, [router])

  const stateObj = US_STATES_AND_METROS.find((s) => s.code === selectedState)
  const metroOptions =
    selectedState === 'REMOTE_US'
      ? US_REMOTE_REGIONS
      : stateObj
      ? stateObj.metros
      : []

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    let locationFilter = ''
    if (selectedMetro) {
      locationFilter = selectedMetro
    } else if (selectedState && selectedState !== 'REMOTE_US') {
      locationFilter = `, ${selectedState}`
    } else if (selectedState === 'REMOTE_US') {
      locationFilter = 'Remote'
    }

    const results = await searchJobs(query, workModel, locationFilter)
    setRawJobs(results || [])
    setIsLoading(false)
  }

  const handleToggleSaveJob = async (jobId: string) => {
    const normalizedId = String(jobId)
    const wasSaved = savedJobIds.includes(normalizedId)
    setSavedJobIds((prev) =>
      wasSaved
        ? prev.filter((id) => id !== normalizedId)
        : [...prev, normalizedId]
    )

    const res = await toggleBookmarkItem(normalizedId, 'job')
    if (!res.error) {
      setSavedJobIds(res.savedIds)
    }
  }

  // Client-side filter for Saved Jobs, Employment Type, & Saved Dealbreakers
  const filteredJobs = rawJobs.filter((job) => {
    const jobId = String(job.uuid || job.id)

    if (onlySavedJobs && !savedJobIds.includes(jobId)) {
      return false
    }

    const jobEmpType = getJobEmploymentType(job)

    if (employmentType !== 'all') {
      if (jobEmpType.toLowerCase() !== employmentType.toLowerCase()) {
        return false
      }
    }

    if (onlyMyDealbreakers && savedEmpTypes.length > 0) {
      const matchesSaved = savedEmpTypes.some(
        (t) => t.toLowerCase() === jobEmpType.toLowerCase()
      )
      if (!matchesSaved) return false
    }

    return true
  })

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
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
            Back to Candidate Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Discover Blind Roles
              </h1>
              <p className="text-slate-500 mt-1">
                Every listing displays transparent pay (/yr or /hr), employment type, and standardized US metro locations while keeping company identities blind until mutual unlock.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setOnlySavedJobs((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                  onlySavedJobs
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                }`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill={onlySavedJobs ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                {onlySavedJobs
                  ? `Showing Saved Roles (${savedJobIds.length})`
                  : `Saved Roles (${savedJobIds.length})`}
              </button>

              {savedEmpTypes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setOnlyMyDealbreakers((prev) => !prev)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                    onlyMyDealbreakers
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {onlyMyDealbreakers
                    ? '✓ Matching My Dealbreakers'
                    : '🛡️ Filter by My Saved Dealbreakers'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search & Cascading US State / Metro / Employment Type Filter Bar */}
        <form
          onSubmit={handleSearch}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Keyword Search */}
            <div className="md:col-span-6">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search job title, skills, or industry (e.g. React, Python, SaaS)..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Work Model Filter */}
            <div className="md:col-span-3">
              <select
                value={workModel}
                onChange={(e) => setWorkModel(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All Work Models</option>
                <option value="remote">Remote Only</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </div>

            {/* Employment Type Filter */}
            <div className="md:col-span-3">
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All Employment Types</option>
                {EMPLOYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* US State Filter */}
            <div className="md:col-span-5">
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value)
                  setSelectedMetro('')
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">All US States &amp; Remote Regions</option>
                <option value="REMOTE_US">🇺🇸 US Remote (By Timezone / Nationwide)</option>
                {US_STATES_AND_METROS.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.name} ({st.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Cascading Metro Area Filter */}
            <div className="md:col-span-5">
              <select
                disabled={!selectedState}
                value={selectedMetro}
                onChange={(e) => setSelectedMetro(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
              >
                <option value="">
                  {!selectedState
                    ? 'Select a state to filter by metro...'
                    : selectedState === 'REMOTE_US'
                    ? 'All US Remote Timezones'
                    : `All Metro Areas in ${selectedState}`}
                </option>
                {metroOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-full py-2.5 px-4 bg-slate-900 text-white text-sm font-extrabold rounded-xl hover:bg-indigo-600 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? '...' : 'Filter Roles'}
              </button>
            </div>
          </div>
        </form>

        {isLoading ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">Loading blind roles...</p>
          </div>
        ) : (
          <CandidateJobFeed
            jobs={filteredJobs}
            isVerified={isVerified}
            savedJobIds={savedJobIds}
            onToggleSaveJob={handleToggleSaveJob}
          />
        )}
      </div>
    </div>
  )
}