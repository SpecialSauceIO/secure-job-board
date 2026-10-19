'use client'

import { useState } from 'react'

export interface FilterState {
  keyword: string;
  workModel: string;
  minSalary: string;
  industry: string;
}

interface JobSearchFiltersProps {
  onSearch: (filters: FilterState) => void;
}

export function JobSearchFilters({ onSearch }: JobSearchFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    keyword: '',
    workModel: 'Any',
    minSalary: '',
    industry: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(filters)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex flex-wrap gap-4 items-end border-slate-300">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Keywords</label>
        <input 
          type="text" name="keyword" value={filters.keyword} onChange={handleChange}
          placeholder="Title, skills, or company" 
          className="w-full rounded-md border-gray-300 bg-white text-gray-900 py-2 px-3 shadow-sm focus:border-indigo-500"
        />
      </div>

      <div className="w-full sm:w-auto">
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Work Model</label>
        <select 
          name="workModel" value={filters.workModel} onChange={handleChange}
          className="w-full rounded-md border-gray-300 bg-white text-gray-900 py-2 px-3 shadow-sm focus:border-indigo-500"
        >
          <option value="Any">Any Location</option>
          <option value="Remote">Remote</option>
          <option value="Hybrid">Hybrid</option>
          <option value="On-Site">On-Site</option>
        </select>
      </div>

      <div className="w-full sm:w-32">
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Min. Salary</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</div>
          <input 
            type="number" name="minSalary" value={filters.minSalary} onChange={handleChange}
            placeholder="50000" 
            className="w-full rounded-md border-gray-300 bg-white text-gray-900 py-2 pl-7 pr-3 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Industry</label>
        <input 
          type="text" name="industry" value={filters.industry} onChange={handleChange}
          placeholder="e.g., Tech, Finance" 
          className="w-full rounded-md border-gray-300 bg-white text-gray-900 py-2 px-3 shadow-sm focus:border-indigo-500"
        />
      </div>

      <button type="submit" className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-2 px-6 rounded-md hover:bg-indigo-700">
        Search Jobs
      </button>
    </form>
  )
}