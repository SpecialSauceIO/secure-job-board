'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard Runtime Error Boundary]:', error)
  }, [error])

  return (
    <div className="max-w-2xl mx-auto my-8 sm:my-12 p-5 sm:p-8 bg-white rounded-2xl border-2 border-slate-300 shadow-sm text-center space-y-5">
      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 border border-amber-300 flex items-center justify-center mx-auto font-black text-xl">
        !
      </div>
      <div className="space-y-1.5">
        <h2 className="text-xl font-black text-slate-900">
          Temporary Connection Hiccup
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          We hit a brief snag loading this view. Your data and session are completely safe—click below to retry or return to your workspace overview.
        </p>
      </div>
      {error?.message && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600 break-words max-w-lg mx-auto">
          {error.message}
        </div>
      )}
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors cursor-pointer shadow-xs"
        >
          Retry View
        </button>
        <Link
          href="/dashboard"
          className="px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
        >
          Back to Overview
        </Link>
      </div>
    </div>
  )
}
