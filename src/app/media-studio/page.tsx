'use client'

import React, { useState } from 'react'
import {
  CandidateVisualVignette,
  EmployerVisualVignette,
} from '@/components/InteractiveProductShowcase'

export default function MediaStudioPage() {
  const [cleanMode, setCleanMode] = useState(false)
  const [view, setView] = useState<'candidate' | 'employer' | 'both'>('candidate')

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col justify-center py-10 px-4 sm:px-8">
      {!cleanMode && (
        <div className="max-w-3xl mx-auto w-full mb-4 p-4 rounded-2xl bg-slate-900 border border-slate-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setView('candidate')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                view === 'candidate' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              Candidate Card
            </button>
            <button
              type="button"
              onClick={() => setView('employer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                view === 'employer' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              Employer Card
            </button>
            <button
              type="button"
              onClick={() => setView('both')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                view === 'both' ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              Both Stacked
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCleanMode(true)}
            className="px-4 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-extrabold text-xs cursor-pointer"
          >
            Hide Toolbar for Recording
          </button>
        </div>
      )}

      {cleanMode && (
        <button
          type="button"
          onClick={() => setCleanMode(false)}
          className="fixed top-3 right-3 z-50 px-3 py-1 rounded-lg bg-slate-900/40 hover:bg-slate-900 text-slate-500 hover:text-white text-[10px] font-bold transition-all cursor-pointer"
        >
          Show Toolbar
        </button>
      )}

      <div className="w-full">
        {(view === 'candidate' || view === 'both') && <CandidateVisualVignette />}
        {(view === 'employer' || view === 'both') && <EmployerVisualVignette />}
      </div>
    </div>
  )
}
