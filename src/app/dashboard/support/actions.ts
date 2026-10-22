'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import {
  getUserOpsTickets,
  appendUserTicketReply,
  type UserVisibleTicket,
} from '@/lib/ops-bridge'

export async function fetchMySupportTicketsAction(): Promise<{
  tickets: UserVisibleTicket[]
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { tickets: [], error: 'Not authenticated' }
  }

  const tickets = await getUserOpsTickets(user.id, user.email)
  return { tickets }
}

export async function replyToSupportTicketAction(
  ticketId: string,
  replyText: string
): Promise<{
  ok: boolean
  error?: string
  tickets?: UserVisibleTicket[]
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'You must be signed in to reply to a ticket.' }
  }

  const cleanText = (replyText || '').trim()
  if (!cleanText) {
    return { ok: false, error: 'Please enter a reply message.' }
  }

  const res = await appendUserTicketReply({
    ticketId,
    userId: user.id,
    userEmail: user.email || '',
    replyText: cleanText,
  })

  if (!res.ok) {
    return { ok: false, error: res.error || 'Could not post reply.' }
  }

  const resendKey = (process.env.RESEND_API_KEY || '').trim()
  if (resendKey && user.email) {
    const mainAppUrl = (
      process.env.NEXT_PUBLIC_SITE_URL || 'https://specialsauce.io'
    ).replace(/\/+$/, '')
    const publicLogoUrl = `${mainAppUrl}/logo.png`

    const customerHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
          <img src="${publicLogoUrl}" alt="Special Sauce" style="height: 52px; width: auto; display: block; margin-bottom: 14px;" />
          <div>
            <span style="display: inline-block; padding: 4px 10px; background-color: #0f172a; color: #f8fafc; border-radius: 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; margin-right: 8px;">
              SPECIAL SAUCE™ SUPPORT CENTER
            </span>
            <span style="display: inline-block; padding: 4px 10px; background-color: #eef2ff; color: #4338ca; border-radius: 6px; font-size: 12px; font-weight: 700; font-family: monospace;">
              Ref: ${ticketId}
            </span>
          </div>
        </div>
        <h2 style="color: #0f172a; font-size: 19px; font-weight: 800; margin: 0 0 10px 0;">
          We received your update on ticket ${ticketId}
        </h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 14px 0;">
          Your note has been added to your support ticket thread and our team has been notified. Here is a copy of what you submitted:
        </p>
        <div style="padding: 16px; background-color: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 8px; color: #1e293b; font-size: 14px; line-height: 1.6; margin: 16px 0; white-space: pre-wrap;">${cleanText}</div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 16px 0 0 0;">
          You can view the live status of your ticket anytime in your dashboard Support Center, or reply directly to this email (keeping <strong>[${ticketId}]</strong> in the subject line).
        </p>
        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
          <a href="${mainAppUrl}/dashboard/support" style="display: inline-block; padding: 12px 20px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; border-radius: 10px;">
            View Ticket in Support Center →
          </a>
        </div>
      </div>
    `

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Special Sauce Support <support@specialsauce.io>',
          to: [user.email],
          reply_to: 'support@specialsauce.io',
          subject: `[${ticketId}] Update Confirmation: Your reply has been posted`,
          html: customerHtml,
          text: `We received your update on ticket ${ticketId}:\n\n${cleanText}`,
        }),
      })
    } catch {}
  }

  revalidatePath('/dashboard/support')
  const tickets = await getUserOpsTickets(user.id, user.email)
  return { ok: true, tickets }
}
