'use server'
import crypto from 'crypto'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { checkSignupAbuseAndVelocity, recordHandshakeTelemetry } from '@/lib/security-telemetry'
const SIGNUP_OTP_COOKIE = 'ss_signup_otp_challenge'
const FREE_DOMAINS = ['gmail.com','yahoo.com','hotmail.com','outlook.com','aol.com','icloud.com','live.com','msn.com','protonmail.com','proton.me']
function cleanEnvKey(k?: string | null): string { return k ? k.trim().replace(/^["\x27]+|["\x27]+$/g, '').trim() : '' }
function getEncKey(): Buffer { const s = cleanEnvKey(process.env.SUPABASE_SERVICE_ROLE_KEY) || cleanEnvKey(process.env.RESEND_API_KEY) || 'special-sauce-default-secret-key-2026'; return crypto.createHash('sha256').update(s).digest() }
function encJson(obj: object): string { const iv = crypto.randomBytes(12); const c = crypto.createCipheriv('aes-256-gcm', getEncKey(), iv); const e = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]); return Buffer.concat([iv, c.getAuthTag(), e]).toString('base64url') }
function decJson<T>(tok?: string | null): T | null { if (!tok) return null; try { const b = Buffer.from(tok, 'base64url'); const d = crypto.createDecipheriv('aes-256-gcm', getEncKey(), b.subarray(0, 12)); d.setAuthTag(b.subarray(12, 28)); const p = JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8')); return p?.exp && Date.now() > p.exp ? null : (p as T) } catch { return null } }
function maskEmail(e: string): string { const [l, d] = e.split('@'); if (!l || !d) return e; return (l.length <= 2 ? l[0] + '***' : l[0] + '***' + l[l.length - 1]) + '@' + d }
export async function requestAccountSignupOtp(emailInput: string, passwordInput: string, roleInput: 'candidate' | 'employer', selectedPlanInput?: string) {
  const email = (emailInput || '').trim().toLowerCase(); const password = passwordInput || ''; const role = roleInput === 'employer' ? 'employer' : 'candidate'; const selectedPlan = (selectedPlanInput || '').trim().toLowerCase()
  if (!email || !password) return { success: false, error: 'Please enter both your email address and password.' }
  if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters.' }
  if (role === 'employer') { const dom = email.split('@')[1]?.toLowerCase(); if (!dom || FREE_DOMAINS.includes(dom)) return { success: false, error: 'Employers must use a valid corporate work email address.' } }
  const guard = await checkSignupAbuseAndVelocity({ email, role }); if (!guard.allowed) return { success: false, error: guard.error || 'Signup restricted.' }
  const sbUrl = cleanEnvKey(process.env.NEXT_PUBLIC_SUPABASE_URL); const sbAnon = cleanEnvKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); const srvKey = cleanEnvKey(process.env.SUPABASE_SERVICE_ROLE_KEY)
  let existingAccountSignIn = false
  if (sbUrl && sbAnon) {
    const sl = createSupabaseAdminClient(sbUrl, sbAnon, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: ex } = await sl.auth.signInWithPassword({ email, password })
    if (ex?.user) { existingAccountSignIn = true } else if (srvKey) {
      const adm = createSupabaseAdminClient(sbUrl, srvKey, { auth: { persistSession: false, autoRefreshToken: false } })
      const { data: ul } = await adm.auth.admin.listUsers({ page: 1, perPage: 200 })
      if (ul?.users?.some((u) => (u.email || '').trim().toLowerCase() === email)) return { success: false, error: 'An account with this email already exists with a different password. Please click Sign in below or reset your password on the Sign In page.' }
    }
  }
  const otpCode = String(crypto.randomInt(100000, 999999)); const otpHash = crypto.createHmac('sha256', getEncKey()).update(email + ':' + otpCode).digest('hex')
  const token = encJson({ email, password, role, selectedPlan, existingAccountSignIn, otpHash, attempts: 0, exp: Date.now() + 300000 })
  const resendKey = cleanEnvKey(process.env.RESEND_API_KEY); const fb = cleanEnvKey(process.env.RESEND_TEST_TO_EMAIL); const fromAddr = cleanEnvKey(process.env.RESEND_FROM_EMAIL) || 'Special Sauce Security <support@specialsauce.io>'
  if (!resendKey) return { success: false, error: 'RESEND_API_KEY is missing in environment variables.' }
  const isTest = email.endsWith('@test.com') || email.endsWith('@example.com') || email.endsWith('.demo@specialsauce.io')
  const recip = isTest && fb ? fb : email; let routedToFallback = recip !== email
  const html = (note?: string) => '<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:28px;border:1px solid #e2e8f0;border-radius:16px;">' + (note ? '<div style="margin-bottom:14px;padding:8px 12px;background:#fef3c7;color:#92400e;border-radius:8px;font-size:11px;font-weight:700;">' + note + '</div>' : '') + '<h2 style="color:#0f172a;font-size:20px;font-weight:800;">Your 6-Digit Verification Code</h2><p style="color:#475569;font-size:14px;">Enter this 6-digit code to verify <strong>' + email + '</strong> (expires in 5 minutes):</p><div style="background:#f8fafc;border:2px solid #cbd5e1;border-radius:12px;padding:18px;text-align:center;font-family:monospace;font-size:32px;font-weight:900;letter-spacing:0.28em;color:#0f172a;">' + otpCode + '</div></div>'
  const send = (to: string, note?: string) => fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + resendKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: fromAddr, to: [to], subject: '[' + otpCode + '] Your Special Sauce™ verification code', html: html(note) }) })
  try { const r = await send(recip, routedToFallback ? 'Sandbox Routing: OTP for ' + email : undefined); if (!r.ok && fb && fb !== recip) { const r2 = await send(fb, 'Sandbox Fallback: OTP for ' + email); if (!r2.ok) return { success: false, error: 'Could not send verification email.' }; routedToFallback = true } else if (!r.ok) { return { success: false, error: 'Could not send verification email.' } } } catch { return { success: false, error: 'Network error sending verification code.' } }
  const cs = await cookies(); cs.set(SIGNUP_OTP_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 300, sameSite: 'lax' })
  return { success: true, maskedEmail: maskEmail(email), routedToFallback, existingAccountSignIn }
}

