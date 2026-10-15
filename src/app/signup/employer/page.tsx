'use client'

import { signupEmployer } from '@/app/signup/actions'
import Link from 'next/link'
import { useState, use } from 'react'

export default function EmployerSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const resolvedParams = use(searchParams)
  const [emailError, setEmailError] = useState('')

  // Client-side instant firewall for free email providers
  const validateEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value.toLowerCase()
    const freeDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
      'aol.com', 'icloud.com', 'live.com', 'msn.com', 'protonmail.com', 'proton.me'
    ]
    
    if (email.includes('@')) {
      const domain = email.split('@')[1]
      if (freeDomains.includes(domain)) {
        setEmailError('Please use your corporate work email. Free providers are not allowed.')
      } else {
        setEmailError('')
      }
    } else {
      setEmailError('')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 sm:p-8">
      
      <div className="mb-8 flex justify-center">
        <Link href="/" className="group block">
          <img src="/logo.png" alt="Special Sauce Logo" className="h-16 w-auto group-hover:scale-105 transition-transform" />
        </Link>
      </div>

      <div className="w-full max-w-md rounded-2xl bg-white p-8 sm:p-10 shadow-sm border border-slate-200 border-t-4 border-t-emerald-600">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Employer Sign Up</h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">Verified corporate email required.</p>
        </div>

        {resolvedParams.message && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-bold rounded-lg text-center">
            {resolvedParams.message}
          </div>
        )}

        <form action={signupEmployer} className="space-y-6">
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-1.5">Work Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path></svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  onChange={validateEmail}
                  className={`block w-full rounded-lg border ${emailError ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20'} bg-white pl-10 pr-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 sm:text-sm shadow-sm transition-colors`}
                  placeholder="name@company.com"
                />
              </div>
              {emailError && (
                <p className="mt-2 text-xs font-bold text-rose-600">{emailError}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:text-sm shadow-sm"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!!emailError}
              className={`w-full flex justify-center items-center rounded-lg px-4 py-3 text-sm font-bold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${emailError ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-600'}`}
            >
              Create Employer Account
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-6 text-center space-y-4">
        <Link href="/signup" className="text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors block">
          &larr; Back to account selection
        </Link>
      </div>
    </div>
  )
}