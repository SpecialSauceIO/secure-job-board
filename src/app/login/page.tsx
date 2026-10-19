'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  login,
  lookupAccountEmailHint,
  requestBrandedPasswordReset,
  type AccountHintItem,
} from './actions'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const tokenHash = searchParams.get('token_hash')
  const recoveryType = searchParams.get('type')
  const authCode = searchParams.get('code')

  const emailInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<'login' | 'reset' | 'lookup' | 'new_password'>('login')
  const [selectedHintBadge, setSelectedHintBadge] = useState<string | null>(null)
  const [resetEmail, setResetEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [lookupRole, setLookupRole] = useState<'candidate' | 'employer'>('candidate')
  const [lookupQuery, setLookupQuery] = useState('')
  const [lookupHintItems, setLookupHintItems] = useState<AccountHintItem[]>([])
  const [sendingToken, setSendingToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifyingToken, setIsVerifyingToken] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const verifyIncomingRecoveryToken = async () => {
      if (tokenHash && recoveryType === 'recovery') {
        setIsVerifyingToken(true)
        setMode('new_password')
        setFeedback(null)

        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        })

        setIsVerifyingToken(false)
        if (error) {
          setFeedback({
            type: 'error',
            text:
              'This password recovery link has expired or was already used. Please request a fresh link below.',
          })
          setMode('reset')
        } else {
          setFeedback({
            type: 'success',
            text: '✓ Identity verified! Enter your new password below.',
          })
        }
        return
      }

      if (authCode) {
        setIsVerifyingToken(true)
        setMode('new_password')
        const { error } = await supabase.auth.exchangeCodeForSession(authCode)
        setIsVerifyingToken(false)
        if (!error) {
          setFeedback({
            type: 'success',
            text: '✓ Recovery session verified! Choose your new password below.',
          })
        }
      }
    }

    verifyIncomingRecoveryToken()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('new_password')
        setFeedback({
          type: 'success',
          text: '✓ Recovery session active! Enter your new password below.',
        })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [tokenHash, recoveryType, authCode])

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail || !resetEmail.includes('@')) {
      setFeedback({ type: 'error', text: 'Please enter a valid email address.' })
      return
    }

    setIsLoading(true)
    setFeedback(null)

    const res = await requestBrandedPasswordReset(
      resetEmail.trim(),
      window.location.origin,
      false
    )

    if (res?.error) {
      setFeedback({ type: 'error', text: res.error })
    } else {
      setFeedback({
        type: 'success',
        text:
          res?.message ||
          'Branded Special Sauce password reset link sent! Check your inbox.',
      })
      setResetEmail('')
    }
    setIsLoading(false)
  }

  const handleSendResetToMatchedHint = async (item: AccountHintItem) => {
    setSendingToken(item.encryptedToken)
    const res = await requestBrandedPasswordReset(
      item.encryptedToken,
      window.location.origin,
      true
    )
    setSendingToken(null)

    if (res?.error) {
      setFeedback({ type: 'error', text: res.error })
    } else {
      setFeedback({
        type: 'success',
        text:
          res?.message ||
          `✓ Sent branded recovery link to ${item.maskedEmail}!`,
      })
    }
  }

  const handleSelectHintForLogin = (item: AccountHintItem) => {
    setSelectedHintBadge(item.maskedEmail)
    setFeedback(null)
    setMode('login')
    setTimeout(() => {
      emailInputRef.current?.focus()
    }, 80)
  }

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      setFeedback({
        type: 'error',
        text: 'Password must be at least 6 characters long.',
      })
      return
    }
    if (newPassword !== confirmPassword) {
      setFeedback({
        type: 'error',
        text: 'Passwords do not match. Please double-check both fields.',
      })
      return
    }

    setIsLoading(true)
    setFeedback(null)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      setFeedback({ type: 'error', text: error.message })
      setIsLoading(false)
    } else {
      setFeedback({
        type: 'success',
        text: '✓ Password updated! Redirecting you to your workspace...',
      })
      setTimeout(() => {
        router.replace('/dashboard')
        router.refresh()
      }, 900)
    }
  }

  const handleUsernameLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFeedback(null)
    setLookupHintItems([])

    const res = await lookupAccountEmailHint(lookupRole, lookupQuery)
    if (!res.found) {
      setFeedback({ type: 'error', text: res.message })
    } else {
      setFeedback({ type: 'success', text: res.message })
      setLookupHintItems(res.hintItems || [])
    }
    setIsLoading(false)
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 sm:p-10 shadow-sm border-2 border-2-slate-200">
      <div className="text-center mb-7">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {mode === 'new_password'
            ? 'Choose a new password'
            : mode === 'reset'
            ? 'Reset your password'
            : mode === 'lookup'
            ? 'Find your account email'
            : 'Welcome back'}
        </h2>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          {mode === 'new_password'
            ? 'Enter and confirm your new Special Sauce password below'
            : mode === 'reset'
            ? 'We will send a branded Special Sauce recovery link to your email'
            : mode === 'lookup'
            ? 'Look up a privacy-masked hint of the email linked to your account'
            : 'Securely connecting professionals & employers'}
        </p>
      </div>

      {/* URL Error Banner */}
      {mode === 'login' && urlError && !feedback && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 text-rose-800 border border-rose-300 text-xs font-extrabold space-y-2">
          <p>{urlError}</p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setMode('reset')
                setFeedback(null)
              }}
              className="text-indigo-700 hover:underline cursor-pointer"
            >
              Reset your password →
            </button>
            <span className="text-rose-300">•</span>
            <button
              type="button"
              onClick={() => {
                setMode('lookup')
                setFeedback(null)
              }}
              className="text-indigo-700 hover:underline cursor-pointer"
            >
              Forgot which email you used? →
            </button>
          </div>
        </div>
      )}

      {/* Selected Hint Reminder Banner on Sign-In Screen */}
      {mode === 'login' && selectedHintBadge && (
        <div className="mb-6 p-3.5 rounded-xl bg-indigo-50 text-indigo-950 border border-indigo-300 text-xs font-bold flex items-center justify-between gap-2">
          <span>
            Account Hint:{' '}
            <strong className="font-mono text-indigo-700">
              {selectedHintBadge}
            </strong>{' '}
            (type full email below)
          </span>
          <button
            type="button"
            onClick={() => setSelectedHintBadge(null)}
            className="text-slate-400 hover:text-slate-700 font-black cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Interactive Feedback Banner & Actionable Matched Account Cards */}
      {feedback && (
        <div
          className={`mb-6 p-4 rounded-xl text-xs font-extrabold border space-y-3 ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-300'
              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
          }`}
        >
          <p className="leading-relaxed">{feedback.text}</p>

          {mode === 'lookup' && lookupHintItems.length > 0 && (
            <div className="pt-1 space-y-2">
              {lookupHintItems.map((item) => (
                <div
                  key={item.encryptedToken}
                  className="p-3 rounded-xl bg-white border border-emerald-300 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-black text-slate-900">
                      {item.maskedEmail}
                    </span>
                    <span className="text-[10px] font-sans font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300">
                      {item.roleLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={sendingToken === item.encryptedToken}
                      onClick={() => handleSendResetToMatchedHint(item)}
                      className="py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-indigo-600 text-white text-[11px] font-extrabold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {sendingToken === item.encryptedToken
                        ? 'Sending Link...'
                        : '✉ Send Reset Link'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectHintForLogin(item)}
                      className="py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-extrabold transition-colors cursor-pointer"
                    >
                      Sign In with This →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === 'new_password' ? (
        isVerifyingToken ? (
          <div className="py-8 text-center space-y-3">
            <div className="inline-block w-6 h-6 border-3 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-500">
              Verifying your Special Sauce security token...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSaveNewPassword} className="space-y-5">
            <div>
              <label
                htmlFor="new-password"
                className="block text-sm font-bold text-slate-700 mb-1.5"
              >
                New password
              </label>
              <input
                id="new-password"
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:text-sm transition-all shadow-sm"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-sm font-bold text-slate-700 mb-1.5"
              >
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:text-sm transition-all shadow-sm"
                placeholder="Re-enter your new password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-600 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Updating Password...' : 'Save New Password & Sign In →'}
            </button>
          </form>
        )
      ) : mode === 'reset' ? (
        <form onSubmit={handlePasswordReset} className="space-y-6">
          <div>
            <label
              htmlFor="reset-email"
              className="block text-sm font-bold text-slate-700 mb-1.5"
            >
              Account email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>
              <input
                id="reset-email"
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:text-sm transition-all shadow-sm"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Sending Reset Link...' : 'Send Password Reset Link →'}
            </button>

            <div className="flex items-center justify-between pt-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setFeedback(null)
                }}
                className="text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                ← Back to Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('lookup')
                  setFeedback(null)
                }}
                className="text-indigo-600 hover:underline cursor-pointer"
              >
                Forgot which email you used?
              </button>
            </div>
          </div>
        </form>
      ) : mode === 'lookup' ? (
        <form onSubmit={handleUsernameLookup} className="space-y-5">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 border-2 border-2-slate-200">
            <button
              type="button"
              onClick={() => {
                setLookupRole('candidate')
                setFeedback(null)
                setLookupHintItems([])
              }}
              className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                lookupRole === 'candidate'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Candidate Account
            </button>
            <button
              type="button"
              onClick={() => {
                setLookupRole('employer')
                setFeedback(null)
                setLookupHintItems([])
              }}
              className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                lookupRole === 'employer'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Employer Account
            </button>
          </div>

          <div>
            <label
              htmlFor="lookup-query"
              className="block text-sm font-bold text-slate-700 mb-1.5"
            >
              {lookupRole === 'employer'
                ? 'Company Domain or Organization Name'
                : 'Your Full Name (as listed on your resume)'}
            </label>
            <input
              id="lookup-query"
              type="text"
              required
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:text-sm transition-all shadow-sm"
              placeholder={
                lookupRole === 'employer'
                  ? 'e.g. acmecorp.com or Acme Corp'
                  : 'e.g. Alex Rivera'
              }
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              🔒 For your security, only a masked email hint (e.g.,{' '}
              <code className="font-mono">a***a@gmail.com</code>) is displayed.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-1">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Searching...' : 'Look Up Account Email Hint →'}
            </button>

            <div className="flex items-center justify-between pt-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setFeedback(null)
                  setLookupHintItems([])
                }}
                className="text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                ← Back to Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('reset')
                  setFeedback(null)
                }}
                className="text-indigo-600 hover:underline cursor-pointer"
              >
                Reset password instead →
              </button>
            </div>
          </div>
        </form>
      ) : (
        <form className="space-y-6">
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="email"
                  className="block text-sm font-bold text-slate-700"
                >
                  Email address
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('lookup')
                    setFeedback(null)
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-indigo-600 hover:underline cursor-pointer"
                >
                  Forgot email?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <input
                  ref={emailInputRef}
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:text-sm transition-all shadow-sm"
                  placeholder={
                    selectedHintBadge
                      ? `Enter full email for ${selectedHintBadge}`
                      : 'name@company.com'
                  }
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-bold text-slate-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset')
                    setFeedback(null)
                  }}
                  className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:text-sm transition-all shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-2">
            <button
              formAction={login}
              className="w-full flex justify-center items-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-all cursor-pointer"
            >
              Sign In Securely
            </button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-slate-300"></div>
              <span className="shrink-0 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Or
              </span>
              <div className="flex-grow border-t border-slate-300"></div>
            </div>

            <Link
              href="/signup"
              className="w-full flex justify-center items-center rounded-lg bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2 transition-all"
            >
              Create a new account
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 sm:p-8">
      {/* Brand Header */}
      <div className="mb-8 flex justify-center">
        <Link href="/" className="group block">
          <img
            src="/logo.png"
            alt="Special Sauce Logo"
            className="h-20 w-auto group-hover:scale-105 transition-transform"
          />
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-sm border-2 border-2-slate-200 text-center text-xs font-bold text-slate-400">
            Loading secure sign-in...
          </div>
        }
      >
        <LoginContent />
      </Suspense>

      {/* Footer text */}
      <p className="mt-8 text-center text-xs text-slate-500 font-medium">
        By continuing, you agree to Special Sauce&apos;s{' '}
        <Link href="/terms" className="text-indigo-600 hover:underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-indigo-600 hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  )
}