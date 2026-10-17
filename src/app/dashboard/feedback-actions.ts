'use server'

import { createClient } from '@/utils/supabase/server'
import { recordOpsWorkItemInternal } from '@/app/dashboard/admin-actions'

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
  let reporterName = 'Platform User'
  let orgContext = ''

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name, subscription_tier')
      .eq('id', user.id)
      .maybeSingle()

    role = profile?.role || 'unknown'
    reporterName = profile?.full_name || user.email || 'Authenticated User'

    if (role === 'employer') {
      const { data: member } = await supabase
        .from('organization_members')
        .select('organizations:organization_id (name, subscription_tier)')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      const orgObj: any = Array.isArray(member?.organizations)
        ? member?.organizations[0]
        : member?.organizations

      if (orgObj?.name) {
        orgContext = `Org: ${orgObj.name} (${orgObj.subscription_tier || 'Standard'})`
      }
    } else if (profile?.subscription_tier) {
      orgContext = `Tier: ${profile.subscription_tier}`
    }
  }

  const isBug = feedbackType.toLowerCase().includes('bug')
  const prefix = isBug ? 'BUG' : 'FEAT'
  const refId = `${prefix}-${Date.now().toString().slice(-6)}`
  const timeStampStr = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const reporterEmail = user?.email || 'anonymous@specialsauce.io'

  // 1. Always log the work item directly into the Admin Ops Triage Queue (/dashboard/admin/ops)
  await recordOpsWorkItemInternal({
    id: refId,
    work_item_type: isBug ? 'Bug_Defect' : 'Feature_Request',
    priority: isBug ? 'P1_High' : 'P2_Normal',
    subject: `${feedbackType} Report on ${pageUrl}`,
    category: feedbackType,
    description: notes,
    reporter_user_id: user?.id || 'anonymous',
    reporter_name: reporterName,
    reporter_email: reporterEmail,
    reporter_role: role.toUpperCase(),
    organization_context: orgContext,
    page_url: pageUrl,
    user_agent: userAgent,
  })

  const resendKey = cleanEnv(process.env.RESEND_API_KEY)
  if (!resendKey) {
    return {
      success: true,
      referenceId: refId,
      deliveredTo: 'Admin Ops Queue (/dashboard/admin/ops)',
    }
  }

  const fromAddress =
    cleanEnv(process.env.RESEND_FROM_EMAIL) ||
    'Special Sauce Telemetry <onboarding@resend.dev>'

  const configuredTestInbox = cleanEnv(
    process.env.FEEDBACK_TO_EMAIL || process.env.RESEND_TEST_TO_EMAIL
  )

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
    cleanEnv(process.env.NEXT_PUBLIC_SITE_URL).replace(/\/+$/, '') ||
    'https://specialsauce.io'
  const publicLogoUrl = `${appUrl}/logo.png`
  const opsUrl = `${appUrl}/dashboard/admin/ops`

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
        <img src="${publicLogoUrl}" alt="Special Sauce" style="height: 48px; width: auto; display: block; margin-bottom: 12px;" />
        <span style="display: inline-block; padding: 4px 10px; background-color: #fef3c7; color: #92400e; border-radius: 6px; font-size: 12px; font-weight: 800; font-family: monospace;">
          🐞 WORK ITEM LOGGED • ${refId} (${timeStampStr})
        </span>
      </div>
      <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 12px 0;">
        Quick ${feedbackType} Report [${refId}]
      </h2>
      <p style="color: #475569; font-size: 13px; line-height: 1.6; margin: 0 0 6px 0;">
        <strong>Reporter:</strong> ${reporterName} (${reporterEmail} • ${role.toUpperCase()})
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
        <a href="${opsUrl}" style="display: inline-block; padding: 12px 20px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 800; border-radius: 10px;">
          Open in Admin Ops Triage Console →
        </a>
      </div>
    </div>
  `

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
          reply_to: reporterEmail,
          subject: `[${refId}] ${feedbackType} on ${pageUrl} (${timeStampStr})`,
          html: htmlBody,
        }),
      })

      const resData = await response.json()

      if (response.ok && resData?.id) {
        return {
          success: true,
          referenceId: refId,
          deliveredTo: `${recipient} + Admin Ops Queue`,
        }
      }
    } catch (err) {
      console.warn('Feedback email dispatch warning:', err)
    }
  }

  return {
    success: true,
    referenceId: refId,
    deliveredTo: 'Admin Ops Queue (/dashboard/admin/ops)',
  }
}