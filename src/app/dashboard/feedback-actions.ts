'use server'

import { createClient } from '@/utils/supabase/server'

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
  const reporterEmail = user?.email || 'anonymous@specialsauce.io'

  const resendKey = cleanEnv(process.env.RESEND_API_KEY)
  if (!resendKey) {
    return {
      error:
        'RESEND_API_KEY is missing in your environment variables. Add RESEND_API_KEY in Vercel Settings -> Environment Variables.',
    }
  }

  const fromAddress =
    cleanEnv(process.env.RESEND_FROM_EMAIL) ||
    'Special Sauce Telemetry <onboarding@resend.dev>'

  const configuredTestInbox = cleanEnv(
    process.env.FEEDBACK_TO_EMAIL || process.env.RESEND_TEST_TO_EMAIL
  )

  // Build candidate recipient priority list so Resend sandbox or domain rules never blackhole a report
  const candidateRecipients = Array.from(
    new Set(
      [
        configuredTestInbox,
        'info@specialsauce.io',
        !reporterEmail.endsWith('@test.com') &&
        !reporterEmail.endsWith('@example.com')
          ? reporterEmail
          : '',
      ].filter(Boolean)
    )
  )

  const appUrl =
    cleanEnv(process.env.NEXT_PUBLIC_SITE_URL) || 'https://specialsauce.io'
  const fullUrl = pageUrl.startsWith('/') ? `${appUrl}${pageUrl}` : appUrl

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="margin-bottom: 16px;">
        <span style="display: inline-block; padding: 4px 10px; background-color: #fef3c7; color: #92400e; border-radius: 6px; font-size: 12px; font-weight: 800; font-family: monospace;">
          🐞 TELEMETRY REPORT • ${refId} (${timeStampStr})
        </span>
      </div>
      <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 12px 0;">
        Quick ${feedbackType} Report [${refId}]
      </h2>
      <p style="color: #475569; font-size: 13px; line-height: 1.6; margin: 0 0 6px 0;">
        <strong>Reporter:</strong> ${reporterEmail} (Role: ${role.toUpperCase()})
      </p>
      <p style="color: #475569; font-size: 13px; line-height: 1.6; margin: 0 0 6px 0;">
        <strong>Page Route:</strong> <code>${pageUrl}</code>
      </p>
      <p style="color: #475569; font-size: 12px; line-height: 1.5; margin: 0 0 16px 0;">
        <strong>Browser / Device:</strong> ${userAgent}
      </p>
      <div style="padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 20px;">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">
          User Feedback Note:
        </div>
        <div style="color: #0f172a; font-size: 14px; font-weight: 600; white-space: pre-wrap;">${notes}</div>
      </div>
      <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
        <a href="${fullUrl}" style="display: inline-block; padding: 10px 18px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 700; border-radius: 10px;">
          Open Reported Page (${pageUrl}) →
        </a>
      </div>
    </div>
  `

  let lastErrorText = ''

  for (const recipient of candidateRecipients) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [recipient],
          subject: `[${refId}] ${feedbackType} on ${pageUrl} (${timeStampStr})`,
          html: htmlBody,
        }),
      })

      const resData = await response.json()

      if (response.ok && resData?.id) {
        console.log(
          `✅ [FEEDBACK DELIVERED] ${refId} -> ${recipient} (Resend ID: ${resData.id})`
        )
        return {
          success: true,
          referenceId: refId,
          deliveredTo: recipient,
        }
      } else {
        lastErrorText =
          resData?.message ||
          resData?.error ||
          `HTTP ${response.status} rejected for ${recipient}`
        console.warn(
          `⚠️ [FEEDBACK RETRY] Resend rejected ${recipient}:`,
          lastErrorText
        )
      }
    } catch (err: any) {
      lastErrorText = err?.message || 'Network error menghubungi Resend API'
    }
  }

  return {
    error: `Email delivery blocked by Resend: ${
      lastErrorText || 'Check RESEND_TEST_TO_EMAIL or domain verification in Resend.'
    }`,
  }
}