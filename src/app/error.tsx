'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalAppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Root App Runtime Error Boundary]:', error)
  }, [error])

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12 bg-slate-50">
      <div className="max-w-lg w-full p-8 bg-white rounded-2xl border-2 border-slate-300 shadow-sm text-center space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 border border-amber-300 flex items-center justify-center mx-auto font-black text-xl">
          !
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-black text-slate-900">
            Temporary Connection Hiccup
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            We hit a brief snag loading this page. Click below to retry or return to the Special Sauce home page.
          </p>
        </div>
        {error?.message && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600 break-words">
            {error.message}
          </div>
        )}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-indigo-600 transition-colors cursor-pointer shadow-xs"
          >
            Retry Page
          </button>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
