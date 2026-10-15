'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function PitchFilters({ 
  currentStatus, 
  currentDays, 
  currentQuery 
}: { 
  currentStatus: string, 
  currentDays: string, 
  currentQuery: string 
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(currentQuery)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters('q', query)
  }

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/dashboard/employer/pitches?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      
      {/* Search Bar Row */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pipeline by role, candidate skills, or bio..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400"
          />
        </div>
        <button 
          type="submit" 
          className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-indigo-600 transition-colors shadow-sm text-sm"
        >
          Search
        </button>
      </form>

      {/* Dropdown Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:w-48">
          <select 
            value={currentStatus}
            onChange={(e) => updateFilters('status', e.target.value)}
            className="w-full text-sm font-bold text-slate-900 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer bg-slate-50 py-2.5"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Only</option>
            <option value="accepted">Accepted Only</option>
            <option value="declined">Declined Only</option>
          </select>
        </div>

        <div className="relative w-full sm:w-48">
          <select 
            value={currentDays}
            onChange={(e) => updateFilters('days', e.target.value)}
            className="w-full text-sm font-bold text-slate-900 border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer bg-slate-50 py-2.5"
          >
            <option value="">All Time</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="180">Last 180 Days</option>
            <option value="365">Last 365 Days</option>
          </select>
        </div>
      </div>

    </div>
  )
}