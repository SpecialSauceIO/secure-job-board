'use server'

import { createClient } from '@/utils/supabase/server'
import { pushToOpsControlPlane } from '@/lib/ops-bridge'

function cleanEnv(val?: string | null): string {
  if (!val) return ''
  return val.trim().replace(/^["']+|["']+$/g, '').trim()
}

export async function submitQuickFeedbackReliable(formData: FormData): Promise<{
  success?: boolean
  referenceId?: string
  deliveredTo?: string
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const feedbackType = (
    (formData.get('feedback_type') as string) || 'Bug'
  ).trim()
  const notes = ((formData.get('notes') as string) || '').trim()
  const pageUrl = ((formData.get('page_url') as string) || '/dashboard').trim()
  const userAgent = (
    (formData.get('user_agent') as string) || 'Unknown Browser'
  ).trim()

  if (!notes) {
    return { error: 'Please enter a short note before sending.' }
  }

  let role = 'unauthenticated'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    role = profile?.role || 'unknown'
  }

  const refId = `FB-${Date.now().toString().slice(-6)}`
  const timeStampStr = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const reporterEmail = (user?.email || 'anonymous@specialsauce.io').trim()

  await pushToOpsControlPlane({
    event_type: 'work_item',
    id: refId,
    work_item_type: feedbackType.toLowerCase().includes('feature')
      ? 'Feature_Request'
      : 'Bug_Defect',
    priority: feedbackType.toLowerCase().includes('bug') ? 'P1_High' : 'P2_Normal',
    subject: `[${feedbackType}] Report on ${pageUrl}`,
    category: feedbackType,
    description: notes,
    reporter_user_id: user?.id || 'anonymous',
    reporter_name: reporterEmail,
    reporter_email: reporterEmail,
    reporter_role: role.toUpperCase(),
    page_url: pageUrl,
    user_agent: userAgent,
  })

  const resendKey = cleanEnv(process.env.RESEND_API_KEY)
  if (!resendKey) {
    return {
      error:
        'RESEND_API_KEY is missing in your environment variables. Add RESEND_API_KEY in Vercel Settings -> Environment Variables.',
    }
  }

  const configuredFrom = cleanEnv(process.env.RESEND_FROM_EMAIL)
  const primaryFrom =
    configuredFrom && !configuredFrom.includes('onboarding@resend.dev')
      ? configuredFrom
      : 'Special Sauce Support <support@specialsauce.io>'

  const configuredTestInbox = cleanEnv(
    process.env.FEEDBACK_TO_EMAIL || process.env.RESEND_TEST_TO_EMAIL
  )

  const appUrl =
    cleanEnv(process.env.NEXT_PUBLIC_SITE_URL).replace(/\/+$/, '') ||
    'https://specialsauce.io'
  const publicLogoBase = appUrl.includes('localhost')
    ? 'https://specialsauce.io'
    : appUrl
  const publicLogoUrl = `${publicLogoBase}/logo.png`
  const fullUrl = pageUrl.startsWith('/') ? `${appUrl}${pageUrl}` : appUrl

  const sendResendEmail = async (toAddr: string, subject: string, html: string, replyToAddr: string) => {
    let res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: primaryFrom,
        to: [toAddr],
        reply_to: replyToAddr,
        subject,
        html,
      }),
    })
    let data = await res.json().catch(() => ({}))
    if (!res.ok && configuredFrom && configuredFrom !== primaryFrom) {
      res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: configuredFrom,
          to: [toAddr],
          reply_to: replyToAddr,
          subject,
          html,
        }),
      })
      data = await res.json().catch(() => ({}))
    }
    return { ok: res.ok, status: res.status, data }
  }

  // 1. Send confirmation email to the user who created the ticket/feedback
  const isRealUserEmail =
    reporterEmail.includes('@') &&
    reporterEmail !== 'anonymous@specialsauce.io' &&
    !reporterEmail.endsWith('@test.com') &&
    !reporterEmail.endsWith('@example.com') &&
    !reporterEmail.endsWith('.test')

  const customerConfirmHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
        <img src="${publicLogoUrl}" alt="Special Sauce" style="height: 48px; width: auto; display: block; margin-bottom: 12px;" />
        <span style="display: inline-block; padding: 4px 10px; background-color: #eef2ff; color: #4338ca; border-radius: 6px; font-size: 12px; font-weight: 800; font-family: monospace;">
          TICKET CONFIRMATION • ${refId}
        </span>
      </div>
      <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 12px 0;">
        We received your ${feedbackType} report [${refId}]
      </h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 14px 0;">
        Thank you for submitting feedback on <strong>Special Sauce</strong>. Your ticket has been logged in our Service Desk under reference ID <strong>${refId}</strong>.
      </p>
      <div style="padding: 16px; background-color: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 8px; margin-bottom: 20px;">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">
          Your Submitted Message (${pageUrl}):
        </div>
        <div style="color: #0f172a; font-size: 14px; font-weight: 600; white-space: pre-wrap;">${notes}</div>
      </div>
      <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0;">
        You can reply directly to this email (keep <strong>[${refId}]</strong> in the subject line) to add additional details to your ticket.
      </p>
      <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
        <a href="${appUrl}/dashboard/support" style="display: inline-block; padding: 10px 18px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 700; border-radius: 10px;">
          Open Support Center →
        </a>
      </div>
    </div>
  `

  const adminAlertHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
        <img src="${publicLogoUrl}" alt="Special Sauce" style="height: 48px; width: auto; display: block; margin-bottom: 12px;" />
        <span style="display: inline-block; padding: 4px 10px; background-color: #fef3c7; color: #92400e; border-radius: 6px; font-size: 12px; font-weight: 800; font-family: monospace;">
          🐞 NEW TICKET • ${refId} (${timeStampStr})
        </span>
      </div>
      <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 12px 0;">
        Quick ${feedbackType} Report [${refId}]
      </h2>
      <p style="color: #475569; font-size: 13px; line-height: 1.6; margin: 0 0 6px 0;">
        <strong>Reporter:</strong> ${reporterEmail} (Role: ${role.toUpperCase()})
      </p>
      <p style="color: #475569; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0;">
        <strong>Page Route:</strong> <code>${pageUrl}</code>
      </p>
      <div style="padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 20px;">
        <div style="color: #0f172a; font-size: 14px; font-weight: 600; white-space: pre-wrap;">${notes}</div>
      </div>
      <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
        <a href="${fullUrl}" style="display: inline-block; padding: 10px 18px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 700; border-radius: 10px;">
          Open Reported Page (${pageUrl}) →
        </a>
      </div>
    </div>
  `

  let deliveredTo = ''

  if (isRealUserEmail) {
    const userRes = await sendResendEmail(
      reporterEmail,
      `[${refId}] Ticket Received: ${feedbackType} Report on ${pageUrl}`,
      customerConfirmHtml,
      'support@specialsauce.io'
    )
    if (userRes.ok) deliveredTo = reporterEmail
  }

  // 2. Also notify support@specialsauce.io (or configuredTestInbox)
  const adminTarget = 'support@specialsauce.io'
  if (adminTarget.toLowerCase() !== reporterEmail.toLowerCase()) {
    const adminRes = await sendResendEmail(
      adminTarget,
      `[${refId}] New ${feedbackType} on ${pageUrl} (${timeStampStr})`,
      adminAlertHtml,
      isRealUserEmail ? reporterEmail : 'support@specialsauce.io'
    )
    if (!deliveredTo && adminRes.ok) deliveredTo = adminTarget
  }

  if (!deliveredTo && configuredTestInbox) {
    const fallbackRes = await sendResendEmail(
      configuredTestInbox,
      `[${refId}] ${feedbackType} on ${pageUrl} (${timeStampStr})`,
      customerConfirmHtml,
      'support@specialsauce.io'
    )
    if (fallbackRes.ok) deliveredTo = configuredTestInbox
  }

  return {
    success: true,
    referenceId: refId,
    deliveredTo: deliveredTo || reporterEmail,
  }
}
