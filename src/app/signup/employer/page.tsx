'use client'
import { requestAccountSignupOtp, verifyAccountSignupOtp } from '@/app/signup/actions'
import Link from 'next/link'
import { PublicHeader } from '@/components/PublicHeader'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
export default function EmployerSignupPage({ searchParams }: { searchParams: Promise<{ message?: string; plan?: string; step?: string }> }) {
  const resolvedParams = use(searchParams)
  const selectedPlan = resolvedParams.plan === 'starter' || resolvedParams.plan === 'growth' || resolvedParams.plan === 'enterprise' ? resolvedParams.plan : ''
  const router = useRouter()
  const [step, setStep] = useState<'credentials' | 'otp'>(resolvedParams.step === 'otp' ? 'otp' : 'credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [routedToFallback, setRoutedToFallback] = useState(false)
  const [existingAccountSignIn, setExistingAccountSignIn] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(resolvedParams.message || '')
  const [infoMsg, setInfoMsg] = useState('')
  useEffect(() => {
    if (step === 'otp' || isSubmitting) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) router.replace(selectedPlan ? `/dashboard/employer/billing?select=${selectedPlan}` : '/dashboard')
    })
  }, [router, selectedPlan, step, isSubmitting])
  const validateEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; setEmail(val); const lower = val.toLowerCase()
    const free = ['gmail.com','yahoo.com','hotmail.com','outlook.com','aol.com','icloud.com','live.com','msn.com','protonmail.com','proton.me']
    if (lower.includes('@') && free.includes(lower.split('@')[1])) setEmailError('Please use your corporate work email. Free providers are not allowed.')
    else setEmailError('')
  }
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault(); if (emailError) return; setErrorMsg(''); setInfoMsg(''); setIsSubmitting(true)
    try {
      const res = await requestAccountSignupOtp(email, password, 'employer', selectedPlan)
      if (!res.success) { setErrorMsg(res.error || 'Unable to send verification code.'); setIsSubmitting(false); return }
      setMaskedEmail(res.maskedEmail || email); setRoutedToFallback(Boolean(res.routedToFallback)); setExistingAccountSignIn(Boolean(res.existingAccountSignIn)); setOtpCode(''); setStep('otp')
    } catch { setErrorMsg('Network error while requesting verification code.') } finally { setIsSubmitting(false) }
  }
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setErrorMsg(''); setInfoMsg(''); setIsSubmitting(true)
    try {
      const res = await verifyAccountSignupOtp(otpCode)
      if (!res.success) { setErrorMsg(res.error || 'Invalid 6-digit verification code.'); setIsSubmitting(false); return }
      router.replace(res.redirectTo || '/dashboard')
    } catch { setErrorMsg('Network error verifying code.'); setIsSubmitting(false) }
  }
  const handleResendOtp = async () => {
    if (!email || !password) return; setErrorMsg(''); setInfoMsg(''); setIsSubmitting(true)
    try { const res = await requestAccountSignupOtp(email, password, 'employer', selectedPlan); if (res.success) setInfoMsg('A fresh 6-digit verification code has been sent to your work email.'); else setErrorMsg(res.error || 'Could not resend verification code.') } finally { setIsSubmitting(false) }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:p-8">
        <div className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-10 shadow-sm border border-slate-300 border-t-4 border-t-emerald-600">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-[11px] font-extrabold uppercase tracking-wider mb-3">🏢 Verified Employers &amp; Hiring Teams</span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{step === 'otp' ? 'Verify Your Work Email (6-Digit Code)' : 'Employer Sign Up'}</h2>
            <p className="mt-1.5 text-sm text-slate-500 font-medium">{step === 'otp' ? `Enter the 6-digit verification code sent to ${maskedEmail || email || 'your work email'}.` : 'Use your work email to set up your company account.'}</p>
          </div>
          {step === 'credentials' && (
            <div className="mb-6 p-4 rounded-xl bg-slate-50 border-2 border-slate-300/80 space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2"><span className="text-emerald-600 font-black mt-0.5">✓</span><span><strong className="text-slate-900">Verified, Matched Talent:</strong> Every applicant is ID-verified and matched to your required skills.</span></div>
              <div className="flex items-start gap-2"><span className="text-emerald-600 font-black mt-0.5">✓</span><span><strong className="text-slate-900">Free Inbound &amp; Protected Invites:</strong> Inbound applicants are 100% free. Declined invitations are automatically refunded.</span></div>
              <div className="flex items-start gap-2"><span className="text-emerald-600 font-black mt-0.5">✓</span><span><strong className="text-slate-900">Team Collaboration:</strong> Invite hiring managers or recruiting partners to collaborate.</span></div>
            </div>
          )}
          {errorMsg && <div className="mb-6 p-4 bg-rose-50 border border-rose-300 text-rose-600 text-sm font-bold rounded-lg text-center">{errorMsg}</div>}
          {infoMsg && <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-bold rounded-lg text-center">{infoMsg}</div>}
          {step === 'credentials' ? (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <input type="hidden" name="plan" value={selectedPlan} />
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-1.5">Work Email Address</label>
                  <input id="email" name="email" type="email" required value={email} onChange={validateEmail} className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:text-sm shadow-sm" placeholder="you@company.com" />
                  {emailError && <p className="mt-2 text-xs text-rose-600 font-bold">{emailError}</p>}
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input id="password" name="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full rounded-lg border border-slate-300 bg-white px-4 pr-16 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:text-sm shadow-sm" placeholder="••••••••" minLength={6} />
                    <button type="button" onClick={() => setShowPassword((prev: boolean) => !prev)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-extrabold text-slate-500 hover:text-emerald-600 cursor-pointer">{showPassword ? 'Hide' : 'Show'}</button>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={Boolean(emailError) || isSubmitting} className={`w-full flex justify-center items-center rounded-xl px-4 py-3 text-sm font-extrabold text-white shadow-sm transition-all ${emailError || isSubmitting ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'}`}>
                  {isSubmitting ? 'Sending 6-Digit Verification Code...' : selectedPlan === 'enterprise' ? 'Create Account & Select Enterprise ($1,250/mo) →' : selectedPlan === 'growth' ? 'Create Account & Select Growth ($499/mo) →' : selectedPlan === 'starter' ? 'Create Account & Select Starter ($149/mo) →' : 'Create Employer Account ($25 Once) →'}
                </button>
              </div>
              <p className="text-[11px] text-center text-slate-400 leading-relaxed">By signing up, you agree to our <Link href="/terms" className="underline hover:text-slate-600">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>.</p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {existingAccountSignIn && <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900">We recognized your existing account and sent a 6-digit verification code to sign you right in.</div>}
              {routedToFallback && <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs font-bold text-amber-900">Sandbox test address detected: Your 6-digit verification code was routed to the designated test inbox.</div>}
              <div>
                <label htmlFor="otp" className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5 text-center">6-Digit Email Verification Code</label>
                <input id="otp" name="otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="block w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-4 py-3.5 text-center font-mono text-2xl font-black tracking-[0.35em] text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none" />
              </div>
              <button type="submit" disabled={isSubmitting || otpCode.length !== 6} className="w-full flex justify-center items-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-emerald-500 transition-all cursor-pointer disabled:opacity-50">{isSubmitting ? 'Verifying Code...' : 'Verify 6-Digit Code & Continue →'}</button>
              <div className="flex items-center justify-between pt-2 text-xs font-bold">
                <button type="button" onClick={handleResendOtp} disabled={isSubmitting} className="text-emerald-700 hover:text-emerald-600 cursor-pointer">Resend 6-digit code</button>
                <button type="button" onClick={() => { setStep('credentials'); setErrorMsg(''); setInfoMsg('') }} className="text-slate-500 hover:text-slate-700 cursor-pointer">← Change email</button>
              </div>
            </form>
          )}
        </div>
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-slate-500">Already have an account? <Link href={selectedPlan ? `/login?plan=${selectedPlan}` : '/login'} className="font-bold text-emerald-700 hover:text-emerald-600">Sign in</Link></p>
          <p className="text-xs text-slate-400">Looking for a job? <Link href="/signup/candidate" className="font-semibold text-slate-600 hover:text-slate-900 underline">Create a Professional Account</Link></p>
        </div>
      </div>
    </div>
  )
}
