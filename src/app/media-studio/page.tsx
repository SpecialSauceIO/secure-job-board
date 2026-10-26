'use client'

import React, { useState } from 'react'
import { InteractiveProductShowcase } from '@/components/InteractiveProductShowcase'

export default function MediaStudioPage() {
  const [cleanMode, setCleanMode] = useState(false)

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col justify-center py-10 px-4 sm:px-8">
      {!cleanMode && (
        <div className="max-w-5xl mx-auto w-full mb-6 p-4 rounded-2xl bg-slate-900 border border-slate-700 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 block">
              🎬 Google Flow &amp; Promo Capture Studio (Zero-PII Showcase Mode)
            </span>
            <p className="text-xs text-slate-300 mt-0.5">
              Use the tabs below to record crisp 1080p/4K screen captures or screenshots for your marketing videos. Click &ldquo;Hide Studio Bar&rdquo; before recording.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCleanMode(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs cursor-pointer hover:bg-emerald-400 transition-all"
          >
            Hide Studio Bar for Recording (Clean Frame)
          </button>
        </div>
      )}

      {cleanMode && (
        <button
          type="button"
          onClick={() => setCleanMode(false)}
          className="fixed top-3 right-3 z-50 px-3 py-1 rounded-lg bg-slate-900/40 hover:bg-slate-900 text-slate-500 hover:text-white text-[10px] font-bold transition-all cursor-pointer"
        >
          Show Studio Controls
        </button>
      )}

      <InteractiveProductShowcase studioMode={true} />
    </div>
  )
}