export async function verifyAccountSignupOtp(otpInput: string): Promise<{ success: boolean; redirectTo?: string; error?: string }> {
  const startMs = Date.now(); const code = (otpInput || '').replace(/\D/g, '').trim()
  if (code.length !== 6) return { success: false, error: 'Please enter the 6-digit verification code sent to your email.' }
  const cs = await cookies(); const raw = cs.get(SIGNUP_OTP_COOKIE)?.value
  const ch = decJson<{ email: string; password: string; role: 'candidate' | 'employer'; selectedPlan: string; existingAccountSignIn?: boolean; otpHash: string; attempts: number; exp: number }>(raw)
  if (!ch) return { success: false, error: 'Your 6-digit verification code has expired. Please request a new code.' }
  if (ch.attempts >= 5) { cs.delete(SIGNUP_OTP_COOKIE); return { success: false, error: 'Too many invalid verification attempts. Please request a new code.' } }
  const candHash = crypto.createHmac('sha256', getEncKey()).update(ch.email + ':' + code).digest('hex')
  const isMatch = candHash.length === ch.otpHash.length && crypto.timingSafeEqual(Buffer.from(candHash, 'utf8'), Buffer.from(ch.otpHash, 'utf8'))
  if (!isMatch) {
    const next = (ch.attempts || 0) + 1; cs.set(SIGNUP_OTP_COOKIE, encJson({ ...ch, attempts: next }), { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 300, sameSite: 'lax' })
    return { success: false, error: 'Invalid 6-digit verification code (' + (5 - next) + ' attempt(s) remaining).' }
  }
  cs.delete(SIGNUP_OTP_COOKIE); const supabase = await createClient(); const sbUrl = cleanEnvKey(process.env.NEXT_PUBLIC_SUPABASE_URL); const srvKey = cleanEnvKey(process.env.SUPABASE_SERVICE_ROLE_KEY)
  let uid: string | null = null
  if (!ch.existingAccountSignIn && sbUrl && srvKey) {
    const adm = createSupabaseAdminClient(sbUrl, srvKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: ac } = await adm.auth.admin.createUser({ email: ch.email, password: ch.password, email_confirm: true })
    if (ac?.user?.id) uid = ac.user.id
  }
  if (!uid && !ch.existingAccountSignIn) {
    const { data: sd, error: se } = await supabase.auth.signUp({ email: ch.email, password: ch.password })
    if (se && !se.message.toLowerCase().includes('already registered')) return { success: false, error: se.message }
    if (sd?.user?.id) uid = sd.user.id
  }
  const { data: si, error: sie } = await supabase.auth.signInWithPassword({ email: ch.email, password: ch.password })
  if (sie || !si?.user) return { success: false, error: sie?.message || 'Could not establish session after verification.' }
  await supabase.from('profiles').update({ role: ch.role }).eq('id', si.user.id)
  await recordHandshakeTelemetry({ handshakeId: ch.role === 'employer' ? 'employer_auth_signup' : 'candidate_auth_signup', label: ch.role === 'employer' ? 'Employer Auth & Registration' : 'Professional Auth & Registration', platformArea: 'Onboarding & Authentication', ok: true, latencyMs: Date.now() - startMs })
  revalidatePath('/', 'layout')
  if (ch.role === 'employer') return { success: true, redirectTo: (ch.selectedPlan === 'starter' || ch.selectedPlan === 'growth' || ch.selectedPlan === 'enterprise') ? '/dashboard/employer/billing?select=' + encodeURIComponent(ch.selectedPlan) : '/dashboard' }
  return { success: true, redirectTo: (ch.selectedPlan === 'professional' || ch.selectedPlan === 'prestige') ? '/dashboard/billing?select=' + encodeURIComponent(ch.selectedPlan) : '/dashboard' }
}
export async function signupCandidate(formData: FormData) {
  const email = ((formData.get('email') as string) || '').trim(); const password = formData.get('password') as string; const plan = ((formData.get('plan') as string) || '').trim().toLowerCase()
  const res = await requestAccountSignupOtp(email, password, 'candidate', plan)
  if (!res.success) return redirect('/signup/candidate?message=' + encodeURIComponent(res.error || 'Signup failed'))
  return redirect('/signup/candidate?step=otp&plan=' + encodeURIComponent(plan || 'explorer'))
}
export async function signupEmployer(formData: FormData) {
  const email = ((formData.get('email') as string) || '').trim(); const password = formData.get('password') as string; const plan = ((formData.get('plan') as string) || '').trim().toLowerCase()
  const res = await requestAccountSignupOtp(email, password, 'employer', plan)
  if (!res.success) return redirect('/signup/employer?message=' + encodeURIComponent(res.error || 'Signup failed'))
  return redirect('/signup/employer?step=otp' + (plan ? '&plan=' + encodeURIComponent(plan) : ''))
}
