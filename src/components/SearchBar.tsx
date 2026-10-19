'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Maintain local state for text inputs so users can type freely
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [location, setLocation] = useState(searchParams.get('loc') || '')

  // Helper to construct the new URL and trigger a server re-render
  const updateUrl = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Always preserve current text inputs
    if (query.trim()) params.set('q', query.trim())
    else params.delete('q')
    
    if (location.trim()) params.set('loc', location.trim())
    else params.delete('loc')

    // Apply any new dropdown selections
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    
    router.push(`/dashboard/jobs?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Submitting the form just pushes the text input state
    updateUrl({}) 
  }

  return (
    <form onSubmit={handleSearch} className="w-full max-w-4xl mx-auto space-y-3">
      
      {/* Primary Search Row: Keywords & Location */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Job title, skills, or keywords"
            className="block w-full rounded-xl border-2 border-2-slate-300 bg-white pl-10 pr-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-2-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
          />
        </div>

        <div className="relative sm:w-1/3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </div>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, State, or Zip"
            className="block w-full rounded-xl border-2 border-2-slate-300 bg-white pl-10 pr-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-2-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
          />
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto flex justify-center items-center rounded-xl bg-slate-900 px-8 py-3 font-bold text-white shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-all whitespace-nowrap"
        >
          Search Jobs
        </button>
      </div>

      {/* Secondary Filters Row: Dropdowns (Auto-Submit) */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={searchParams.get('model') || ''}
          onChange={(e) => updateUrl({ model: e.target.value })}
          className="block w-full sm:w-48 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm cursor-pointer"
        >
          <option value="">Any Work Model</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">On-site</option>
        </select>

        <select
          value={searchParams.get('ind') || ''}
          onChange={(e) => updateUrl({ ind: e.target.value })}
          className="block w-full sm:w-48 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm cursor-pointer"
        >
          <option value="">Any Industry</option>
          <option value="Technology">Technology</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Finance">Finance</option>
          <option value="Marketing">Marketing</option>
          <option value="Operations">Operations</option>
          <option value="Sales">Sales</option>
        </select>
      </div>
      
    </form>
  )
}