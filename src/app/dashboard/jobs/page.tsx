'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { CandidateJobFeed } from '@/components/CandidateJobFeed'
import { searchJobs } from '@/app/dashboard/actions'
import { US_STATES_AND_METROS, US_REMOTE_REGIONS } from '@/constants/usLocations'

export default function CandidateJobsPage() {
  const [query, setQuery] = useState('')
  const [workModel, setWorkModel] = useState('all')
  const [selectedState, setSelectedState] = useState('')
  const [selectedMetro, setSelectedMetro] = useState('')
  const [jobs, setJobs] = useState<any[]>([])
  const [isVerified, setIsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initPage = async () => {
      setIsLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

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
      }

      const initialJobs = await searchJobs('', 'all', '')
      setJobs(initialJobs || [])
      setIsLoading(false)
    }

    initPage()
  }, [])

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
    setJobs(results || [])
    setIsLoading(false)
  }

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
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Discover Blind Roles
          </h1>
          <p className="text-slate-500 mt-1">
            Every listing displays transparent pay (/yr or /hr) and standardized US metro locations while keeping company identities blind until mutual unlock.
          </p>
        </div>

        {/* Search & Cascading US State / Metro Filter Bar */}
        <form
          onSubmit={handleSearch}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-8">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search job title, skills, or industry (e.g. React, Python, SaaS, FinTech)..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-4">
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
                <option value="">All US States & Remote Regions</option>
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
                className="w-full h-full py-2.5 px-4 bg-slate-900 text-white text-sm font-extrabold rounded-xl hover:bg-indigo-600 transition-colors shadow-sm disabled:opacity-50"
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
          <CandidateJobFeed jobs={jobs} isVerified={isVerified} />
        )}
      </div>
    </div>
  )
}