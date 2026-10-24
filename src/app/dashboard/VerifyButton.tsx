'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function VerifyButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleVerification = async () => {
    try {
      setIsLoading(true)
      setErrorMsg(null)

      const response = await fetch('/api/identity/create-session', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to start identity verification. Please try again.')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        setIsLoading(false)
      }
    } catch (error: any) {
      console.error('Verification error:', error)
      setErrorMsg(error?.message || 'Unable to start verification. Please try again.')
      setIsLoading(false)
    }
  }

  const needsTierUpgrade =
    errorMsg &&
    (errorMsg.toLowerCase().includes('explorer') ||
      errorMsg.toLowerCase().includes('professional') ||
      errorMsg.toLowerCase().includes('prestige') ||
      errorMsg.toLowerCase().includes('upgrade') ||
      errorMsg.toLowerCase().includes('plan'))

  return (
    <div className="flex flex-col items-start md:items-end gap-2">
      <button
        onClick={handleVerification}
        disabled={isLoading}
        className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-xs font-extrabold text-white shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isLoading
            ? 'bg-slate-500 cursor-not-allowed'
            : 'bg-slate-900 hover:bg-slate-800 focus:ring-slate-900'
        }`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Opening Stripe Identity...
          </>
        ) : (
          '🔒 Verify Identity with Stripe →'
        )}
      </button>

      <span className="text-[11px] text-slate-500 font-medium">
        Driver&apos;s License, Passport, or State ID • Encrypted by Stripe (never stored on our servers)
      </span>

      {errorMsg && (
        <div className="mt-1 max-w-md rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-900 shadow-2xs">
          <p className="font-bold">{errorMsg}</p>
          {needsTierUpgrade && (
            <Link
              href="/dashboard/billing"
              className="mt-1.5 inline-flex items-center font-extrabold text-rose-800 underline hover:text-rose-950"
            >
              View Candidate Plans (Starts at $3/mo Explorer) →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
