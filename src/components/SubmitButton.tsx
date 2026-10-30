'use client'

import { useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pendingText?: string
  scrollToTopOnSuccess?: boolean
}

const SCROLL_STORAGE_KEY = 'ss_scroll_top_after_save'

export function SubmitButton({
  children,
  pendingText,
  scrollToTopOnSuccess = true,
  className,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus()
  const wasPendingRef = useRef(false)
  const [showSavedToast, setShowSavedToast] = useState(false)

  const triggerScrollAndToast = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    setShowSavedToast(true)
    const timer = setTimeout(() => setShowSavedToast(false), 3200)
    return () => clearTimeout(timer)
  }

  // Case 1: Parent <form key={...}> remounted after server action revalidatePath
  useEffect(() => {
    if (!scrollToTopOnSuccess || typeof window === 'undefined') return
    try {
      const flagged = sessionStorage.getItem(SCROLL_STORAGE_KEY)
      if (flagged === '1') {
        sessionStorage.removeItem(SCROLL_STORAGE_KEY)
        triggerScrollAndToast()
      }
    } catch {
      // ignore storage errors
    }
  }, [scrollToTopOnSuccess])

  // Case 2: Form stayed mounted and transitioned from pending -> not pending
  useEffect(() => {
    if (!scrollToTopOnSuccess) return

    if (pending) {
      wasPendingRef.current = true
      try {
        sessionStorage.setItem(SCROLL_STORAGE_KEY, '1')
      } catch {
        // ignore storage errors
      }
    } else if (wasPendingRef.current) {
      wasPendingRef.current = false
      try {
        sessionStorage.removeItem(SCROLL_STORAGE_KEY)
      } catch {
        // ignore storage errors
      }
      triggerScrollAndToast()
    }
  }, [pending, scrollToTopOnSuccess])

  return (
    <>
      {showSavedToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/50 text-white shadow-xl animate-fade-in">
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 flex items-center justify-center text-xs font-black">
            ✓
          </span>
          <span className="text-xs font-extrabold tracking-wide text-emerald-300">
            Updates Saved
          </span>
        </div>
      )}
      <button
        {...props}
        disabled={pending || props.disabled}
        className={`${className} flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed`}
      >
        {pending && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {pending && pendingText ? pendingText : children}
      </button>
    </>
  )
}
